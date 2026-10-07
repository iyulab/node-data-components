import type { ColumnDef, FilterState, SortCriteria } from '../types.js';

type Row = Record<string, unknown>;

/**
 * `dataMode="client"` 의 필터 — 필터 행이 내는 조건을 표가 직접 적용한다.
 * `filterType: 'select'` 은 값 일치, 그 밖은 대소문자를 가리지 않는 «포함».
 * 조건은 원시 값(`row[key]`)에 적용한다 — `render` 가 그리는 모양이 아니다.
 */
export function applyFilters(rows: Row[], filters: FilterState, columns: ColumnDef[]): Row[] {
  const active = Object.entries(filters).filter(([, v]) => v !== '');
  if (active.length === 0) return rows;
  const byKey = new Map(columns.map(c => [c.key, c]));
  return rows.filter(row => active.every(([key, value]) => {
    const cell = row[key];
    const text = cell === undefined || cell === null ? '' : String(cell);
    return byKey.get(key)?.filterType === 'select'
      ? text === value
      : text.toLocaleLowerCase().includes(value.toLocaleLowerCase());
  }));
}

/**
 * `dataMode="client"` 의 정렬 — 안정 정렬, 빈 값은 방향과 무관하게 뒤로.
 * `type: 'number'` 는 수로, `type: 'date'` 는 시각으로, 그 밖은 로케일 비교(숫자 구간은 수로).
 */
export function sortRows(rows: Row[], sort: SortCriteria, columns: ColumnDef[]): Row[] {
  const type = columns.find(c => c.key === sort.key)?.type;
  const sign = sort.direction === 'asc' ? 1 : -1;
  const key = (v: unknown): number | string => {
    if (type === 'number') return Number(v);
    if (type === 'date') return v instanceof Date ? v.getTime() : Date.parse(String(v));
    return String(v);
  };
  const empty = (v: unknown) => v === undefined || v === null || v === '';
  return [...rows].sort((a, b) => {
    const va = a[sort.key], vb = b[sort.key];
    if (empty(va) || empty(vb)) return empty(va) === empty(vb) ? 0 : empty(va) ? 1 : -1;
    const ka = key(va), kb = key(vb);
    const cmp = typeof ka === 'number' && typeof kb === 'number'
      ? ka - kb
      : String(ka).localeCompare(String(kb), undefined, { numeric: true, sensitivity: 'base' });
    return cmp * sign;
  });
}
