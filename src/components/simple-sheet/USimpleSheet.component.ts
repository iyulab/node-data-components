import { html, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { UElement } from '@iyulab/components/dist/components/UElement.js';
import { styles } from './USimpleSheet.styles.js';

export interface SheetColumn {
  /** 데이터 키 (getDataAsObjects() 반환시 객체 키로 사용) */
  key?: string;
  /** 헤더 표시 레이블 */
  label?: string;
  /** 열 너비 (px) */
  width?: number;
  /** 읽기 전용 열 */
  readonly?: boolean;
  /** 선택 가능한 옵션 목록 (정적 배열 또는 동적 콜백) */
  options?: string[] | ((row: number, col: number) => string[]);
  /** true이면 목록에 있는 값만 입력 가능 (기본: false = 자유 입력 허용) */
  strict?: boolean;
}

interface CellPos {
  row: number;
  col: number;
}

interface SelectionRange {
  anchor: CellPos;
  focus: CellPos;
}

function normalizeRange(sel: SelectionRange) {
  return {
    minRow: Math.min(sel.anchor.row, sel.focus.row),
    maxRow: Math.max(sel.anchor.row, sel.focus.row),
    minCol: Math.min(sel.anchor.col, sel.focus.col),
    maxCol: Math.max(sel.anchor.col, sel.focus.col),
  };
}

/**
 * USimpleSheet - 심플 스프레드시트 컴포넌트
 *
 * 편집 편의 기능:
 * - Undo/Redo: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
 * - Ctrl+Enter: 편집 확정 후 현재 셀 유지
 * - Shift+Enter: 위로 이동
 * - Home/End: 행 처음/끝 (Ctrl+Home/End: 시트 처음/끝)
 * - Page Up/Down: 10행 단위 이동
 * - Ctrl+A: 전체 선택
 * - Tab 사이클: 마지막 열 → 다음 행 첫 열
 * - Ctrl+D: Fill Down (선택 영역 첫 행 값 아래로 채우기)
 * - Ctrl+R: Fill Right (선택 영역 첫 열 값 오른쪽으로 채우기)
 * - 행/열 헤더 클릭: 전체 행/열 선택
 * - 엑셀 호환 Ctrl+C/V (TSV), Delete/Backspace
 * - 다중 셀 선택: Shift+클릭, Shift+Arrow, 마우스 드래그
 * - columns 미설정시 A, B, C... 자동 헤더
 */
export class USimpleSheet extends UElement {
  static styles = [super.styles, styles];

  /** 초기 데이터 (2D 문자열 배열) */
  @property({ type: Array }) data: string[][] = [];

  /** 열 정의 (미설정시 A, B, C... 자동 헤더) */
  @property({ type: Array }) columns?: SheetColumn[];

  /** 초기 행 수 */
  @property({ type: Number }) rows = 20;

  /** 초기 열 수 (columns 미설정시 사용) */
  @property({ type: Number }) cols = 10;

  /** 읽기 전용 모드 */
  @property({ type: Boolean }) readonly = false;

  @state() private _sel: SelectionRange | null = null;
  @state() private _editing: CellPos | null = null;
  @state() private _editVal = '';
  @state() private _replaceOnEdit = false;

  // @state() 없음 — 직접 requestUpdate() 호출
  private _data: string[][] = [];
  private _colWidths: number[] = [];
  private _isMouseSelecting = false;
  private _containerEl: HTMLElement | null = null;

  // 열 너비 조절
  private _resizing: { col: number; startX: number; startWidth: number; current: number } | null = null;
  private static readonly MIN_COL_WIDTH = 30;
  private static readonly DEFAULT_COL_WIDTH = 80;

  // Undo/Redo 히스토리
  private _history: string[][][] = [];
  private _historyIndex = -1;
  private static readonly HISTORY_LIMIT = 100;

  connectedCallback() {
    super.connectedCallback();
    this._syncData();
    document.addEventListener('mouseup', this._onDocMouseUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('mouseup', this._onDocMouseUp);
    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
  }

  protected willUpdate(changed: Map<string, unknown>) {
    const dataRelated = ['data', 'rows', 'cols', 'columns'].some(k => changed.has(k));
    if (dataRelated) {
      this._syncDataFromProps();
    }
  }

  // ──────────────────────────────────────────
  // 데이터 동기화
  // ──────────────────────────────────────────

  private _syncDataFromProps() {
    const rowCount = Math.max(this.rows, this.data?.length ?? 0);
    const colCount = Math.max(
      this.columns?.length ?? this.cols,
      ...(this.data?.map(r => r?.length ?? 0) ?? [0])
    );

    const newData: string[][] = [];
    for (let r = 0; r < rowCount; r++) {
      const row: string[] = [];
      for (let c = 0; c < colCount; c++) {
        row.push(this.data?.[r]?.[c] ?? '');
      }
      newData.push(row);
    }
    this._data = newData;
    // 외부 데이터 변경 시 히스토리 초기화
    this._history = [this._data.map(r => [...r])];
    this._historyIndex = 0;
    // 열 너비 초기화 (columns.width 우선, 기존 사용자 조절값 유지, 없으면 기본값)
    const prevWidths = this._colWidths;
    this._colWidths = Array.from({ length: colCount }, (_, c) =>
      this.columns?.[c]?.width ?? prevWidths[c] ?? USimpleSheet.DEFAULT_COL_WIDTH
    );
  }

  private _syncData() {
    this._syncDataFromProps();
  }

  private get _rowCount() {
    return this._data.length;
  }

  private get _colCount() {
    return this._data[0]?.length ?? (this.columns?.length ?? this.cols);
  }

  // ──────────────────────────────────────────
  // Undo/Redo
  // ──────────────────────────────────────────

  private _pushHistory() {
    // 현재 인덱스 이후 히스토리 제거 (redo 분기 삭제)
    this._history.splice(this._historyIndex + 1);
    this._history.push(this._data.map(r => [...r]));
    if (this._history.length > USimpleSheet.HISTORY_LIMIT) {
      this._history.shift();
    } else {
      this._historyIndex++;
    }
  }

  private _undo() {
    if (this._historyIndex <= 0) return;
    this._historyIndex--;
    this._data = this._history[this._historyIndex].map(r => [...r]);
    this._emitChange();
    this.requestUpdate();
  }

  private _redo() {
    if (this._historyIndex >= this._history.length - 1) return;
    this._historyIndex++;
    this._data = this._history[this._historyIndex].map(r => [...r]);
    this._emitChange();
    this.requestUpdate();
  }

  // ──────────────────────────────────────────
  // 헤더 유틸리티
  // ──────────────────────────────────────────

  /** 열 인덱스를 A, B, ..., Z, AA, AB, ... 형태로 변환 */
  private _colLabel(c: number): string {
    if (this.columns?.[c]?.label) return this.columns[c].label!;
    let label = '';
    let n = c;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
  }

  private _colWidthStyle(c: number): string {
    const w = this._colWidths[c] ?? USimpleSheet.DEFAULT_COL_WIDTH;
    return `width:${w}px;min-width:${w}px;`;
  }

  // ──────────────────────────────────────────
  // 선택 유틸리티
  // ──────────────────────────────────────────

  private _inSel(r: number, c: number): boolean {
    if (!this._sel) return false;
    const { minRow, maxRow, minCol, maxCol } = normalizeRange(this._sel);
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }

  private _isAnchor(r: number, c: number): boolean {
    return this._sel?.anchor.row === r && this._sel?.anchor.col === c;
  }

  private _isColSelected(c: number): boolean {
    if (!this._sel) return false;
    const { minCol, maxCol } = normalizeRange(this._sel);
    return c >= minCol && c <= maxCol;
  }

  private _isRowSelected(r: number): boolean {
    if (!this._sel) return false;
    const { minRow, maxRow } = normalizeRange(this._sel);
    return r >= minRow && r <= maxRow;
  }

  // ──────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────

  render() {
    return html`
      <div
        class="sheet-container${this._resizing ? ' is-resizing' : ''}"
        tabindex="0"
        ${ref(this._refContainer)}
        @keydown=${this._onContainerKeyDown}
        @focus=${this._onContainerFocus}
        @copy=${this._onCopy}
        @paste=${this._onPaste}
      >
        <div class="sheet-scroll">
          <table
            class="sheet-table"
            @mousedown=${this._onTableMouseDown}
            @mouseover=${this._onTableMouseOver}
            @dblclick=${this._onTableDblClick}
          >
            <thead>
              <tr>
                <th class="corner" @click=${this._onSelectAll}></th>
                ${Array.from({ length: this._colCount }, (_, c) => html`
                  <th
                    class="col-header ${this._isColSelected(c) ? 'col-selected' : ''}"
                    style=${this._colWidthStyle(c)}
                    @mousedown=${(e: MouseEvent) => this._onColHeaderMouseDown(e, c)}
                  >
                    ${this._colLabel(c)}
                    <span
                      class="resize-handle"
                      @mousedown=${(e: MouseEvent) => this._onResizeStart(e, c)}
                    ></span>
                  </th>
                `)}
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: this._rowCount }, (_, r) => html`
                <tr>
                  <td
                    class="row-num ${this._isRowSelected(r) ? 'row-selected' : ''}"
                    @mousedown=${(e: MouseEvent) => this._onRowHeaderMouseDown(e, r)}
                  >${r + 1}</td>
                  ${Array.from({ length: this._colCount }, (_, c) => this._renderCell(r, c))}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private _renderCell(r: number, c: number): TemplateResult {
    const isEditing = this._editing?.row === r && this._editing?.col === c;
    const isSelected = this._inSel(r, c);
    const isAnchor = this._isAnchor(r, c);
    const value = this._data[r]?.[c] ?? '';

    const classes = [
      'cell',
      isSelected ? 'selected' : '',
      isAnchor ? 'anchor' : '',
      isEditing ? 'editing' : '',
    ].filter(Boolean).join(' ');

    return html`
      <td
        class=${classes}
        data-row=${r}
        data-col=${c}
      >
        ${isEditing ? html`
          <input
            class="cell-input"
            .value=${this._editVal}
            @input=${this._onInputChange}
            @keydown=${this._onInputKeyDown}
            @blur=${this._onInputBlur}
          />
        ` : value}
      </td>
    `;
  }

  // ──────────────────────────────────────────
  // ref 콜백
  // ──────────────────────────────────────────

  private _refContainer = (el: Element | undefined) => {
    this._containerEl = (el as HTMLElement) ?? null;
  };

  // ──────────────────────────────────────────
  // 컨테이너 이벤트
  // ──────────────────────────────────────────

  private _onContainerFocus = () => {
    if (!this._sel) {
      this._select(0, 0);
    }
  };

  private _onContainerKeyDown = (e: KeyboardEvent) => {
    if (this._editing) return; // 편집 중이면 input이 처리

    const anchor = this._sel?.anchor ?? { row: 0, col: 0 };

    // ── Undo/Redo ──
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (!this.readonly) {
          if (e.shiftKey) this._redo();
          else this._undo();
        }
        return;
      }
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        if (!this.readonly) this._redo();
        return;
      }
      // Ctrl+A: 전체 선택
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this._sel = {
          anchor: { row: 0, col: 0 },
          focus: { row: this._rowCount - 1, col: this._colCount - 1 },
        };
        this.requestUpdate();
        return;
      }
      // Ctrl+D: Fill Down
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (!this.readonly && this._sel) this._fillDown();
        return;
      }
      // Ctrl+R: Fill Right
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (!this.readonly && this._sel) this._fillRight();
        return;
      }
    }

    // ── 삭제 ──
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (!this.readonly) this._clearSelection();
      return;
    }

    // ── 편집 시작 (F2) ──
    if (e.key === 'F2') {
      e.preventDefault();
      if (!this.readonly && !this._isColReadonly(anchor.col)) {
        this._startEdit(anchor.row, anchor.col);
      }
      return;
    }

    // ── Enter: 아래 이동 / Shift+Enter: 위 이동 ──
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        this._select(Math.max(0, anchor.row - 1), anchor.col);
      } else {
        this._select(Math.min(this._rowCount - 1, anchor.row + 1), anchor.col);
      }
      return;
    }

    // ── Tab: 사이클 이동 ──
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: 왼쪽, 첫 열에서 이전 행 마지막 열로
        if (anchor.col === 0 && anchor.row > 0) {
          this._select(anchor.row - 1, this._colCount - 1);
        } else {
          this._select(anchor.row, Math.max(0, anchor.col - 1));
        }
      } else {
        // Tab: 오른쪽, 마지막 열에서 다음 행 첫 열로
        if (anchor.col === this._colCount - 1) {
          if (anchor.row < this._rowCount - 1) {
            this._select(anchor.row + 1, 0);
          }
        } else {
          this._select(anchor.row, anchor.col + 1);
        }
      }
      return;
    }

    // ── 방향키 이동 ──
    const arrowMoves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (arrowMoves[e.key]) {
      e.preventDefault();
      const [dr, dc] = arrowMoves[e.key];

      if (e.shiftKey && this._sel) {
        // Shift+Arrow: 선택 범위 확장
        const curFocus = this._sel.focus;
        const nextFocus = {
          row: Math.max(0, Math.min(this._rowCount - 1, curFocus.row + dr)),
          col: Math.max(0, Math.min(this._colCount - 1, curFocus.col + dc)),
        };
        this._sel = { anchor: this._sel.anchor, focus: nextFocus };
        this.requestUpdate();
      } else {
        const newRow = Math.max(0, Math.min(this._rowCount - 1, anchor.row + dr));
        const newCol = Math.max(0, Math.min(this._colCount - 1, anchor.col + dc));
        this._select(newRow, newCol);
      }
      return;
    }

    // ── Home/End ──
    if (e.key === 'Home') {
      e.preventDefault();
      if (e.ctrlKey) this._select(0, 0);
      else this._select(anchor.row, 0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      if (e.ctrlKey) this._select(this._rowCount - 1, this._colCount - 1);
      else this._select(anchor.row, this._colCount - 1);
      return;
    }

    // ── Page Up/Down ──
    if (e.key === 'PageUp') {
      e.preventDefault();
      this._select(Math.max(0, anchor.row - 10), anchor.col);
      return;
    }
    if (e.key === 'PageDown') {
      e.preventDefault();
      this._select(Math.min(this._rowCount - 1, anchor.row + 10), anchor.col);
      return;
    }

    // ── 일반 문자 입력 → 편집 시작 ──
    if (!this.readonly && !this._isColReadonly(anchor.col)
        && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      this._startEdit(anchor.row, anchor.col, e.key);
    }
  };

  // ──────────────────────────────────────────
  // 입력 이벤트
  // ──────────────────────────────────────────

  private _onInputChange = (e: Event) => {
    this._editVal = (e.target as HTMLInputElement).value;
  };

  private _onInputKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Escape') {
      e.preventDefault();
      this._cancelEdit();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const pos = this._editing!;
      this._commitEdit();
      if (e.ctrlKey) {
        // Ctrl+Enter: 현재 셀 유지
        this._select(pos.row, pos.col);
      } else if (e.shiftKey) {
        // Shift+Enter: 위로 이동
        this._select(Math.max(0, pos.row - 1), pos.col);
      } else {
        // Enter: 아래 이동
        this._select(Math.min(this._rowCount - 1, pos.row + 1), pos.col);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const pos = this._editing!;
      this._commitEdit();
      if (e.shiftKey) {
        if (pos.col === 0 && pos.row > 0) {
          this._select(pos.row - 1, this._colCount - 1);
        } else {
          this._select(pos.row, Math.max(0, pos.col - 1));
        }
      } else {
        if (pos.col === this._colCount - 1) {
          if (pos.row < this._rowCount - 1) {
            this._select(pos.row + 1, 0);
          } else {
            this._select(pos.row, pos.col);
          }
        } else {
          this._select(pos.row, pos.col + 1);
        }
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const pos = this._editing!;
      this._commitEdit();
      this._select(Math.max(0, pos.row - 1), pos.col);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const pos = this._editing!;
      this._commitEdit();
      this._select(Math.min(this._rowCount - 1, pos.row + 1), pos.col);
      return;
    }
  };

  private _onInputBlur = () => {
    if (this._editing) {
      this._commitEdit();
    }
  };

  // ──────────────────────────────────────────
  // 마우스 이벤트
  // ──────────────────────────────────────────

  private _onTableMouseDown = (e: MouseEvent) => {
    const cell = this._getCellFromEvent(e);
    if (!cell) return;

    e.preventDefault();

    if (this._editing) {
      this._commitEdit();
    }

    const { row, col } = cell;

    if (e.shiftKey && this._sel) {
      this._sel = { anchor: this._sel.anchor, focus: { row, col } };
      this.requestUpdate();
    } else {
      this._select(row, col);
    }

    this._isMouseSelecting = true;
    this._containerEl?.focus();
  };

  private _onTableMouseOver = (e: MouseEvent) => {
    if (!this._isMouseSelecting || !this._sel) return;
    const cell = this._getCellFromEvent(e);
    if (!cell) return;
    this._sel = { anchor: this._sel.anchor, focus: cell };
    this.requestUpdate();
  };

  private _onTableDblClick = (e: MouseEvent) => {
    const cell = this._getCellFromEvent(e);
    if (!cell || this.readonly || this._isColReadonly(cell.col)) return;
    this._startEdit(cell.row, cell.col);
  };

  private _onDocMouseUp = () => {
    this._isMouseSelecting = false;
  };

  /** 열 너비 조절 시작 */
  private _onResizeStart = (e: MouseEvent, col: number) => {
    e.preventDefault();
    e.stopPropagation(); // 열 선택 이벤트 차단
    this._resizing = {
      col,
      startX: e.clientX,
      startWidth: this._colWidths[col] ?? USimpleSheet.DEFAULT_COL_WIDTH,
      current: this._colWidths[col] ?? USimpleSheet.DEFAULT_COL_WIDTH,
    };
    document.addEventListener('mousemove', this._onResizeMove);
    document.addEventListener('mouseup', this._onResizeEnd);
  };

  private _onResizeMove = (e: MouseEvent) => {
    if (!this._resizing) return;
    const dx = e.clientX - this._resizing.startX;
    const newWidth = Math.max(USimpleSheet.MIN_COL_WIDTH, this._resizing.startWidth + dx);
    this._resizing.current = newWidth;
    // 직접 DOM 업데이트로 부드러운 드래그 구현
    const th = this.renderRoot.querySelector(
      `th.col-header:nth-child(${this._resizing.col + 2})`
    ) as HTMLElement | null;
    if (th) {
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
    }
  };

  private _onResizeEnd = () => {
    if (this._resizing) {
      this._colWidths[this._resizing.col] = this._resizing.current;
      this._resizing = null;
      this.requestUpdate(); // 상태 커밋 후 재렌더
    }
    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
  };

  /** 코너 클릭 → 전체 선택 */
  private _onSelectAll = (e: MouseEvent) => {
    e.preventDefault();
    this._sel = {
      anchor: { row: 0, col: 0 },
      focus: { row: this._rowCount - 1, col: this._colCount - 1 },
    };
    this.requestUpdate();
    this._containerEl?.focus();
  };

  /** 열 헤더 클릭 → 전체 열 선택 */
  private _onColHeaderMouseDown = (e: MouseEvent, col: number) => {
    e.preventDefault();
    if (this._editing) this._commitEdit();
    if (e.shiftKey && this._sel) {
      this._sel = {
        anchor: { row: 0, col: this._sel.anchor.col },
        focus: { row: this._rowCount - 1, col },
      };
    } else {
      this._sel = {
        anchor: { row: 0, col },
        focus: { row: this._rowCount - 1, col },
      };
    }
    this.requestUpdate();
    this._containerEl?.focus();
  };

  /** 행 헤더 클릭 → 전체 행 선택 */
  private _onRowHeaderMouseDown = (e: MouseEvent, row: number) => {
    e.preventDefault();
    if (this._editing) this._commitEdit();
    if (e.shiftKey && this._sel) {
      this._sel = {
        anchor: { row: this._sel.anchor.row, col: 0 },
        focus: { row, col: this._colCount - 1 },
      };
    } else {
      this._sel = {
        anchor: { row, col: 0 },
        focus: { row, col: this._colCount - 1 },
      };
    }
    this.requestUpdate();
    this._containerEl?.focus();
  };

  // ──────────────────────────────────────────
  // 클립보드 (copy/paste)
  // ──────────────────────────────────────────

  private _onCopy = (e: ClipboardEvent) => {
    if (!this._sel || this._editing) return; // 편집 중엔 input 기본 복사 허용
    e.preventDefault();
    const tsv = this._selectionToTSV();
    e.clipboardData?.setData('text/plain', tsv);
  };

  private _onPaste = (e: ClipboardEvent) => {
    if (this.readonly || !this._sel) return;
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    this._pasteFromText(text);
  };

  private _selectionToTSV(): string {
    if (!this._sel) return '';
    const { minRow, maxRow, minCol, maxCol } = normalizeRange(this._sel);
    const rows: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const cells: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        cells.push(this._data[r]?.[c] ?? '');
      }
      rows.push(cells.join('\t'));
    }
    return rows.join('\n');
  }

  private _pasteFromText(text: string) {
    if (!this._sel) return;
    const { anchor } = this._sel;

    // 줄바꿈 정규화 후 파싱 (CRLF, LF 모두 처리, trailing newline 제거)
    const pasteRows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/\n$/, '')
      .split('\n')
      .map(row => row.split('\t'));

    const newData = this._data.map(r => [...r]);

    // 그리드 확장 (필요시, columns 정의 시 열 수 제한)
    const neededRows = anchor.row + pasteRows.length;
    const rawNeededCols = anchor.col + Math.max(...pasteRows.map(r => r.length));
    const neededCols = this.columns?.length
      ? Math.min(rawNeededCols, this.columns.length)
      : rawNeededCols;

    while (newData.length < neededRows) {
      newData.push(Array(newData[0]?.length ?? this._colCount).fill(''));
    }
    for (let r = 0; r < newData.length; r++) {
      while (newData[r].length < neededCols) {
        newData[r].push('');
      }
    }

    for (let ri = 0; ri < pasteRows.length; ri++) {
      for (let ci = 0; ci < pasteRows[ri].length; ci++) {
        const r = anchor.row + ri;
        const c = anchor.col + ci;
        if (r < newData.length && c < (newData[r]?.length ?? 0)) {
          newData[r][c] = pasteRows[ri][ci];
        }
      }
    }

    this._data = newData;
    this._pushHistory();
    this._emitChange();
    this.requestUpdate();
  }

  // ──────────────────────────────────────────
  // Fill 기능
  // ──────────────────────────────────────────

  /** Ctrl+D: 선택 영역 첫 행 값을 아래로 채우기 */
  private _fillDown() {
    if (!this._sel) return;
    const { minRow, maxRow, minCol, maxCol } = normalizeRange(this._sel);
    if (minRow === maxRow) return;
    const newData = this._data.map(r => [...r]);
    for (let c = minCol; c <= maxCol; c++) {
      const fillVal = newData[minRow]?.[c] ?? '';
      for (let r = minRow + 1; r <= maxRow; r++) {
        if (newData[r] && c < newData[r].length && !this._isColReadonly(c)) {
          newData[r][c] = fillVal;
        }
      }
    }
    this._data = newData;
    this._pushHistory();
    this._emitChange();
    this.requestUpdate();
  }

  /** Ctrl+R: 선택 영역 첫 열 값을 오른쪽으로 채우기 */
  private _fillRight() {
    if (!this._sel) return;
    const { minRow, maxRow, minCol, maxCol } = normalizeRange(this._sel);
    if (minCol === maxCol) return;
    const newData = this._data.map(r => [...r]);
    for (let r = minRow; r <= maxRow; r++) {
      const fillVal = newData[r]?.[minCol] ?? '';
      for (let c = minCol + 1; c <= maxCol; c++) {
        if (newData[r] && c < newData[r].length && !this._isColReadonly(c)) {
          newData[r][c] = fillVal;
        }
      }
    }
    this._data = newData;
    this._pushHistory();
    this._emitChange();
    this.requestUpdate();
  }

  // ──────────────────────────────────────────
  // 셀 편집
  // ──────────────────────────────────────────

  /**
   * @param typedChar - 타이핑으로 시작할 경우 첫 글자. 미제공시 기존 값 유지.
   */
  private _startEdit(row: number, col: number, typedChar?: string) {
    this._replaceOnEdit = typedChar !== undefined;
    this._editVal = typedChar !== undefined ? typedChar : (this._data[row]?.[col] ?? '');
    this._editing = { row, col };
    this._select(row, col);
    // 렌더 완료 후 input에 포커스 (shadow DOM 내 비동기 렌더링 대응)
    this.updateComplete.then(() => {
      const input = this.renderRoot.querySelector('.cell-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        if (this._replaceOnEdit) {
          const len = input.value.length;
          input.setSelectionRange(len, len);
        } else {
          input.select();
        }
      }
    });
  }

  private _commitEdit() {
    if (!this._editing) return;
    const { row, col } = this._editing;
    const prevVal = this._data[row]?.[col] ?? '';
    const newData = this._data.map(r => [...r]);
    newData[row][col] = this._editVal;
    this._data = newData;
    this._editing = null;
    // 값이 변경된 경우에만 히스토리 기록
    if (this._editVal !== prevVal) {
      this._pushHistory();
      this._emitChange();
    }
    this.requestUpdate();
    this._containerEl?.focus();
  }

  private _cancelEdit() {
    this._editing = null;
    this.requestUpdate();
    this._containerEl?.focus();
  }

  private _clearSelection() {
    if (!this._sel) return;
    const { minRow, maxRow, minCol, maxCol } = normalizeRange(this._sel);
    const newData = this._data.map(r => [...r]);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!this._isColReadonly(c)) newData[r][c] = '';
      }
    }
    this._data = newData;
    this._pushHistory();
    this._emitChange();
    this.requestUpdate();
  }

  // ──────────────────────────────────────────
  // 유틸리티
  // ──────────────────────────────────────────

  private _select(row: number, col: number) {
    this._sel = { anchor: { row, col }, focus: { row, col } };
    this.requestUpdate();
    this._scrollCellIntoView(row, col);
  }

  private _scrollCellIntoView(row: number, col: number) {
    this.updateComplete.then(() => {
      const td = this.renderRoot.querySelector(
        `td[data-row="${row}"][data-col="${col}"]`
      ) as HTMLElement | null;
      td?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  private _getCellFromEvent(e: MouseEvent): CellPos | null {
    const target = (e.target as HTMLElement).closest('td[data-row]') as HTMLElement | null;
    if (!target) return null;
    const row = parseInt(target.dataset.row ?? '-1');
    const col = parseInt(target.dataset.col ?? '-1');
    if (row < 0 || col < 0) return null;
    return { row, col };
  }

  private _isColReadonly(col: number): boolean {
    return this.columns?.[col]?.readonly ?? false;
  }

  private _getColOptions(row: number, col: number): string[] | null {
    const colDef = this.columns?.[col];
    if (!colDef?.options) return null;
    return typeof colDef.options === 'function'
      ? colDef.options(row, col)
      : colDef.options;
  }

  private _filterOptions(options: string[], query: string): string[] {
    if (!query) return options;
    const lower = query.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(lower));
  }

  private _emitChange() {
    this.emit('change', { data: this._data });
  }

  // ──────────────────────────────────────────
  // 공개 API
  // ──────────────────────────────────────────

  /** 현재 데이터를 2D 배열로 반환 */
  getData(): string[][] {
    return this._data.map(r => [...r]);
  }

  /**
   * 정의된 columns의 key를 기준으로 객체 배열로 반환.
   * columns 미설정시 A, B, C... 키를 사용.
   */
  getDataAsObjects(): Record<string, string>[] {
    if (!this.columns?.length) {
      return this._data.map(row =>
        Object.fromEntries(row.map((v, i) => [this._colLabel(i), v]))
      );
    }
    return this._data.map(row =>
      Object.fromEntries(
        this.columns!.map((col, i) => [col.key ?? this._colLabel(i), row[i] ?? ''])
      )
    );
  }

  /** 데이터를 직접 설정하고 재렌더링 */
  setData(data: string[][]) {
    this.data = data;
    this._syncData();
    this.requestUpdate();
  }

  /** 특정 셀 값 설정 */
  setCell(row: number, col: number, value: string) {
    if (row >= 0 && row < this._data.length && col >= 0 && col < this._colCount) {
      const newData = this._data.map(r => [...r]);
      newData[row][col] = value;
      this._data = newData;
      this._pushHistory();
      this._emitChange();
      this.requestUpdate();
    }
  }

  /** 현재 선택 영역 반환 */
  getSelection(): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
    if (!this._sel) return null;
    return normalizeRange(this._sel);
  }

  /** Undo 가능 여부 */
  get canUndo(): boolean { return this._historyIndex > 0; }

  /** Redo 가능 여부 */
  get canRedo(): boolean { return this._historyIndex < this._history.length - 1; }
}
