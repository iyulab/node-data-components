/**
 * What names a row: the field whose value identifies it, or a function of the row — the same contract as
 * flex-table's `rowKey`. The default field is `_id`.
 */
export type RowKey = string | ((row: Record<string, unknown>) => unknown);

/**
 * The row's own key as a string, or `undefined` when it has none (`undefined`, `null` or `''`). Callers decide the
 * fallback — a table tracks a keyless row by position, a React render pool by the row object.
 */
export function rowKeyOf(row: Record<string, unknown>, key: RowKey = '_id'): string | undefined {
  const value = typeof key === 'function' ? key(row) : row[key];
  return value === undefined || value === null || value === '' ? undefined : String(value);
}
