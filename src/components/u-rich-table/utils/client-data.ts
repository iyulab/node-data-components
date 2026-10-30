import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import type { ColumnDef, RichTableFilterModel, RichTableFilters, SortCriteria } from '../types.js';

type Row = Record<string, unknown>;

/** 이 표의 필터 행이 만드는 모델인가 — `flex-table` 의 `FilterModel` 중 `text`(contains) · `equals`. */
export function isRichTableFilterModel(model: unknown): model is RichTableFilterModel {
  if (!model || typeof model !== 'object') return false;
  const m = model as Record<string, unknown>;
  if (m.type === 'text') return m.mode === 'contains' && typeof m.value === 'string';
  if (m.type === 'equals') return m.value === null || ['string', 'number', 'boolean'].includes(typeof m.value);
  return false;
}

/** 거르지 않는 모델 — 빈 글자(flex-table 과 같은 규칙: 빈 텍스트 필터는 필터가 아니다). */
export function isEmptyFilter(model: RichTableFilterModel): boolean {
  return model.value === '';
}

/**
 * `dataMode="client"` 의 필터 — 필터 행이 내는 조건을 표가 직접 적용한다.
 * `equals` 는 값 일치(글자로 비교 — `<select>` 의 값은 글자다), `text` 는 components 의 검색 일치(`Locale.matchesSearch` —
 * 대소문자 · 발음 구별 기호를 접고, 한글은 자모 · 초성으로 «포함»).
 * 조건은 원시 값(`row[key]`)에 적용한다 — `render` 가 그리는 모양이 아니다.
 */
export function applyFilters(rows: Row[], filters: RichTableFilters): Row[] {
  const active = Object.entries(filters).filter(([, model]) => !isEmptyFilter(model));
  if (active.length === 0) return rows;
  return rows.filter(row => active.every(([key, model]) => {
    const cell = row[key];
    const text = cell === undefined || cell === null ? '' : String(cell);
    if (model.type === 'equals') return model.value === null ? text === '' : text === String(model.value);
    return Locale.matchesSearch(text, model.value);
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
