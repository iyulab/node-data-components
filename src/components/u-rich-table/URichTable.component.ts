// src/components/u-rich-table/URichTable.component.ts
import { html, LitElement, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { richTableStyles } from './styles.js';
import type { ColumnDef, CellPosition, SortState, FilterState } from './types.js';

export class URichTable extends LitElement {
  static styles = richTableStyles;

  // --- Properties ---
  @property({ type: Array }) columns: ColumnDef[] = [];
  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: Number }) totalCount = 0;
  @property({ type: Number }) pageSize = 25;
  @property({ type: Number }) currentPage = 1;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) emptyMessage = '데이터가 없습니다';
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

  getSelectedRows(): Record<string, unknown>[] {
    return this.data.filter(row => this.selectedIds.has(row._id as string));
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

  private _renderToolbar(): TemplateResult {
    const selectedCount = this.selectedIds.size;
    return html`
      <div class="toolbar">
        ${this.selectable ? html`
          <div class="selection-info">
            <input type="checkbox"
              .checked=${selectedCount > 0 && selectedCount === this.data.length}
              .indeterminate=${selectedCount > 0 && selectedCount < this.data.length}
              @change=${this._onSelectAll} />
            ${selectedCount > 0 ? html`<span>${selectedCount}건 선택됨</span>` : ''}
          </div>
          ${selectedCount > 0 ? html`<slot name="bulk-actions"></slot>` : ''}
        ` : ''}
        <div style="flex:1"></div>
        <slot name="toolbar-end"></slot>
        ${this.addable ? html`
          <button class="btn btn-success" @click=${this._onAddRowClick}>+ 새 행</button>
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
                    <option value="">전체</option>
                    ${col.options.map(o => html`<option value=${o.value}>${o.label}</option>`)}
                  </select>`
                : html`<input
                    placeholder="필터..."
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
      return html`<tr><td colspan=${this._colSpan()}><div class="loading-overlay">로딩 중...</div></td></tr>`;
    }
    if (this.data.length === 0) {
      return html`<tr><td colspan=${this._colSpan()}><div class="empty-message">${this.emptyMessage}</div></td></tr>`;
    }
    return this.data.map((row, rowIdx) => {
      const rowId = row._id as string;
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
            <span style="cursor:pointer;color:#94a3b8" @click=${() => this._onRowMenu(row)}>⋯</span>
          </td>
        </tr>
        ${isExpanded && this.detailRenderer ? html`
          <tr class="detail-row">
            <td colspan=${this._colSpan()}>${this.detailRenderer(row)}</td>
          </tr>
        ` : ''}
        ${hasError ? html`
          <tr><td colspan=${this._colSpan()} style="padding:2px 8px;background:#fef2f2;color:#ef4444;font-size:11px;">
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
        ${this.selectable ? html`<td class="checkbox-cell"><span style="color:#86efac">+</span></td>` : ''}
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
        <span>전체 ${this.totalCount.toLocaleString()}건 중 ${start}-${end} 표시</span>
        <div class="page-buttons">
          <button ?disabled=${this.currentPage <= 1} @click=${() => this._onPageChange(this.currentPage - 1)}>◀</button>
          ${this._getPageNumbers(totalPages).map(p => html`
            <button class=${p === this.currentPage ? 'active' : ''} @click=${() => this._onPageChange(p)}>${p}</button>
          `)}
          <button ?disabled=${this.currentPage >= totalPages} @click=${() => this._onPageChange(this.currentPage + 1)}>▶</button>
          <select @change=${(e: Event) => this._onPageSizeChange(Number((e.target as HTMLSelectElement).value))}>
            ${[25, 50, 100].map(s => html`<option value=${s} ?selected=${s === this.pageSize}>${s}행</option>`)}
          </select>
        </div>
      </div>
    `;
  }

  // --- Event Handlers ---
  private _onSelectAll(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds = new Set(this.data.map(r => r._id as string));
    } else {
      this.selectedIds = new Set();
    }
    this._fireSelectionChange();
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
      next.add(this.data[i]._id as string);
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
      this.validationErrors = new Map(this.validationErrors).set(`${rowIndex}-${colIndex}`, '필수 항목입니다');
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
      detail: { row: this.data.find(r => r._id === rowId), expanded },
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

  private _fireSelectionChange(): void {
    this.dispatchEvent(new CustomEvent('selection-change', {
      detail: { selectedRows: this.getSelectedRows() },
      bubbles: true, composed: true
    }));
  }

  // define helper (follows existing pattern)
  static define(tagName: string = 'u-rich-table'): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, this);
    }
  }
}
