/**
 * Data Components
 *
 * Auto-initializes Shadow DOM style protection (protects Lit styles from Vite HMR)
 */

import './utilities/shadowDomProtection';

export * from './components/data-view/UDataView';
export * from './components/simple-sheet/USimpleSheet';
export * from './components/u-rich-table/URichTable';
export * from './components/u-record-picker/URecordPicker';

/**
 * `URichTable` 의 공개 API 가 요구하는 타입.
 *
 * ⚠**이 줄이 없으면 «타입이 있는데 쓸 수 없는 컴포넌트»가 된다** — `columns` 는
 * `ColumnDef[]` 를 요구하는데 소비자는 그 이름을 루트에서 import 할 수 없어, 내부 경로를
 * 딥임포트하거나(내부 배치가 곧 공개 계약이 된다) 같은 모양을 손으로 복제해야 했다
 * (업스트림이 필드를 바꿔도 모른 채 조용히 갈라진다).
 *
 * ★다른 두 컴포넌트는 타입이 **같은 파일**에 있어 위 `export *` 로 이미 나간다 —
 * `URichTable` 만 타입을 `types.ts` 로 분리해 배럴이 지나치고 있었다.
 */
export type {
  ColumnDef,
  CellPosition,
  SortState,
  FilterState,
  RichTableEventMap,
} from './components/u-rich-table/types';
export type { PickerItem } from './components/u-record-picker/types';
