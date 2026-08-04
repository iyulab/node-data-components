import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import { messages } from '../../utilities/messages.js';
// src/components/u-rich-table/URichTable.component.ts
import { html, LitElement, type TemplateResult } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import { richTableStyles } from './styles.js';
import type { ColumnDef, CellPosition, SortState, FilterState } from './types.js';
import { parseTSV, toTSV } from './utils/clipboard.js';

@customElement('u-rich-table')
export class URichTable extends LitElement {
  static styles = richTableStyles;

  // --- Properties ---
  @property({ type: Array }) columns: ColumnDef[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Number }) totalCount = 0;
  @property({ type: Number }) pageSize = 25;
  @property({ type: Number }) currentPage = 1;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) emptyMessage = '';
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
  @property({ attribute: false }) detailRenderer?: (row: Record<string, unknown>) => TemplateResult;

  // --- Internal State ---
  @state() private selectedIds = new Set<string>();
  @state() private focusedCell: CellPosition | null = null;
  @state() private editingCell: CellPosition | null = null;
  @state() private editValue = '';
  @state() private expandedIds = new Set<string>();
  @state() private sort: SortState | null = null;
  @state() private filters: FilterState = {};
  @state() private validationErrors = new Map<string, string>();
  @state() private rowErrors = new Map<string, string>();

  // --- Public API ---
  revertRow(_rowId: string): void {
    // TODO: M2에서 구현
  }

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
  private _rowId(row: Record<string, unknown>, index: number): string {
    const id = row._id;
    if (id !== undefined && id !== null) return String(id);
    this._warnMissingRowId();
    return `#${index}`;
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
    return this.data.filter((row, i) => this.selectedIds.has(this._rowId(row, i)));
  }

  /** 이 페이지 행들의 식별자. 전체선택/해제가 «이 페이지» 범위임을 정의하는 값이다. */
  private _pageRowIds(): string[] {
    return this.data.map((row, i) => this._rowId(row, i));
  }

  /** 현재 페이지에서 선택된 행 수 — 전체선택 체크박스의 «분자». */
  private get _selectedOnPage(): number {
    return this._pageRowIds().reduce((n, id) => n + (this.selectedIds.has(id) ? 1 : 0), 0);
  }

  // --- Rendering ---
  render(): TemplateResult {
    return html`
      ${this._renderToolbar()}
      <table>
        ${this._renderHeader()}
        <tbody>
          ${this.filterable ? this._renderFilterRow() : ''}
          ${this._renderBody()}
          ${this.addable ? this._renderNewRow() : ''}
        </tbody>
      </table>
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
      <div class="toolbar">
        ${this.selectable ? html`
          <div class="selection-info">
            <input type="checkbox"
              .checked=${this.data.length > 0 && onPage === this.data.length}
              .indeterminate=${onPage > 0 && onPage < this.data.length}
              @change=${this._onSelectAll} />
            ${total > 0 ? html`<span>${crossesPages
              ? messages.text('selectedAcrossPages', { count: total, onPage })
              : messages.text('selected', { count: total })}</span>` : ''}
          </div>
          ${total > 0 ? html`<slot name="bulk-actions"></slot>` : ''}
        ` : ''}
        <div style="flex:1"></div>
        <slot name="toolbar-end"></slot>
        ${this.addable ? html`
          <button class="btn btn-success" @click=${this._onAddRowClick}>${this.addRowLabel || messages.text('addRow')}</button>
        ` : ''}
      </div>
    `;
  }

  private _renderHeader(): TemplateResult {
    return html`
      <thead>
        <tr>
          ${this.selectable ? html`<th class="checkbox-cell"></th>` : ''}
          ${this.expandable ? html`<th class="expand-cell"></th>` : ''}
          ${this.columns.map((col) => html`
            <th
              class=${col.sortable ? 'sortable' : ''}
              style=${col.width ? `width: ${col.width}` : ''}
              @click=${() => col.sortable && this._onSortClick(col.key)}>
              ${col.label}
              ${this.sort?.field === col.key ? html`
                <span class="sort-indicator">${this.sort.direction === 'asc' ? '▲' : '▼'}</span>
              ` : ''}
            </th>
          `)}
          <th class="actions-cell"></th>
        </tr>
      </thead>
    `;
  }

  private _renderFilterRow(): TemplateResult {
    return html`
      <tr class="filter-row">
        ${this.selectable ? html`<td></td>` : ''}
        ${this.expandable ? html`<td></td>` : ''}
        ${this.columns.map(col => html`
          <td>
            ${col.filterable !== false ? (
              col.filterType === 'select' && col.options
                ? html`<select @change=${(e: Event) => this._onFilterChange(col.key, (e.target as HTMLSelectElement).value)}>
                    <option value="">${this.filterAllLabel || messages.text('filterAll')}</option>
                    ${col.options.map(o => html`<option value=${o.value}>${o.label}</option>`)}
                  </select>`
                : html`<input
                    placeholder=${this.filterPlaceholder || messages.text('filterPlaceholder')}
                    @input=${(e: Event) => this._onFilterChange(col.key, (e.target as HTMLInputElement).value)} />`
            ) : ''}
          </td>
        `)}
        <td></td>
      </tr>
    `;
  }

  private _renderBody(): TemplateResult | TemplateResult[] {
    if (this.loading) {
      return html`<tr><td colspan=${this._colSpan()}><div class="loading-overlay">${this.loadingMessage || messages.text('loading')}</div></td></tr>`;
    }
    if (this.data.length === 0) {
      return html`<tr><td colspan=${this._colSpan()}><div class="empty-message">${this.emptyMessage || messages.text('empty')}</div></td></tr>`;
    }
    return this.data.map((row, rowIdx) => {
      const rowId = this._rowId(row, rowIdx);
      const isSelected = this.selectedIds.has(rowId);
      const isExpanded = this.expandedIds.has(rowId);
      const hasError = this.rowErrors.has(rowId);

      return html`
        <tr class="${isSelected ? 'selected' : ''} ${hasError ? 'error' : ''} ${this.editingCell?.rowIndex === rowIdx ? 'editing' : ''}">
          ${this.selectable ? html`
            <td class="checkbox-cell">
              <input type="checkbox" .checked=${isSelected}
                @change=${() => this._onRowSelect(rowId)}
                @click=${(e: MouseEvent) => e.shiftKey && this._onShiftSelect(rowIdx)} />
            </td>
          ` : ''}
          ${this.expandable ? html`
            <td class="expand-cell" @click=${() => this._onExpandToggle(rowId)}>
              ${isExpanded ? '▼' : '▶'}
            </td>
          ` : ''}
          ${this.columns.map((col, colIdx) => this._renderCell(row, rowIdx, col, colIdx))}
          <td class="actions-cell">
            <span class="row-menu" @click=${() => this._onRowMenu(row)}>⋯</span>
          </td>
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
      const validationError = this.validationErrors.get(`${rowIdx}-${colIdx}`);
      if (col.type === 'select' && col.options) {
        return html`
          <td>
            <select class="cell-edit-input" @change=${this._onCellEditConfirm} @keydown=${this._onEditKeyDown}>
              ${col.options.map(o => html`<option value=${o.value} ?selected=${o.value === String(value)}>${o.label}</option>`)}
            </select>
          </td>
        `;
      }
      return html`
        <td>
          <input class="cell-edit-input ${validationError ? 'invalid' : ''}"
            type=${col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
            .value=${this.editValue}
            @input=${(e: Event) => this.editValue = (e.target as HTMLInputElement).value}
            @keydown=${this._onEditKeyDown}
            @blur=${this._onCellEditConfirm} />
          ${validationError ? html`<div class="validation-error">${validationError}</div>` : ''}
        </td>
      `;
    }

    return html`
      <td class=${isFocused ? 'focused-cell' : ''}
        style=${col.align ? `text-align: ${col.align}` : ''}
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
              <input placeholder=${col.label}
                data-new-col=${colIdx}
                @keydown=${this._onNewRowKeyDown}
                @focus=${this._onNewRowFocus} />
            ` : html`<span></span>`}
          </td>
        `)}
        <td></td>
      </tr>
    `;
  }

  private _renderPagination(): TemplateResult {
    if (this.totalCount <= 0) return html``;
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCount);

    return html`
      <div class="pagination">
        <span>${this.pageInfoFormatter(this.totalCount, start, end)}</span>
        <div class="page-buttons">
          <button ?disabled=${this.currentPage <= 1} @click=${() => this._onPageChange(this.currentPage - 1)}>◀</button>
          ${this._getPageNumbers(totalPages).map(p => html`
            <button class=${p === this.currentPage ? 'active' : ''} @click=${() => this._onPageChange(p)}>${p}</button>
          `)}
          <button ?disabled=${this.currentPage >= totalPages} @click=${() => this._onPageChange(this.currentPage + 1)}>▶</button>
          <select @change=${(e: Event) => this._onPageSizeChange(Number((e.target as HTMLSelectElement).value))}>
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
    this.dispatchEvent(new CustomEvent('select-all', {
      detail: { checked, pageRowIds: pageIds },
      bubbles: true, composed: true
    }));
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
      next.add(this._rowId(this.data[i], i));
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
    this.dispatchEvent(new CustomEvent('sort-change', {
      detail: this.sort ? { field: this.sort.field, direction: this.sort.direction } : { field, direction: null },
      bubbles: true, composed: true
    }));
  }

  private _onFilterChange(field: string, value: string): void {
    if (value) {
      this.filters = { ...this.filters, [field]: value };
    } else {
      const { [field]: _, ...rest } = this.filters;
      this.filters = rest;
    }
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { filters: this.filters },
      bubbles: true, composed: true
    }));
  }

  private _onCellClick(rowIdx: number, colIdx: number): void {
    this.focusedCell = { rowIndex: rowIdx, colIndex: colIdx };
    this._lastSelectedIndex = rowIdx;
  }

  private _onCellDblClick(rowIdx: number, colIdx: number, value: unknown): void {
    this.editingCell = { rowIndex: rowIdx, colIndex: colIdx };
    this.editValue = String(value ?? '');
    this.requestUpdate();
    requestAnimationFrame(() => {
      const input = this.shadowRoot?.querySelector('.cell-edit-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    });
  }

  private _onEditKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._onCellEditConfirm();
      // 다음 행으로 이동
      if (this.editingCell && this.editingCell.rowIndex < this.data.length - 1) {
        const nextRow = this.editingCell.rowIndex + 1;
        const col = this.editingCell.colIndex;
        const nextValue = this.data[nextRow][this.columns[col].key];
        this._onCellDblClick(nextRow, col, nextValue);
      }
    } else if (e.key === 'Escape') {
      this.editingCell = null;
      this.editValue = '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this._onCellEditConfirm();
      this._moveToNextEditableCell(e.shiftKey);
    }
  }

  private _onCellEditConfirm(): void {
    if (!this.editingCell) return;
    const { rowIndex, colIndex } = this.editingCell;
    const col = this.columns[colIndex];
    const row = this.data[rowIndex];
    const oldValue = row[col.key];
    let newValue: unknown = this.editValue;

    if (col.type === 'number') newValue = Number(newValue);

    // Validation
    if (col.required && !newValue && newValue !== 0) {
      this.validationErrors = new Map(this.validationErrors).set(`${rowIndex}-${colIndex}`, Locale.getValue('valueMissing'));
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
      this.dispatchEvent(new CustomEvent('row-update', {
        detail: { row, field: col.key, value: newValue, oldValue },
        bubbles: true, composed: true
      }));
    }

    this.editingCell = null;
    this.editValue = '';
  }

  private _onExpandToggle(rowId: string): void {
    const next = new Set(this.expandedIds);
    const expanded = !next.has(rowId);
    if (expanded) next.add(rowId);
    else next.delete(rowId);
    this.expandedIds = next;
    this.dispatchEvent(new CustomEvent('row-expand', {
      detail: { row: this.data.find((r, i) => this._rowId(r, i) === rowId), expanded },
      bubbles: true, composed: true
    }));
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

      this.dispatchEvent(new CustomEvent('row-create', {
        detail: { row: newRow },
        bubbles: true, composed: true
      }));

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

  private _onRowMenu(row: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent('row-delete', {
      detail: { row },
      bubbles: true, composed: true
    }));
  }

  private _onPageChange(page: number): void {
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: { page, pageSize: this.pageSize },
      bubbles: true, composed: true
    }));
  }

  private _onPageSizeChange(pageSize: number): void {
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: { page: 1, pageSize },
      bubbles: true, composed: true
    }));
  }

  // --- Helpers ---
  private _colSpan(): number {
    let span = this.columns.length + 1; // +1 for actions
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

  private _moveToNextEditableCell(reverse: boolean): void {
    if (!this.editingCell) return;
    let { rowIndex, colIndex } = this.editingCell;
    const editableCols = this.columns.map((c, i) => c.editable ? i : -1).filter(i => i >= 0);
    const currentIdx = editableCols.indexOf(colIndex);

    if (reverse) {
      if (currentIdx > 0) {
        colIndex = editableCols[currentIdx - 1];
      } else if (rowIndex > 0) {
        rowIndex--;
        colIndex = editableCols[editableCols.length - 1];
      }
    } else {
      if (currentIdx < editableCols.length - 1) {
        colIndex = editableCols[currentIdx + 1];
      } else if (rowIndex < this.data.length - 1) {
        rowIndex++;
        colIndex = editableCols[0];
      }
    }

    const value = this.data[rowIndex]?.[this.columns[colIndex]?.key];
    this._onCellDblClick(rowIndex, colIndex, value);
  }

  /**
   * ⚠**두 필드가 서로 다른 것을 센다.** `selectedRows` 는 **현재 페이지의 행 객체**이고
   * `selectedIds` 는 페이지를 가로지르는 **누적 식별자**다. 서버 페이징에서 둘의 길이가
   * 다른 것이 정상이며, 그 차이를 감출 방법은 없다 — 컴포넌트가 다른 페이지의 행을
   * 갖고 있지 않기 때문이다.
   */
  private _fireSelectionChange(): void {
    this.dispatchEvent(new CustomEvent('selection-change', {
      detail: { selectedRows: this.getSelectedRows(), selectedIds: [...this.selectedIds] },
      bubbles: true, composed: true
    }));
  }

  // --- Lifecycle ---
  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._onGlobalKeyDown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onGlobalKeyDown);
  }

  // --- Clipboard & Keyboard ---
  private _onGlobalKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') this._handleCopy();
      else if (e.key === 'v') this._handlePaste();
      else if (e.key === 'a' && !this.editingCell) {
        e.preventDefault();
        this._selectAll();
      }
    }
    // Arrow key navigation (비편집 모드)
    if (!this.editingCell && this.focusedCell) {
      if (e.key === 'ArrowUp') { e.preventDefault(); this._moveFocus(0, -1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); this._moveFocus(0, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this._moveFocus(-1, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this._moveFocus(1, 0); }
      if (e.key === 'Enter') {
        const col = this.columns[this.focusedCell.colIndex];
        if (col?.editable) {
          const value = this.data[this.focusedCell.rowIndex]?.[col.key];
          this._onCellDblClick(this.focusedCell.rowIndex, this.focusedCell.colIndex, value);
        }
      }
      if (e.key === ' ' && this.selectable) {
        e.preventDefault();
        const r = this.data[this.focusedCell.rowIndex];
        const rowId = r ? this._rowId(r, this.focusedCell.rowIndex) : undefined;
        if (rowId) this._onRowSelect(rowId);
      }
      if (e.key === 'Delete' && this.selectedIds.size > 0) {
        // 선택된 행 삭제 (개별 이벤트)
        for (const row of this.getSelectedRows()) {
          this.dispatchEvent(new CustomEvent('row-delete', { detail: { row }, bubbles: true, composed: true }));
        }
      }
    }
  };

  private async _handleCopy(): Promise<void> {
    const rows = this.getSelectedRows();
    if (rows.length === 0) return;
    const tsv = toTSV(rows, this.columns);
    await navigator.clipboard.writeText(tsv);
  }

  private async _handlePaste(): Promise<void> {
    if (this.editingCell) return; // 편집 중이면 브라우저 기본 동작
    const text = await navigator.clipboard.readText();
    if (!text.trim()) return;
    const parsedRows = parseTSV(text, this.columns);

    if (parsedRows.length === 0) return;

    this.dispatchEvent(new CustomEvent('paste', {
      detail: { rows: parsedRows },
      bubbles: true, composed: true
    }));
  }

  private _moveFocus(dx: number, dy: number): void {
    if (!this.focusedCell) return;
    const newCol = Math.max(0, Math.min(this.columns.length - 1, this.focusedCell.colIndex + dx));
    const newRow = Math.max(0, Math.min(this.data.length - 1, this.focusedCell.rowIndex + dy));
    this.focusedCell = { rowIndex: newRow, colIndex: newCol };
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

declare global {
  interface HTMLElementTagNameMap {
    'u-rich-table': URichTable;
  }
}