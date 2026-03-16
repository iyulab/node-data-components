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
  'selection-change': CustomEvent<{ selectedRows: Record<string, unknown>[] }>;
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
