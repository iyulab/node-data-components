// src/components/u-rich-table/types.ts

/** Logical horizontal alignment — `start`/`end` follow the writing direction. */
export type ColumnAlign = 'start' | 'center' | 'end';

/** The alignment a column's cells render with: `align`, or `end` for `number` columns, else `start`. */
export function effectiveAlign(col: { align?: ColumnAlign; type?: ColumnDef['type'] }): ColumnAlign {
  if (col.align) return col.align;
  return col.type === 'number' ? 'end' : 'start';
}

export interface ColumnDef {
  key: string;
  label: string;
  /** Column width — a number is pixels (as in `@iyulab/flex-table`), a string is any CSS length (`'8rem'`). */
  width?: number | string;
  /**
   * Floor for the column, same units as `width`. A column with `minWidth` and no `width` is
   * **flexible**: it takes the space the other columns leave and never narrows below the floor —
   * on a narrow screen the table scrolls instead. With `width`, the column is `max(width, minWidth)`.
   * Declared widths are kept only when every column has an absolute `width` or `minWidth`.
   */
  minWidth?: number | string;
  sortable?: boolean;
  editable?: boolean;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'badge';
  options?: { value: string; label: string }[];
  badgeColors?: Record<string, string>;
  render?: (value: unknown, row: Record<string, unknown>) => string | HTMLElement;
  /** Cell alignment. Logical values, so right-to-left locales mirror. Default: `end` for `number`, else `start`. */
  align?: ColumnAlign;
  /** Header alignment. Default: the cell alignment — a header sits over its values. */
  headerAlign?: ColumnAlign;
  /** Opt-in, like `sortable`: the column gets a filter cell only when this is `true` (and the table is `filterable`). */
  filterable?: boolean;
  filterType?: 'text' | 'select';
  validator?: (value: unknown, row: Record<string, unknown>) => string | null;
  clipboardParse?: (text: string) => unknown;
  clipboardFormat?: (value: unknown) => string;
}

/**
 * 액션 셀(행 우측 끝)에 렌더할 커스텀 액션 하나. `URichTable.rowActions` 로 배열을
 * 주면 이 목록이 행 끝에 그려진다(`deletable` 이면 그 뒤에 삭제 버튼) —
 * `rowActions` 를 주지 않으면 종전 동작 그대로다(하위호환).
 */
export interface RowAction {
  /** 클릭 시 dispatch할 커스텀 이벤트 이름(예: 'row-edit', 'row-archive') */
  event: string;
  /** 버튼 라벨(접근 가능한 이름으로도 쓰인다 — title/aria-label) */
  label: string;
  /** 버튼에 표시할 아이콘/기호. 생략하면 label의 첫 글자를 쓴다 */
  icon?: string;
}

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

/** `RowAction.event` 로 지정한 이벤트가 실제로 dispatch될 때의 detail 형태 */
export interface RowActionEventDetail {
  row: Record<string, unknown>;
}

/**
 * 정렬 기준 하나 — `flex-table`·`createODataSource` 와 같은 모양이다(`{ key, direction }`). `u-rich-table` 은 한 열로
 * 정렬하므로 길이는 0 또는 1 이다.
 */
export interface SortCriteria {
  key: string;
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
  /**
   * 사용자가 행을 "열었다" — 셀 클릭 또는 포커스된 행에서의 `Enter`. `selectable` 과 무관하다:
   * 선택은 "무엇을 처리할까", 활성화는 "무엇을 볼까"이다. `editable` 열에서 `Enter` 는 이미
   * 셀 편집 진입 신호이므로 그 경우는 내지 않는다(`via: 'keyboard'` 는 비-editable 열에서만 발생).
   */
  'row-activate': CustomEvent<{ row: Record<string, unknown>; id: string; via: 'click' | 'keyboard' }>;
  'sort-change': CustomEvent<{ criteria: SortCriteria[] }>;
  /** `filteredCount` is present in `data-mode="client"`: how many rows pass the filters, across all pages. */
  'filter-change': CustomEvent<{ filters: FilterState; filteredCount?: number }>;
  'page-change': CustomEvent<{ page: number; pageSize: number }>;
  /**
   * TSV pasted onto the table (Ctrl/Cmd + V, not in an editor), parsed into rows for the app to insert.
   * Named apart from the native `paste`, which also bubbles out of the cell editors.
   */
  'clipboard-paste': CustomEvent<{ rows: Record<string, unknown>[] }>;
  /** Copy could not put the text on the clipboard, or paste could not read it. */
  'clipboard-error': CustomEvent<{ action: 'copy' | 'paste'; error: unknown }>;
}
