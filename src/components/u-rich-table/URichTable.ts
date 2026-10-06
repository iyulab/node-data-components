import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import { messages } from '../../utilities/messages.js';
// src/components/u-rich-table/URichTable.component.ts
import { html, svg, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { richTableStyles } from './styles.js';
import type { ColumnDef, CellPosition, SortState, FilterState, RowAction, RichTableEventMap, RowActionEventDetail } from './types.js';
import { effectiveAlign } from './types.js';

import { columnLayout, headerWidth, type ColumnLayout } from './utils/column-layout.js';
import { parseTSV, toTSV } from './utils/clipboard.js';
import { applyFilters, sortRows } from './utils/client-data.js';
import { isImeComposing } from '@iyulab/components/dist/utilities/keyboard.js';
import { copyFromKey, isTextEntry, pasteFromKey } from '@iyulab/components/dist/utilities/clipboard.js';
// The date cell editor (registers `u-date-picker`).
import '@iyulab/components/dist/components/date-picker/UDatePicker.js';

/** 펼침 열의 셀 이동 번호 — 앞쪽 제어 열은 음수다(`_firstCol` 참조). 선택 열은 펼침 열이 있으면 그 앞(-2). */
const EXPAND_COL = -1;
/*
 * 머리 줄과 필터 줄도 셀 이동의 행이다 — 본문 행 번호(0..)는 그대로 두고(편집·선택·복사가 그 번호를 쓴다) 위로 음수.
 * APG Grid: 머리 칸의 위젯(정렬 버튼 · 전체 선택)과 필터 입력은 Tab 정지점이 아니라 셀 이동으로 닿는다.
 */
const HEADER_ROW = -2;
const FILTER_ROW = -1;
const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * 행 삭제 버튼의 휴지통 — 이 컴포넌트 자신의 크롬이라 직접 그린다(`u-data-view` 와 같은 이유).
 * 종전 기호 `⋯` 는 «더 보기 메뉴» 를 약속하는데 누르면 곧바로 `row-delete` 를 냈다.
 */
const DELETE_ICON = svg`<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4M6.8 6.5v4.5M9.2 6.5v4.5"/></svg>`;

@customElement('u-rich-table')
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- typed event listeners (the DOM's own `HTMLMediaElementEventMap` pattern): the merged addEventListener/removeEventListener overloads are implemented by EventTarget
export class URichTable extends LitElement {
  static styles = richTableStyles;

  // --- Properties ---
  /**
   * The table's accessible name, from the host's `aria-label` — like `flex-table`, whose host is the grid. Here the
   * grid is the `<table>` inside the shadow root, which a host attribute does not reach, so it is forwarded; it also
   * names the pagination landmark (`"<name> pagination"`), so two tables on one page have distinct landmarks.
   */
  @property({ attribute: 'aria-label' }) private hostLabel?: string;

  @property({ type: Array }) columns: ColumnDef[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Number }) totalCount = 0;
  @property({ type: Number }) pageSize = 25;
  @property({ type: Number }) currentPage = 1;
  /**
   * Who applies the filter row, sorting and paging.
   * - `'server'` (default): the table emits `filter-change` / `sort-change` / `page-change` and
   *   shows `data` as given — the host runs the query and passes back one page and `totalCount`.
   * - `'client'`: `data` is the whole set; the table filters, sorts and pages it itself
   *   (`totalCount` is ignored, the events still fire). Use it when narrowing an already-loaded
   *   list is the whole interaction. Same name and values as `flex-table`'s `dataMode`.
   */
  @property({ attribute: 'data-mode' }) dataMode: 'client' | 'server' = 'server';
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) emptyMessage = '';
  /** `data-mode="client"` 에서 걸러낸 결과가 비었을 때의 문구 — `data` 자체가 빈 것과 다른 상태다. */
  @property({ type: String }) noMatchMessage = '';
  /** 로딩 표시 문구 */
  @property({ type: String }) loadingMessage = '';
  /** 필터 입력 placeholder */
  @property({ type: String }) filterPlaceholder = '';
  /** 필터 select 의 "전체" 항목 문구 */
  @property({ type: String }) filterAllLabel = '';
  /** 새 행 추가 버튼 문구 */
  @property({ type: String }) addRowLabel = '';
  /**
   * 페이지 정보 문구. (전체, 시작, 끝) 을 받아 문자열을 만든다.
   * 언어마다 어순이 달라 템플릿 문자열이 아니라 함수로 연다.
   */
  @property({ attribute: false })
  pageInfoFormatter: (total: number, start: number, end: number) => string =
    (total, start, end) =>
      messages.text('pageInfo', { total: total.toLocaleString(), start, end });
  @property({ type: Boolean }) selectable = false;
  @property({ type: Boolean }) editable = false;
  @property({ type: Boolean }) addable = false;
  @property({ type: Boolean }) filterable = false;
  @property({ type: Boolean }) expandable = false;
  /** 펼친 행의 상세 — Lit 템플릿, 요소 또는 문자열(Lit 이 그대로 그리는 셋). */
  @property({ attribute: false }) detailRenderer?: (row: Record<string, unknown>) => TemplateResult | HTMLElement | string;
  /**
   * 행 삭제를 다루는 표임을 선언한다. 켜면 행 끝에 삭제 버튼(휴지통, 접근 이름 「행 삭제」)을
   * 그리고, 선택된 행에서 Delete 키도 `row-delete` 를 쏜다. 기본은 꺼짐 — 삭제를 다루지
   * 않는 표가 동작하지 않는 삭제 버튼을 행마다 그리지 않게 한다.
   */
  @property({ type: Boolean }) deletable = false;
  /**
   * 액션 셀에 렌더할 커스텀 액션 목록. 각 액션이 자기 `event` 이름으로 커스텀 이벤트를 쏜다.
   * `deletable` 과 함께 주면 이 목록 뒤에 삭제 버튼이 붙는다.
   */
  @property({ type: Array }) rowActions?: RowAction[];

  // --- Internal State ---
  @state() private selectedIds = new Set<string>();
  @state() private focusedCell: CellPosition | null = null;
  @state() private editingCell: CellPosition | null = null;
  @state() private editValue = '';
  @state() private expandedIds = new Set<string>();
  @state() private sort: SortState | null = null;
  @state() private filters: FilterState = {};

  /** 화면에 보이는 행 — server 모드는 `data` 그대로, client 모드는 걸러·정렬·페이지한 결과. */
  private _view: Record<string, unknown>[] = [];
  /** client 모드에서 걸러진 전체 건수(페이지 나누기 전). */
  private _viewTotal = 0;
  /** client 모드에서 `_id` 없는 행의 위치는 `data` 안의 위치다 — 거르거나 정렬해도 선택이 그 행을 따라간다. */
  private _dataIndex = new Map<Record<string, unknown>, number>();

  /**
   * The number of rows that pass the filter row — in `data-mode="client"` the table's own count
   * across all pages; in the default server mode, `totalCount` (the host's answer). Same name as
   * `flex-table`'s getter; `filter-change` carries the same number as `filteredCount`.
   */
  get filteredRowCount(): number {
    return this.dataMode === 'client'
      ? applyFilters(this.data, this.filters, this.columns).length
      : this.totalCount;
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (this.dataMode !== 'client') {
      this._view = this.data;
      this._dataIndex.clear();
      return;
    }
    this._dataIndex = new Map(this.data.map((row, i) => [row, i]));
    const filtered = applyFilters(this.data, this.filters, this.columns);
    const ordered = this.sort ? sortRows(filtered, this.sort, this.columns) : filtered;
    this._viewTotal = ordered.length;
    const pages = Math.max(1, Math.ceil(ordered.length / this.pageSize));
    if (this.currentPage > pages) this.currentPage = pages;
    const start = (this.currentPage - 1) * this.pageSize;
    this._view = ordered.slice(start, start + this.pageSize);
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    // 다른 편집이 열렸으면(Enter/Tab 이 다음 셀을 편집) 그 편집기가 포커스를 갖는다.
    if (this._focusCellAfterUpdate && !this.editingCell) this._focusFocusedCell();
    this._focusCellAfterUpdate = false;
  }
  /** 편집 칸의 검증 오류 — 우리 문장은 «그릴 때 찾는» 함수로 둔다(런타임 로캘 전환에 따라오게), 소비자 `validator` 문장은 그대로. */
  @state() private validationErrors = new Map<string, string | (() => string)>();
  @state() private rowErrors = new Map<string, string>();

  // --- Public API ---
  setRowError(rowId: string, message: string): void {
    this.rowErrors = new Map(this.rowErrors).set(rowId, message);
  }

  clearRowError(rowId: string): void {
    const next = new Map(this.rowErrors);
    next.delete(rowId);
    this.rowErrors = next;
  }

  /**
   * 선택된 행의 **식별자 집합** — 페이지를 가로질러 누적된 전부.
   *
   * `getSelectedRows()` 는 현재 페이지의 행 객체만 돌려주므로(갖고 있지 않은 행을 만들 수 없다)
   * *"여러 페이지에 걸쳐 고른 뒤 일괄 처리"* 에는 이쪽이 필요하다.
   *
   * ⚠**스냅샷이다.** 내부 집합을 그대로 넘기면 `ReadonlySet` 이 타입 수준 약속일 뿐이라
   * JS 소비자가 `add` 로 내부 상태를 **갱신 신호 없이** 망가뜨릴 수 있다. 복제 비용은
   * 선택 크기에 비례하고 무시할 수준이다.
   */
  get selectedRowIds(): ReadonlySet<string> {
    return new Set(this.selectedIds);
  }

  /**
   * 선택을 **통째로 대체**한다 — 페이지를 가로지르는 누적분까지.
   *
   * 앱이 자기 상태를 정본으로 삼는 경우(외부 저장·복원, 필터 변경 시 정리)의 진입점이다.
   * 현재 페이지에 없는 식별자를 넣어도 된다 — 그 페이지로 이동하면 선택된 것으로 렌더된다.
   *
   * ⚠**같은 집합이면 아무 일도 하지 않는다.** 앱이 `selection-change` 를 받아 자기 상태를
   * 갱신하고 다시 이것을 부르는 것이 자연스러운 배선인데, 무조건 발생시키면 그 자리가
   * **무한 루프**가 된다.
   */
  setSelection(ids: Iterable<string>): void {
    const next = new Set(ids);
    if (next.size === this.selectedIds.size && [...next].every(id => this.selectedIds.has(id))) return;
    this.selectedIds = next;
    this._fireSelectionChange();
  }

  /**
   * 선택을 **전부** 비운다 — 페이지를 가로지르는 누적분까지.
   *
   * 전체선택 체크박스는 «이 페이지»만 다루므로 전역 소거의 자리가 없다. 일괄 처리를 끝낸 뒤
   * 앱이 상태를 되돌리는 경로가 여기다. `selection-change` 를 발생시킨다.
   */
  clearSelection(): void {
    this.setSelection([]);
  }

  /**
   * 행의 식별자. 선택·확장·행 오류 상태가 전부 이 값으로 추적된다.
   *
   * ⚠`_id` 는 이 컴포넌트가 **부여하지 않는다.** 소비자가 넣어 주지 않으면 모든 행의
   * `_id` 가 `undefined` 가 되고, Set 은 그 하나만 담으므로 **한 행을 고르면 전부
   * 골라진다.** 그래서 없을 때는 위치를 대신 쓴다 — 다만 위치 기반 식별은 데이터가
   * 재정렬·재페이징되면 **선택이 다른 행으로 옮겨간다.** 정렬/필터/페이지가 소비자
   * 책임인 컴포넌트이므로, 실제 사용에서는 `_id` 를 주는 것이 옳다.
   */
  /**
   * Dispatches one of {@link RichTableEventMap}'s events — bubbling and composed. Every named event goes
   * through here, so a detail that drifts from the map fails to compile.
   */
  private _emit<K extends keyof RichTableEventMap>(type: K, detail: RichTableEventMap[K]['detail']): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private _rowId(row: Record<string, unknown>, index: number): string {
    const id = row._id;
    if (id !== undefined && id !== null) return String(id);
    this._warnMissingRowId();
    return `#${this.dataMode === 'client' ? (this._dataIndex.get(row) ?? index) : index}`;
  }

  private _warnedMissingRowId = false;
  private _warnMissingRowId(): void {
    if (this._warnedMissingRowId) return;
    this._warnedMissingRowId = true;
    console.warn(
      '[@iyulab/data-components] u-rich-table: rows have no `_id`, so selection is tracked ' +
      'by **position**. Re-sorting or re-paging the data moves the selection to a different ' +
      'row. Give every row a unique `_id`.',
    );
  }

  /**
   * **현재 페이지의** 선택된 행. 서버 페이징에서 다른 페이지의 선택분은 여기 없다 —
   * 이 컴포넌트가 갖고 있지 않은 행을 돌려줄 수는 없기 때문이다.
   * 페이지를 가로지르는 선택 집합이 필요하면 {@link selectedRowIds} 를 쓴다.
   */
  getSelectedRows(): Record<string, unknown>[] {
    return this._view.filter((row, i) => this.selectedIds.has(this._rowId(row, i)));
  }

  /** 이 페이지 행들의 식별자. 전체선택/해제가 «이 페이지» 범위임을 정의하는 값이다. */
  private _pageRowIds(): string[] {
    return this._view.map((row, i) => this._rowId(row, i));
  }

  /** 현재 페이지에서 선택된 행 수 — 전체선택 체크박스의 «분자». */
  private get _selectedOnPage(): number {
    return this._pageRowIds().reduce((n, id) => n + (this.selectedIds.has(id) ? 1 : 0), 0);
  }

  // --- Rendering ---

  /**
   * 선언된 열 폭을 **그대로 지킬 수 있는가** — `table-layout: fixed` 와, 유연 열이 있으면 표의 하한.
   * 판정 규칙과 근거는 `utils/column-layout.ts`(모든 열이 절대 `width` 또는 절대 `minWidth` 를 알 때만).
   *
   * 숫자 폭(`width: 150`)은 px 다 — flex-table 과 같은 어휘다. 종전에는 인라인 style 이
   * `width: 150` 이 되어 브라우저가 버렸다.
   *
   * 계약은 `tests/browser/rich-table-column-width.browser.test.ts` 가 고정한다.
   */
  private get _layout(): ColumnLayout {
    return columnLayout(this.columns, {
      checkbox: this.selectable,
      expand: this.expandable,
      actions: this._hasActionsColumn,
    });
  }

  render(): TemplateResult {
    return html`
      ${this._renderToolbar()}
      <div class="table-wrap">
        <table role="grid" aria-label=${this.hostLabel || nothing} class=${this._layout.fixed ? 'fixed-cols' : ''} style=${this._layout.minTableWidth ? `min-width: ${this._layout.minTableWidth}` : nothing}>
          ${this._renderHeader()}
          <tbody>
            ${this.filterable && this.columns.some(c => c.filterable) ? this._renderFilterRow() : ''}
            ${this._renderBody()}
            ${this.addable ? this._renderNewRow() : ''}
          </tbody>
        </table>
      </div>
      ${this._renderPagination()}
    `;
  }

  /**
   * ⚠**두 숫자를 섞지 않는다.** 체크박스는 «이 페이지»를 켜고 끄므로 그 상태도 페이지 기준이고,
   * 라벨의 건수는 페이지를 가로지르는 **누적**이다. 종전에는 분자만 누적이고 분모가 페이지라
   * 다른 페이지의 선택분이 이 페이지의 체크 상태로 새어 나왔다 — 페이지 1을 전량 선택하고
   * 넘어가면 페이지 2에서 아무것도 고르지 않았는데 체크박스가 켜져 보였고, 그것을 끄면
   * 페이지 1의 선택이 조용히 사라졌다.
   */
  private _renderToolbar(): TemplateResult {
    const total = this.selectedIds.size;
    const onPage = this._selectedOnPage;
    const crossesPages = total > onPage;
    return html`
      <div class="toolbar ${this._toolbarIsEmpty ? 'empty' : ''}">
        ${this.selectable && total > 0 ? html`
          <div class="selection-info">
            <span>${crossesPages
              ? messages.text('selectedAcrossPages', { count: total, onPage })
              : messages.text('selected', { count: total })}</span>
          </div>
          <slot name="bulk-actions"></slot>
        ` : ''}
        <div style="flex:1"></div>
        <slot name="toolbar-end" @slotchange=${this._onToolbarEndSlotChange}></slot>
        ${this.addable ? html`
          <button class="btn btn-success" @click=${this._onAddRowClick}>${this.addRowLabel || messages.text('addRow')}</button>
        ` : ''}
      </div>
    `;
  }

  /** `toolbar-end` 에 무엇이 꽂혀 있는가 — 비어 있으면 툴바 줄 자체를 접는다. */
  @state() private _hasToolbarEnd = false;

  private _onToolbarEndSlotChange = (e: Event) => {
    this._hasToolbarEnd = (e.target as HTMLSlotElement).assignedNodes({ flatten: true })
      .some((n) => n.nodeType === Node.ELEMENT_NODE || (n.textContent ?? '').trim() !== '');
  };

  /**
   * 보여 줄 것이 없는 툴바는 **빈 띠**가 된다 — 선택형 표에서는 종전에 전체 선택 체크박스 하나만 든 줄이 머리글 위에 떠
   * 행의 체크박스와 x 가 어긋났다. 그 체크박스는 이제 머리글 칸에 있다(아래).
   */
  private get _toolbarIsEmpty(): boolean {
    return !(this.selectable && this.selectedIds.size > 0) && !this.addable && !this._hasToolbarEnd;
  }

  /** 머리글 정렬 = `headerAlign`, 없으면 셀의 실효 정렬 — 숫자 열은 머리글과 값이 같은 가장자리에 붙어야 훑어 읽힌다. */
  private _headerAlign(col: ColumnDef) {
    return col.headerAlign ?? effectiveAlign(col);
  }

  private _headerStyle(col: ColumnDef): string {
    const align = this._headerAlign(col);
    const width = headerWidth(col);
    return [width ? `width: ${width}` : '', align !== 'start' ? `text-align: ${align}` : '']
      .filter(Boolean).join('; ');
  }

  private _renderHeader(): TemplateResult {
    const onPage = this._selectedOnPage;
    return html`
      <thead>
        <tr>
          ${this.selectable ? html`<th class="checkbox-cell" data-cell data-row=${HEADER_ROW} data-col=${this._selectCol} tabindex=${this._isTabStop(HEADER_ROW, this._selectCol) ? '0' : '-1'} @focusin=${() => this._onCellFocus(HEADER_ROW, this._selectCol)}>
            <!-- 전체 선택은 행 체크박스와 **같은 열**에 둔다 — 체크 상태는 «이 페이지» 기준이다(툴바 주석 참조). -->
            <label class="checkbox-hit">
              <input type="checkbox" tabindex="-1"
                aria-label=${messages.text('selectAllOnPage')}
                .checked=${this._view.length > 0 && onPage === this._view.length}
                .indeterminate=${onPage > 0 && onPage < this._view.length}
                @change=${this._onSelectAll} />
            </label>
          </th>` : ''}
          ${this.expandable ? html`<th class="expand-cell" data-cell data-row=${HEADER_ROW} data-col=${EXPAND_COL} tabindex=${this._isTabStop(HEADER_ROW, EXPAND_COL) ? '0' : '-1'} @focusin=${() => this._onCellFocus(HEADER_ROW, EXPAND_COL)}></th>` : ''}
          ${this.columns.map((col, colIdx) => html`
            <th data-cell data-row=${HEADER_ROW} data-col=${colIdx} tabindex=${this._isTabStop(HEADER_ROW, colIdx) ? '0' : '-1'} @focusin=${() => this._onCellFocus(HEADER_ROW, colIdx)}
              class=${col.sortable ? 'sortable' : ''}
              style=${this._headerStyle(col)}
              aria-sort=${col.sortable
                ? (this.sort?.field === col.key ? (this.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none')
                : nothing}>
              ${col.sortable
                // 정렬은 머리 칸을 채우는 버튼이다 — 클릭만 받는 th 는 키보드로 닿지 않았다.
                ? html`<button type="button" class="sort-button" part="sort-button" tabindex="-1"
                    style=${this._headerAlign(col) === 'end' ? 'justify-content: flex-end' : this._headerAlign(col) === 'center' ? 'justify-content: center' : ''}
                    @click=${() => this._onSortClick(col.key)}>
                    ${col.label}
                    ${this.sort?.field === col.key ? html`
                      <span class="sort-indicator">${this.sort.direction === 'asc' ? '▲' : '▼'}</span>
                    ` : ''}
                  </button>`
                : col.label}
            </th>
          `)}
          ${this._hasActionsColumn ? html`<th class="actions-cell" data-cell data-row=${HEADER_ROW} data-col=${this._actionsCol} tabindex=${this._isTabStop(HEADER_ROW, this._actionsCol) ? '0' : '-1'} @focusin=${() => this._onCellFocus(HEADER_ROW, this._actionsCol)}></th>` : ''}
        </tr>
      </thead>
    `;
  }

  private _renderFilterRow(): TemplateResult {
    return html`
      <tr class="filter-row">
        ${this.selectable ? html`<td data-cell data-row=${FILTER_ROW} data-col=${this._selectCol} tabindex=${this._isTabStop(FILTER_ROW, this._selectCol) ? '0' : '-1'} @focusin=${() => this._onCellFocus(FILTER_ROW, this._selectCol)}></td>` : ''}
        ${this.expandable ? html`<td data-cell data-row=${FILTER_ROW} data-col=${EXPAND_COL} tabindex=${this._isTabStop(FILTER_ROW, EXPAND_COL) ? '0' : '-1'} @focusin=${() => this._onCellFocus(FILTER_ROW, EXPAND_COL)}></td>` : ''}
        ${this.columns.map((col, colIdx) => html`
          <td data-cell data-row=${FILTER_ROW} data-col=${colIdx} tabindex=${this._isTabStop(FILTER_ROW, colIdx) ? '0' : '-1'} @focusin=${() => this._onCellFocus(FILTER_ROW, colIdx)}>
            ${col.filterable ? (
              col.filterType === 'select' && col.options
                ? html`<select tabindex="-1" aria-label=${messages.text('filterColumn', { col: col.label })}
                    @keydown=${this._onFilterControlKeyDown}
                    @change=${(e: Event) => this._onFilterChange(col.key, (e.target as HTMLSelectElement).value)}>
                    <option value="">${this.filterAllLabel || messages.text('filterAll')}</option>
                    ${col.options.map(o => html`<option value=${o.value}>${o.label}</option>`)}
                  </select>`
                : html`<input tabindex="-1"
                    aria-label=${messages.text('filterColumn', { col: col.label })}
                    @keydown=${this._onFilterControlKeyDown}
                    placeholder=${this.filterPlaceholder || messages.text('filterPlaceholder')}
                    @input=${(e: Event) => this._onFilterChange(col.key, (e.target as HTMLInputElement).value)} />`
            ) : ''}
          </td>
        `)}
        ${this._hasActionsColumn ? html`<td data-cell data-row=${FILTER_ROW} data-col=${this._actionsCol} tabindex=${this._isTabStop(FILTER_ROW, this._actionsCol) ? '0' : '-1'} @focusin=${() => this._onCellFocus(FILTER_ROW, this._actionsCol)}></td>` : ''}
      </tr>
    `;
  }

  private _renderBody(): TemplateResult | TemplateResult[] {
    if (this.loading) {
      return html`<tr><td colspan=${this._colSpan()}><div class="loading-overlay">${this.loadingMessage || messages.text('loading')}</div></td></tr>`;
    }
    if (this._view.length === 0) {
      // client 모드에서 데이터는 있는데 거른 결과가 비었으면 «일치 없음» — «데이터 없음» 과 다른 다음 행동(조건 완화)을 가리킨다.
      const noMatch = this.dataMode === 'client' && this.data.length > 0;
      const text = noMatch ? (this.noMatchMessage || messages.text('noMatch')) : (this.emptyMessage || messages.text('empty'));
      return html`<tr><td colspan=${this._colSpan()}><div class="empty-message">${text}</div></td></tr>`;
    }
    return this._view.map((row, rowIdx) => {
      const rowId = this._rowId(row, rowIdx);
      const isSelected = this.selectedIds.has(rowId);
      const isExpanded = this.expandedIds.has(rowId);
      const hasError = this.rowErrors.has(rowId);

      return html`
        <tr class="${isSelected ? 'selected' : ''} ${hasError ? 'error' : ''} ${this.editingCell?.rowIndex === rowIdx ? 'editing' : ''}">
          ${this.selectable ? html`
            <td class="checkbox-cell ${this._isFocusedCell(rowIdx, this._selectCol) ? 'focused-cell' : ''}"
              data-cell data-row=${rowIdx} data-col=${this._selectCol}
              tabindex=${this._isTabStop(rowIdx, this._selectCol) ? '0' : '-1'}
              @focusin=${() => this._onCellFocus(rowIdx, this._selectCol)}>
              <!-- ⚠라벨은 «장식»이 아니라 포인터 타깃이다 — 네이티브 체크박스는 13x13 이라
                   WCAG 2.2 SC 2.5.8 의 24px 하한에 못 미치는데, 입력 자체에 치수를 주면
                   브라우저가 체크 글리프를 함께 키워 시각이 바뀐다. 라벨을 누르면 네이티브가
                   토글해 주므로 «보이는 것은 그대로, 잡히는 영역만 24px» 이 된다.
                   ⚠체크박스는 Tab 정지점이 아니다(tabindex=-1) — 그리드는 하나의 Tab 정지점이고 이 셀은 화살표로 닿는다. -->
              <label class="checkbox-hit">
                <input type="checkbox" tabindex="-1" .checked=${isSelected}
                  aria-label=${messages.text('selectRow')}
                  @change=${() => this._onRowSelect(rowId)}
                  @click=${(e: MouseEvent) => e.shiftKey && this._onShiftSelect(rowIdx)} />
              </label>
            </td>
          ` : ''}
          ${this.expandable ? html`
            <td class="expand-cell ${this._isFocusedCell(rowIdx, EXPAND_COL) ? 'focused-cell' : ''}"
              data-cell data-row=${rowIdx} data-col=${EXPAND_COL}
              tabindex=${this._isTabStop(rowIdx, EXPAND_COL) ? '0' : '-1'}
              @focusin=${() => this._onCellFocus(rowIdx, EXPAND_COL)}>
              <button type="button" class="expand-button" tabindex="-1" aria-expanded=${isExpanded ? 'true' : 'false'}
                aria-label=${messages.text(isExpanded ? 'collapseRow' : 'expandRow')}
                @click=${() => this._onExpandToggle(row, rowId)}>${isExpanded ? '▼' : '▶'}</button>
            </td>
          ` : ''}
          ${this.columns.map((col, colIdx) => this._renderCell(row, rowIdx, col, colIdx))}
          ${this._hasActionsColumn ? html`<td class="actions-cell ${this._isFocusedCell(rowIdx, this._actionsCol) ? 'focused-cell' : ''}"
            data-cell data-row=${rowIdx} data-col=${this._actionsCol}
            tabindex=${this._isTabStop(rowIdx, this._actionsCol) ? '0' : '-1'}
            @focusin=${() => this._onCellFocus(rowIdx, this._actionsCol)}
            @keydown=${this._onActionsKeyDown}>
            ${(this.rowActions ?? []).map(action => html`
              <button type="button" class="row-action" tabindex="-1" title=${action.label} aria-label=${action.label}
                @click=${() => this._onRowAction(action, row)}>${action.icon ?? action.label.charAt(0)}</button>
            `)}
            ${this.deletable ? html`<button type="button" class="row-delete" tabindex="-1" aria-label=${messages.text('deleteRow')}
              title=${messages.text('deleteRow')} @click=${() => this._onRowDelete(row)}>${DELETE_ICON}</button>` : ''}
          </td>` : ''}
        </tr>
        ${isExpanded && this.detailRenderer ? html`
          <tr class="detail-row">
            <td colspan=${this._colSpan()}>${this.detailRenderer(row)}</td>
          </tr>
        ` : ''}
        ${hasError ? html`
          <tr><td colspan=${this._colSpan()} class="row-error-cell">
            ${this.rowErrors.get(rowId)}
          </td></tr>
        ` : ''}
      `;
    });
  }

  private _renderCell(
    row: Record<string, unknown>,
    rowIdx: number,
    col: ColumnDef,
    colIdx: number
  ): TemplateResult {
    const isEditing = this.editingCell?.rowIndex === rowIdx && this.editingCell?.colIndex === colIdx;
    const isFocused = this.focusedCell?.rowIndex === rowIdx && this.focusedCell?.colIndex === colIdx;
    const value = row[col.key];

    if (isEditing && col.editable) {
      const stored = this.validationErrors.get(`${rowIdx}-${colIdx}`);
      const validationError = typeof stored === 'function' ? stored() : stored;
      if (col.type === 'select' && col.options) {
        return html`
          <td>
            <select class="cell-edit-input" aria-label=${col.label} @change=${this._onCellEditConfirm} @keydown=${this._onEditKeyDown}>
              ${col.options.map(o => html`<option value=${o.value} ?selected=${o.value === String(value)}>${o.label}</option>`)}
            </select>
          </td>
        `;
      }
      if (col.type === 'date') {
        // `u-date-picker`, not the native date input: that one shows the browser's UI language
        // (`10/02/2026` in an English browser). The picker's text box reads and shows `YYYY-MM-DD`
        // with a calendar beside it; its value is the same ISO day string the native input gave.
        return html`
          <td>
            <u-date-picker class="cell-edit-input ${validationError ? 'invalid' : ''}" size="sm" aria-label=${col.label}
              .value=${/^\d{4}-\d{2}-\d{2}$/.test(this.editValue) ? this.editValue : ''}
              @change=${this._onDateEditorChange}
              @keydown=${this._onEditKeyDown}
              @blur=${() => this._onEditorBlur(rowIdx, colIdx)}></u-date-picker>
            ${validationError ? html`<div class="validation-error">${validationError}</div>` : ''}
          </td>
        `;
      }
      return html`
        <td>
          <!-- 편집기의 이름은 그 열의 머리글이다(그리드 셀의 이름이 그것이듯) — 이름이 없으면 «편집 상자» 만 들린다. -->
          <input class="cell-edit-input ${validationError ? 'invalid' : ''}" aria-label=${col.label}
            aria-invalid=${validationError ? 'true' : nothing}
            type=${col.type === 'number' ? 'number' : 'text'}
            .value=${this.editValue}
            @input=${(e: Event) => this.editValue = (e.target as HTMLInputElement).value}
            @keydown=${this._onEditKeyDown}
            @blur=${() => this._onEditorBlur(rowIdx, colIdx)} />
          ${validationError ? html`<div class="validation-error">${validationError}</div>` : ''}
        </td>
      `;
    }

    return html`
      <td class=${isFocused ? 'focused-cell' : ''}
        data-cell
        data-row=${rowIdx}
        data-col=${colIdx}
        tabindex=${this._isTabStop(rowIdx, colIdx) ? '0' : '-1'}
        style=${effectiveAlign(col) !== 'start' ? `text-align: ${effectiveAlign(col)}` : ''}
        @focus=${() => this._onCellFocus(rowIdx, colIdx)}
        @click=${() => this._onCellClick(rowIdx, colIdx)}
        @dblclick=${() => col.editable && this._onCellDblClick(rowIdx, colIdx, value)}>
        ${this._renderCellContent(col, value, row)}
      </td>
    `;
  }

  private _renderCellContent(col: ColumnDef, value: unknown, row: Record<string, unknown>): TemplateResult | string {
    if (col.render) {
      const result = col.render(value, row);
      if (typeof result === 'string') return result;
      // HTMLElement — ref 디렉티브로 삽입
      if (result instanceof HTMLElement) {
        const container = document.createElement('span');
        container.appendChild(result);
        return html`${container}`;
      }
      return String(value ?? '');
    }
    if (col.type === 'badge' && col.badgeColors) {
      const color = col.badgeColors[String(value)] ?? '#f3f4f6';
      return html`<span class="badge" style="background:${color}">${this._getOptionLabel(col, value)}</span>`;
    }
    if (col.type === 'select' && col.options) {
      return this._getOptionLabel(col, value);
    }
    if (col.type === 'number' && value != null) {
      return Number(value).toLocaleString();
    }
    return String(value ?? '');
  }

  private _renderNewRow(): TemplateResult {
    return html`
      <tr class="new-row">
        ${this.selectable ? html`<td class="checkbox-cell"><span class="new-row-marker">+</span></td>` : ''}
        ${this.expandable ? html`<td></td>` : ''}
        ${this.columns.map((col, colIdx) => html`
          <td>
            ${col.editable !== false ? html`
              <input placeholder=${col.label} aria-label=${messages.text('newRowColumn', { col: col.label })}
                data-new-col=${colIdx}
                @keydown=${this._onNewRowKeyDown}
                @focus=${this._onNewRowFocus} />
            ` : html`<span></span>`}
          </td>
        `)}
        ${this._hasActionsColumn ? html`<td></td>` : ''}
      </tr>
    `;
  }

  private _renderPagination(): TemplateResult {
    const total = this.dataMode === 'client' ? this._viewTotal : this.totalCount;
    if (total <= 0) return html``;
    const totalPages = Math.ceil(total / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);

    return html`
      <div class="pagination" role="navigation" aria-label=${this.hostLabel ? messages.text('paginationOf', { name: this.hostLabel }) : messages.text('pagination')}>
        <span>${this.pageInfoFormatter(total, start, end)}</span>
        <div class="page-buttons">
          <button ?disabled=${this.currentPage <= 1} aria-label=${messages.text('previousPage')}
            @click=${() => this._onPageChange(this.currentPage - 1)}>◀</button>
          ${this._getPageNumbers(totalPages).map(p => html`
            <button class=${p === this.currentPage ? 'active' : ''} aria-current=${p === this.currentPage ? 'page' : nothing}
              aria-label=${messages.text('pageNumber', { page: p })}
              @click=${() => this._onPageChange(p)}>${p}</button>
          `)}
          <button ?disabled=${this.currentPage >= totalPages} aria-label=${messages.text('nextPage')}
            @click=${() => this._onPageChange(this.currentPage + 1)}>▶</button>
          <select aria-label=${messages.text('pageSize')}
            @change=${(e: Event) => this._onPageSizeChange(Number((e.target as HTMLSelectElement).value))}>
            ${[25, 50, 100].map(s => html`<option value=${s} ?selected=${s === this.pageSize}>${messages.text('rowsPerPage', { size: s })}</option>`)}
          </select>
        </div>
      </div>
    `;
  }

  // --- Event Handlers ---
  /**
   * 전체선택 체크박스 — 범위는 **현재 페이지**다(합집합/차집합, 치환이 아니다).
   * 종전에는 켤 때 `new Set(현재 페이지)` 로 **치환**하고 끌 때 `new Set()` 으로 **전역 소거**해서,
   * 어느 쪽이든 다른 페이지의 선택분이 함께 날아갔다. 전역 소거가 필요하면 {@link clearSelection}.
   *
   * ## 왜 `select-all` 을 따로 내보내는가
   *
   * `selection-change` 만으로는 *"사용자가 세 행을 골랐다"* 와 *"사용자가 전체선택을 눌렀다"* 가
   * 구분되지 않는다. 서버 페이징에서 그 구분은 앱에 필요하다 — 전체선택을 누른 순간이
   * *"이 조건에 맞는 N건 전부"* 를 제안할 자리이기 때문이다.
   *
   * ⚠**`scope: 'page' | 'all'` 필드는 두지 않았다.** 이 컴포넌트는 `'all'` 을 **낼 수 없다** —
   * 다른 페이지의 행을 갖고 있지 않고, 서버 페이징에서 «전역 전체선택»은 id 목록이 아니라
   * **조회 조건**이라 컴포넌트가 표현할 수 있는 것이 아니다. 값이 하나뿐인 유니온은
   * *"라이브러리가 모르는 개념을 아는 척하는"* 필드가 된다. ⇒ 컴포넌트는 **의도만** 알리고
   * 전역 해석은 앱이 한다.
   */
  private _onSelectAll(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    const pageIds = this._pageRowIds();
    const next = new Set(this.selectedIds);
    for (const id of pageIds) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    this.selectedIds = next;
    this._fireSelectionChange();
    // 의도를 따로 알린다 — 아래 주석 참조.
    this._emit('select-all', { checked, pageRowIds: pageIds });
  }

  private _onRowSelect(rowId: string): void {
    const next = new Set(this.selectedIds);
    if (next.has(rowId)) next.delete(rowId);
    else next.add(rowId);
    this.selectedIds = next;
    this._fireSelectionChange();
  }

  private _lastSelectedIndex = -1;
  private _onShiftSelect(rowIdx: number): void {
    if (this._lastSelectedIndex < 0) return;
    const start = Math.min(this._lastSelectedIndex, rowIdx);
    const end = Math.max(this._lastSelectedIndex, rowIdx);
    const next = new Set(this.selectedIds);
    for (let i = start; i <= end; i++) {
      next.add(this._rowId(this._view[i], i));
    }
    this.selectedIds = next;
    this._fireSelectionChange();
  }

  private _onSortClick(field: string): void {
    if (this.sort?.field === field) {
      if (this.sort.direction === 'asc') {
        this.sort = { field, direction: 'desc' };
      } else {
        this.sort = null;
      }
    } else {
      this.sort = { field, direction: 'asc' };
    }
    this._emit('sort-change', this.sort ? { field: this.sort.field, direction: this.sort.direction } : { field, direction: null });
  }

  private _onFilterChange(field: string, value: string): void {
    if (value) {
      this.filters = { ...this.filters, [field]: value };
    } else {
      const { [field]: _, ...rest } = this.filters;
      this.filters = rest;
    }
    // 새 조건은 첫 페이지부터 — 결과가 줄었는데 4쪽에 남는 것이 이 자리의 흔한 버그다.
    if (this.dataMode === 'client') this.currentPage = 1;
    this._emit('filter-change', this.dataMode === 'client'
        ? { filters: this.filters, filteredCount: this.filteredRowCount }
        : { filters: this.filters });
  }

  /**
   * Roving tabindex (WAI-ARIA APG grid): the grid is one Tab stop — the focused cell, or the first
   * cell before any — and arrow keys move DOM focus between cells, so the keyboard model below is
   * reachable from the keyboard and not only from a control inside the table.
   */
  private _isTabStop(rowIdx: number, colIdx: number): boolean {
    const f = this.focusedCell;
    const inView = f && f.rowIndex >= this._topRow && f.rowIndex < this._view.length
      && f.colIndex >= this._firstCol && f.colIndex <= this._lastCol;
    if (inView) return f.rowIndex === rowIdx && f.colIndex === colIdx;
    // 처음 들어올 때: 본문 첫 행 첫 데이터 칸(종전 그대로) — 본문이 비면 머리 줄 첫 칸이 그리드의 Tab 정지점이다.
    return this._view.length > 0 ? rowIdx === 0 && colIdx === 0 : rowIdx === HEADER_ROW && colIdx === this._firstCol;
  }

  /** 셀 이동이 닿는 가장 위 행 — 머리 줄. 필터 줄은 그려질 때만 그 아래 행이다. */
  private get _topRow(): number { return HEADER_ROW; }
  private get _hasFilterRow(): boolean { return this.filterable && this.columns.some(c => c.filterable); }

  /**
   * 필터 입력 안의 키 — ←/→ · 글자 · Space 는 입력의 것이다. Escape 는 칸으로 나오고, 글자 입력 칸의 ↑/↓ 는 줄을 옮긴다
   * (select 의 ↑/↓ 는 값을 바꾸는 네이티브 키라 두고, Escape 로 나온다).
   */
  private _onFilterControlKeyDown = (e: KeyboardEvent): void => {
    const control = e.currentTarget as HTMLElement;
    const cell = control.closest<HTMLElement>('td[data-cell]');
    if (!cell) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cell.focus();
    } else if (control instanceof HTMLInputElement && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      e.stopPropagation();
      this._moveFocus(0, e.key === 'ArrowDown' ? 1 : -1);
    }
  };

  private _isFocusedCell(rowIdx: number, colIdx: number): boolean {
    return this.focusedCell?.rowIndex === rowIdx && this.focusedCell.colIndex === colIdx;
  }

  /*
   * 셀 이동이 닿는 열 — 데이터 열은 `0..columns.length-1` 그대로 두고(편집·복사·검증이 그 번호를 쓴다),
   * 앞쪽 제어 열(선택 · 펼침)은 음수, 행 동작 열은 `columns.length` 다. APG Grid: 셀 안의 위젯은 Tab 정지점이
   * 아니라 셀 이동으로 닿는다 — 선택 체크박스가 행마다 Tab 정지점이면 25행 표 하나를 지나는 데 Tab 이 27번 든다.
   */
  private get _firstCol(): number { return -((this.selectable ? 1 : 0) + (this.expandable ? 1 : 0)); }
  private get _selectCol(): number { return this._firstCol; }
  private get _actionsCol(): number { return this.columns.length; }
  private get _lastCol(): number { return this.columns.length - 1 + (this._hasActionsColumn ? 1 : 0); }

  /**
   * 행 동작 셀 안: ←/→ 는 버튼 사이, ↑/↓ 는 위아래 행의 같은 셀, Escape 는 셀로. 셀 자체에서의 Enter 는
   * 첫 버튼으로 들어간다(`_onGlobalKeyDown`). 버튼의 Enter/Space 는 버튼 자신의 것이다.
   */
  private _onActionsKeyDown = (e: KeyboardEvent): void => {
    const origin = e.composedPath()[0];
    if (!(origin instanceof HTMLButtonElement)) return;
    const cell = origin.closest('td')!;
    const buttons = [...cell.querySelectorAll<HTMLButtonElement>('button')];
    const i = buttons.indexOf(origin);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      buttons[Math.max(0, Math.min(buttons.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this._moveFocus(0, e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cell.focus();
    }
  };

  /** Tab or a click put DOM focus on a cell — it is the focused cell. */
  private _onCellFocus(rowIdx: number, colIdx: number): void {
    if (this.focusedCell?.rowIndex === rowIdx && this.focusedCell.colIndex === colIdx) return;
    this.focusedCell = { rowIndex: rowIdx, colIndex: colIdx };
  }

  /** After the next render, move DOM focus to the focused cell (a key moved it, or an edit ended by key). */
  private _focusCellAfterUpdate = false;

  private _focusFocusedCell(): void {
    const f = this.focusedCell;
    if (!f) return;
    this.shadowRoot?.querySelector<HTMLElement>(`[data-cell][data-row="${f.rowIndex}"][data-col="${f.colIndex}"]`)?.focus();
  }

  private _onCellClick(rowIdx: number, colIdx: number): void {
    this.focusedCell = { rowIndex: rowIdx, colIndex: colIdx };
    this._lastSelectedIndex = rowIdx;
    this._fireRowActivate(rowIdx, 'click');
  }

  /**
   * 「선택」(체크박스)과 별개로 「보고 있는 행」을 앱에 알린다. 셀 단일 클릭은
   * `editable` 열에서도 편집에 들어가지 않으므로(dblclick만 진입) 항상 안전하게 낼 수 있다.
   * 키보드 경로(Enter)는 `editable` 열에서 이미 편집 진입 신호이므로 그 경우는 내지 않는다.
   */
  private _fireRowActivate(rowIdx: number, via: 'click' | 'keyboard'): void {
    const row = this._view[rowIdx];
    if (!row) return;
    this._emit('row-activate', { row, id: this._rowId(row, rowIdx), via });
  }

  private _onCellDblClick(rowIdx: number, colIdx: number, value: unknown): void {
    this.editingCell = { rowIndex: rowIdx, colIndex: colIdx };
    this.focusedCell = { rowIndex: rowIdx, colIndex: colIdx };
    this.editValue = String(value ?? '');
    this.requestUpdate();
    requestAnimationFrame(async () => {
      const input = this.shadowRoot?.querySelector('.cell-edit-input') as HTMLInputElement | null;
      if (input?.localName === 'u-date-picker') {
        // 커스텀 엘리먼트는 자기 갱신 뒤에야 텍스트 상자가 있다 — 그다음 초점·전체 선택(입력한 키가 값을 바꾸게).
        const picker = input as unknown as HTMLElement & { updateComplete: Promise<unknown> };
        await picker.updateComplete;
        picker.focus();
        picker.shadowRoot?.querySelector<HTMLInputElement>('[part~="input"]')?.select();
        return;
      }
      input?.focus();
      input?.select();
    });
  }

  /**
   * 날짜 편집기의 `change` — 값을 받아 두고, 달력에서 고른 것이면 확정한다.
   *
   * 확정을 «다음 틱» 으로 미루는 이유: 텍스트 상자의 Enter 도 피커 안에서 먼저 `change` 를 낸 뒤
   * 이 셀의 keydown(확정 + 아래 행으로 이동)에 닿는다. 그 경우 미룬 확정이 돌 때는 편집 셀이 이미
   * 바뀌어 있으므로(새 객체) 아무것도 하지 않는다 — 남는 것은 키 없이 난 변경(달력에서 날짜 고르기)뿐이다.
   */
  private _onDateEditorChange = (e: Event): void => {
    this.editValue = (e.target as HTMLElement & { value?: string }).value ?? '';
    const cell = this.editingCell;
    setTimeout(() => {
      if (this.editingCell === cell) this._onCellEditConfirm();
    });
  };

  private _onEditKeyDown(e: KeyboardEvent): void {
    // IME 조합 중인 키(한국어 등)는 입력기의 것이다 — 조합을 확정하는 Enter 로 확정·이동·제출하지 않는다.
    if (isImeComposing(e)) return;
    // 날짜 편집기의 달력은 자기 키를 갖는다 — 달력 안의 Enter 는 고르기, 달력이 열린 동안의 Escape 는
    // 달력 닫기다(문서 수준 오버레이 층이 닫는다). 고른 날짜는 `change` 로 확정된다.
    const editor = e.currentTarget as Element | null;
    if (editor?.localName === 'u-date-picker') {
      const inCalendar = e.composedPath().some(n => n instanceof Element && n.part?.contains('popover'));
      if (inCalendar || (e.key === 'Escape' && calendarOpen(editor))) return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      // 이동의 기준은 «확정 전» 셀이다 — 확정이 성공하면 편집 셀이 비고, 검증에 걸리면 그대로 남아
      // 그 셀에서 오류를 고치게 한다(이동하지 않는다).
      const from = this.editingCell;
      // 편집할 다음 칸이 없는 Tab(마지막 칸의 Tab · 첫 칸의 Shift+Tab)은 표를 떠난다 — 기본 동작을 막지 않는다.
      // 편집 중인 칸은 Tab 정지점이 아니므로 브라우저가 표 밖의 이웃으로 옮기고, 편집기의 blur 가 확정한다
      // (SC 2.1.2 · 형제 그리드와 같은 모델). ⚠여기서 확정하면 안 된다 — 다시 그리기(마이크로태스크)가 브라우저의
      // 기본 동작보다 먼저 돌아 그 칸이 Tab 정지점으로 돌아오고, Tab 이 그 칸에 떨어진다(실측).
      // 종전에는 같은 칸을 다시 열어, Escape 를 먼저 누르지 않으면 벗어날 수 없었다.
      if (e.key === 'Tab' && from && !this._nextEditableCell(from, e.shiftKey)) return;
      e.preventDefault();
      this._onCellEditConfirm();
      if (!from || this.editingCell) return;
      // The editor leaves the DOM with focus in it — the cell takes focus back unless another edit opens.
      this._focusCellAfterUpdate = true;
      if (e.key === 'Tab') {
        this._moveToNextEditableCell(from, e.shiftKey);
      } else if (from.rowIndex < this._view.length - 1) {
        // 다음 행으로 이동
        const nextRow = from.rowIndex + 1;
        this._onCellDblClick(nextRow, from.colIndex, this._view[nextRow][this.columns[from.colIndex].key]);
      }
    } else if (e.key === 'Escape') {
      this.editingCell = null;
      this.editValue = '';
      this._focusCellAfterUpdate = true;
    }
  }

  /**
   * 편집기를 떠나면 확정한다 — 단 «그 편집기의 셀» 이 아직 편집 중일 때만. Enter/Tab 으로 다음 셀로
   * 옮기면 앞 편집기가 DOM 에서 빠지며 blur 를 내는데, 그것이 이미 열린 다음 셀의 편집을 확정해 닫으면 안 된다.
   */
  private _onEditorBlur(rowIdx: number, colIdx: number): void {
    if (this.editingCell?.rowIndex !== rowIdx || this.editingCell.colIndex !== colIdx) return;
    this._onCellEditConfirm();
  }

  private _onCellEditConfirm(): void {
    if (!this.editingCell) return;
    const { rowIndex, colIndex } = this.editingCell;
    const col = this.columns[colIndex];
    const row = this._view[rowIndex];
    const oldValue = row[col.key];
    let newValue: unknown = this.editValue;

    if (col.type === 'number') newValue = Number(newValue);

    // 날짜가 아닌 텍스트 — 피커는 값을 비우고 badInput 을 알린다. 비운 값으로 덮어쓰지 않고 편집을 잇는다.
    if (col.type === 'date') {
      const picker = this.shadowRoot?.querySelector('u-date-picker.cell-edit-input') as
        (HTMLElement & { validity?: ValidityState; validationMessage?: string }) | null;
      if (picker?.validity?.badInput) {
        this.validationErrors = new Map(this.validationErrors)
          .set(`${rowIndex}-${colIndex}`, () => picker.validationMessage || Locale.getValue('valueMissing'));
        return;
      }
    }

    // 빈 칸을 빈 채로 두고 나간 것은 변경이 아니다(`null`/`undefined` 셀의 편집 상자는 '' 로 시작한다).
    if (newValue === '' && (oldValue == null || oldValue === '')) {
      this.editingCell = null;
      this.editValue = '';
      return;
    }

    // Validation
    if (col.required && !newValue && newValue !== 0) {
      this.validationErrors = new Map(this.validationErrors).set(`${rowIndex}-${colIndex}`, () => Locale.getValue('valueMissing'));
      return;
    }
    if (col.validator) {
      const error = col.validator(newValue, row);
      if (error) {
        this.validationErrors = new Map(this.validationErrors).set(`${rowIndex}-${colIndex}`, error);
        return;
      }
    }

    // Clear validation
    const nextErrors = new Map(this.validationErrors);
    nextErrors.delete(`${rowIndex}-${colIndex}`);
    this.validationErrors = nextErrors;

    if (newValue !== oldValue) {
      this._emit('row-update', { row, field: col.key, value: newValue, oldValue });
    }

    this.editingCell = null;
    this.editValue = '';
  }

  private _onExpandToggle(row: Record<string, unknown>, rowId: string): void {
    const next = new Set(this.expandedIds);
    const expanded = !next.has(rowId);
    if (expanded) next.add(rowId);
    else next.delete(rowId);
    this.expandedIds = next;
    this._emit('row-expand', { row, expanded });
  }

  private _onAddRowClick(): void {
    // 새 행 입력란으로 포커스
    const input = this.shadowRoot?.querySelector('.new-row input') as HTMLInputElement;
    input?.focus();
  }

  private _onNewRowFocus(): void {
    // 새 행 활성화 표시
  }

  private _onNewRowKeyDown(e: KeyboardEvent): void {
    // IME 조합 중인 키(한국어 등)는 입력기의 것이다 — 조합을 확정하는 Enter 로 확정·이동·제출하지 않는다.
    if (isImeComposing(e)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(this.shadowRoot?.querySelectorAll('.new-row input') ?? []) as HTMLInputElement[];
      const newRow: Record<string, unknown> = {};
      this.columns.forEach((col, i) => {
        if (col.editable !== false && inputs[i]) {
          let val: unknown = inputs[i].value;
          if (col.type === 'number') val = Number(val);
          newRow[col.key] = val;
        }
      });

      this._emit('row-create', { row: newRow });

      // 입력 초기화
      inputs.forEach(input => input.value = '');
      inputs[0]?.focus();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      const target = e.target as HTMLInputElement;
      const colIdx = Number(target.dataset.newCol);
      // 마지막 컬럼이면 Enter와 동일
      if (colIdx >= this.columns.filter(c => c.editable !== false).length - 1) {
        e.preventDefault();
        this._onNewRowKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
      }
    }
  }

  private _onRowDelete(row: Record<string, unknown>): void {
    this._emit('row-delete', { row });
  }

  private _onRowAction(action: RowAction, row: Record<string, unknown>): void {
    // 이름을 소비자가 정한다(`RowAction.event`) — 맵 밖이라 `_emit` 이 아니다. detail 은 `RowActionEventDetail`.
    this.dispatchEvent(new CustomEvent<RowActionEventDetail>(action.event, { detail: { row }, bubbles: true, composed: true }));
  }

  private _onPageChange(page: number): void {
    if (this.dataMode === 'client') this.currentPage = page;
    this._emit('page-change', { page, pageSize: this.pageSize });
  }

  private _onPageSizeChange(pageSize: number): void {
    if (this.dataMode === 'client') {
      this.pageSize = pageSize;
      this.currentPage = 1;
    }
    this._emit('page-change', { page: 1, pageSize });
  }

  // --- Helpers ---
  /** 행 동작 칸은 소비자가 동작을 선언했을 때만 존재한다(삭제 또는 커스텀 액션). */
  private get _hasActionsColumn(): boolean {
    return this.deletable || (this.rowActions?.length ?? 0) > 0;
  }

  private _colSpan(): number {
    let span = this.columns.length;
    if (this._hasActionsColumn) span++;
    if (this.selectable) span++;
    if (this.expandable) span++;
    return span;
  }

  private _getOptionLabel(col: ColumnDef, value: unknown): string {
    return col.options?.find(o => o.value === String(value))?.label ?? String(value ?? '');
  }

  private _getPageNumbers(totalPages: number): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  /** Tab 이 편집을 옮길 다음(`reverse` 면 이전) 편집 가능 칸 — 행을 넘어 이어지고, 양 끝에서는 없다(`null`). */
  private _nextEditableCell(from: CellPosition, reverse: boolean): CellPosition | null {
    const editableCols = this.columns.map((c, i) => c.editable ? i : -1).filter(i => i >= 0);
    const currentIdx = editableCols.indexOf(from.colIndex);
    if (reverse) {
      if (currentIdx > 0) return { rowIndex: from.rowIndex, colIndex: editableCols[currentIdx - 1] };
      if (from.rowIndex > 0) return { rowIndex: from.rowIndex - 1, colIndex: editableCols[editableCols.length - 1] };
      return null;
    }
    if (currentIdx < editableCols.length - 1) return { rowIndex: from.rowIndex, colIndex: editableCols[currentIdx + 1] };
    if (from.rowIndex < this._view.length - 1) return { rowIndex: from.rowIndex + 1, colIndex: editableCols[0] };
    return null;
  }

  private _moveToNextEditableCell(from: CellPosition, reverse: boolean): void {
    const next = this._nextEditableCell(from, reverse);
    if (!next) return;
    const value = this._view[next.rowIndex]?.[this.columns[next.colIndex]?.key];
    this._onCellDblClick(next.rowIndex, next.colIndex, value);
  }

  /**
   * ⚠**두 필드가 서로 다른 것을 센다.** `selectedRows` 는 **현재 페이지의 행 객체**이고
   * `selectedIds` 는 페이지를 가로지르는 **누적 식별자**다. 서버 페이징에서 둘의 길이가
   * 다른 것이 정상이며, 그 차이를 감출 방법은 없다 — 컴포넌트가 다른 페이지의 행을
   * 갖고 있지 않기 때문이다.
   */
  private _fireSelectionChange(): void {
    this._emit('selection-change', { selectedRows: this.getSelectedRows(), selectedIds: [...this.selectedIds] });
  }

  // --- Lifecycle ---
  /** 런타임 로캘 전환 — `UElement` 계열은 기반 클래스가 구독하지만 이 표는 `LitElement` 를 직접 잇는다. */
  private unsubscribeLocale?: () => void;
  private detachedLocaleRevision?: number;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._onGlobalKeyDown);
    this.unsubscribeLocale = Locale.subscribe(() => this.requestUpdate());
    if (this.detachedLocaleRevision !== undefined && this.detachedLocaleRevision !== Locale.revision) this.requestUpdate();
    this.detachedLocaleRevision = undefined;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onGlobalKeyDown);
    this.unsubscribeLocale?.();
    this.unsubscribeLocale = undefined;
    this.detachedLocaleRevision = Locale.revision;
  }

  // --- Clipboard & Keyboard ---
  private _onGlobalKeyDown = (e: KeyboardEvent): void => {
    const origin = e.composedPath()[0];
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') this._handleCopy(e);
      else if (e.key === 'v') this._handlePaste(e);
      else if (e.key === 'a' && !this.editingCell && !isTextEntry(origin)) {
        e.preventDefault();
        this._selectAll();
      }
    }
    // 셀 키보드 모델은 셀에서 온 키만 — 필터 입력·행 체크박스·행 동작 버튼의 키는 그 컨트롤의 것이다
    // (←/→ 는 캐럿을, Space 는 글자·체크를, Delete 는 글자를). 호스트 자체에 보낸 키는 그대로 받는다.
    const fromCell = origin === this || (origin instanceof HTMLElement && origin.hasAttribute('data-cell'));
    // 선택·펼침 셀의 컨트롤(클릭으로 포커스가 들어간 체크박스·버튼)에서는 화살표만 셀 이동이다 —
    // Space·Enter 는 그 컨트롤의 것(체크·펼침)이라 여기서 다시 처리하면 두 번 토글된다.
    if (!fromCell && !this.editingCell && this.focusedCell && ARROW_KEYS.has(e.key)
      && origin instanceof HTMLElement && origin.closest('td.checkbox-cell, td.expand-cell, th[data-cell]')) {
      e.preventDefault();
      this._moveByArrow(e.key);
      return;
    }
    if (!fromCell) return;
    if (!this.editingCell && this.focusedCell && this.focusedCell.rowIndex < 0) {
      this._onHeadCellKeyDown(e, origin as HTMLElement);
      return;
    }
    // 제어 열 셀에서의 Enter — 펼침 셀은 펼치기/접기, 행 동작 셀은 첫 버튼으로 들어간다.
    if (!this.editingCell && this.focusedCell && e.key === 'Enter' && !isImeComposing(e)
      && (this.focusedCell.colIndex < 0 || this.focusedCell.colIndex >= this.columns.length)) {
      const { rowIndex, colIndex } = this.focusedCell;
      const r = this._view[rowIndex];
      if (colIndex === EXPAND_COL && this.expandable && r) {
        e.preventDefault();
        this._onExpandToggle(r, this._rowId(r, rowIndex));
      } else if (colIndex === this._actionsCol) {
        e.preventDefault();
        (origin as HTMLElement).querySelector?.<HTMLButtonElement>('button')?.focus();
      }
      return;
    }
    // Arrow key navigation (비편집 모드)
    if (!this.editingCell && this.focusedCell) {
      if (ARROW_KEYS.has(e.key)) { e.preventDefault(); this._moveByArrow(e.key); }
      if (e.key === 'Enter' && !isImeComposing(e)) {
        const col = this.columns[this.focusedCell.colIndex];
        if (col?.editable) {
          const value = this._view[this.focusedCell.rowIndex]?.[col.key];
          this._onCellDblClick(this.focusedCell.rowIndex, this.focusedCell.colIndex, value);
        } else {
          this._fireRowActivate(this.focusedCell.rowIndex, 'keyboard');
        }
      }
      if (e.key === ' ' && this.selectable) {
        e.preventDefault();
        const r = this._view[this.focusedCell.rowIndex];
        const rowId = r ? this._rowId(r, this.focusedCell.rowIndex) : undefined;
        if (rowId) this._onRowSelect(rowId);
      }
      if (e.key === 'Delete' && this.deletable && this.selectedIds.size > 0) {
        // 선택된 행 삭제 (개별 이벤트)
        for (const row of this.getSelectedRows()) {
          this._emit('row-delete', { row });
        }
      }
    }
  };

  /**
   * Ctrl/Cmd + C · V on the table. The key is not prevented: `copyFromKey`/`pasteFromKey` take the
   * browser's clipboard event where it fires and the Clipboard API where it does not (Safari fires no
   * copy event without a text selection). A text field — the cell editor, a filter input — keeps its
   * own clipboard.
   */
  private _handleCopy(e: KeyboardEvent): void {
    if (this.editingCell || isTextEntry(e.composedPath()[0])) return;
    const rows = this.getSelectedRows();
    if (rows.length === 0) return;
    void copyFromKey(toTSV(rows, this.columns)).then((ok) => {
      if (!ok) this._clipboardError('copy', new Error('The clipboard did not take the copied text'));
    });
  }

  private _handlePaste(e: KeyboardEvent): void {
    if (this.editingCell || isTextEntry(e.composedPath()[0])) return;
    pasteFromKey().then((text) => {
      if (!text.trim()) return;
      const parsedRows = parseTSV(text, this.columns);
      if (parsedRows.length === 0) return;
      this._emit('clipboard-paste', { rows: parsedRows });
    }, (error) => this._clipboardError('paste', error));
  }

  private _clipboardError(action: 'copy' | 'paste', error: unknown): void {
    this._emit('clipboard-error', { action, error });
  }

  /**
   * 머리·필터 줄 칸의 키. 화살표는 셀 이동. 머리 칸: Enter/Space 가 그 칸의 위젯(정렬 · 전체 선택)을 누른다.
   * 필터 칸: Enter/F2 는 입력으로 들어가고, 글자 하나는 입력으로 들어가 그대로 쓰인다(포커스를 먼저 옮기면 브라우저가
   * 그 글자를 새 포커스에 준다).
   */
  private _onHeadCellKeyDown(e: KeyboardEvent, cell: HTMLElement): void {
    if (ARROW_KEYS.has(e.key)) {
      e.preventDefault();
      this._moveByArrow(e.key);
      return;
    }
    const control = cell.querySelector<HTMLElement>('input, select, button');
    if (!control) return;
    if (this.focusedCell!.rowIndex === HEADER_ROW) {
      if ((e.key === 'Enter' || e.key === ' ') && !isImeComposing(e)) {
        e.preventDefault();
        control.click();
      }
      return;
    }
    const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ';
    if (e.key === 'Enter' || e.key === 'F2' || (printable && control instanceof HTMLInputElement)) {
      if (!printable) e.preventDefault();
      control.focus();
    }
  }

  private _moveByArrow(key: string): void {
    if (key === 'ArrowUp') this._moveFocus(0, -1);
    else if (key === 'ArrowDown') this._moveFocus(0, 1);
    else if (key === 'ArrowLeft') this._moveFocus(-1, 0);
    else if (key === 'ArrowRight') this._moveFocus(1, 0);
  }

  private _moveFocus(dx: number, dy: number): void {
    if (!this.focusedCell) return;
    const newCol = Math.max(this._firstCol, Math.min(this._lastCol, this.focusedCell.colIndex + dx));
    let newRow = this.focusedCell.rowIndex + dy;
    // 그려지지 않은 필터 줄은 건너뛴다.
    if (newRow === FILTER_ROW && !this._hasFilterRow) newRow += dy < 0 ? -1 : 1;
    const bottom = this._view.length > 0 ? this._view.length - 1 : (this._hasFilterRow ? FILTER_ROW : HEADER_ROW);
    newRow = Math.max(this._topRow, Math.min(bottom, newRow));
    this.focusedCell = { rowIndex: newRow, colIndex: newCol };
    this._focusCellAfterUpdate = true;
  }

  /** `Ctrl`/`Cmd` + `A` — 전체선택 체크박스와 같은 범위(현재 페이지 합집합)여야 한다. */
  private _selectAll(): void {
    const next = new Set(this.selectedIds);
    for (const id of this._pageRowIds()) next.add(id);
    this.selectedIds = next;
    this._fireSelectionChange();
  }

  // define helper (follows existing pattern)
  static define(tagName: string = 'u-rich-table'): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, this);
    }
  }
}

/** `u-date-picker` publishes its calendar state as `:state(open)`. Engines without `:state()` say no. */
function calendarOpen(picker: Element): boolean {
  try {
    return picker.matches(':state(open)');
  } catch {
    return false;
  }
}

/**
 * Typed listeners for {@link RichTableEventMap} — the DOM's own pattern (`HTMLMediaElement` with
 * `HTMLMediaElementEventMap`). Element-scoped: several names are generic and would collide on the
 * global event map. `RowAction.event` names are the consumer's own and stay untyped.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- typed event listeners (the DOM's own `HTMLMediaElementEventMap` pattern): the merged addEventListener/removeEventListener overloads are implemented by EventTarget
export interface URichTable {
  addEventListener<K extends keyof RichTableEventMap>(type: K, listener: (this: URichTable, ev: RichTableEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: URichTable, ev: HTMLElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof RichTableEventMap>(type: K, listener: (this: URichTable, ev: RichTableEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: URichTable, ev: HTMLElementEventMap[K]) => unknown, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'u-rich-table': URichTable;
  }
}