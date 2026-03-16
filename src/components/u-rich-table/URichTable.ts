// src/components/u-rich-table/URichTable.ts
import { URichTable } from './URichTable.component.js';

URichTable.define('u-rich-table');

declare global {
  interface HTMLElementTagNameMap {
    'u-rich-table': URichTable;
  }
}

export { URichTable };
export type { ColumnDef, CellPosition, SortState, FilterState, RichTableEventMap } from './types.js';
