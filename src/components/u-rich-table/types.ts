// src/components/u-rich-table/types.ts

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  editable?: boolean;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'badge';
  options?: { value: string; label: string }[];
  badgeColors?: Record<string, string>;
  render?: (value: unknown, row: Record<string, unknown>) => string | HTMLElement;
  align?: 'left' | 'center' | 'right';
  filterable?: boolean;
  filterType?: 'text' | 'select';
  validator?: (value: unknown, row: Record<string, unknown>) => string | null;
  clipboardParse?: (text: string) => unknown;
  clipboardFormat?: (value: unknown) => string;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [field: string]: string;
}

export interface RichTableEventMap {
  /**
   * ⚠두 필드가 서로 다른 것을 센다 — `selectedRows` 는 **현재 페이지의 행 객체**,
   * `selectedIds` 는 페이지를 가로지르는 **누적 식별자**다. 서버 페이징에서 길이가 다른 것이 정상이다.
   */
  'selection-change': CustomEvent<{
    selectedRows: Record<string, unknown>[];
    selectedIds: string[];
  }>;
  /**
   * 사용자가 **전체선택 체크박스**를 조작했다. `selection-change` 와 함께 발생한다.
   *
   * 이 이벤트가 따로 있는 이유는 *"세 행을 골랐다"* 와 *"전체선택을 눌렀다"* 를 가르기 위해서다 —
   * 서버 페이징에서 후자는 앱이 *"조건에 맞는 전체 N건"* 을 제안할 자리다.
   * `pageRowIds` 는 이번 조작이 더하거나 뺀 **현재 페이지의** 식별자다.
   */
  'select-all': CustomEvent<{ checked: boolean; pageRowIds: string[] }>;
  'row-create': CustomEvent<{ row: Record<string, unknown> }>;
  'row-update': CustomEvent<{
    row: Record<string, unknown>;
    field: string;
    value: unknown;
    oldValue: unknown;
  }>;
  'row-delete': CustomEvent<{ row: Record<string, unknown> }>;
  'row-expand': CustomEvent<{ row: Record<string, unknown>; expanded: boolean }>;
  'sort-change': CustomEvent<{ field: string; direction: 'asc' | 'desc' | null }>;
  'filter-change': CustomEvent<{ filters: FilterState }>;
  'page-change': CustomEvent<{ page: number; pageSize: number }>;
  'paste': CustomEvent<{ rows: Record<string, unknown>[] }>;
}
