/**
 * React 래퍼 엔트리 (`@iyulab/data-components/react`)
 *
 * `@lit/react` createComponent 기반 — rich property(`data`, `columns` 등)를
 * JSX props로 직접 전달할 수 있고, 커스텀 이벤트는 `onXxx` props로 노출됩니다.
 *
 * react / @lit/react 는 optional peerDependency — 이 서브패스를 import하는
 * React 소비자에게만 필요합니다.
 */
import React from 'react';
import { createComponent, type EventName } from '@lit/react';

import './utilities/shadowDomProtection';

import { USimpleSheet } from './components/simple-sheet/USimpleSheet';
import { UDataView } from './components/data-view/UDataView';
import { URichTable } from './components/u-rich-table/URichTable';
import type { RichTableEventMap } from './components/u-rich-table/types';

/** USimpleSheet React 래퍼 — `change` 이벤트는 `onChange`로 노출 */
export const USimpleSheetReact = createComponent({
  tagName: 'u-simple-sheet',
  elementClass: USimpleSheet,
  react: React,
  events: {
    onChange: 'change' as EventName<CustomEvent<{ data: string[][] }>>,
  },
});

/** UDataView React 래퍼 */
export const UDataViewReact = createComponent({
  tagName: 'u-data-view',
  elementClass: UDataView,
  react: React,
});

/**
 * `RichTableEventMap` → React `onXxx` prop 대응.
 *
 * ⚠**이 목록은 손으로 쓸 수밖에 없다** — `createComponent` 는 런타임 객체를 요구하는데
 * 이벤트 맵은 타입이라 런타임에 남지 않는다. 그래서 «도출»이 불가능하고, 이 리포가
 * 반복해서 밟은 *«손으로 쓴 목록이 결함을 숨긴다»* 의 조건이 그대로 성립한다 —
 * 맵에 이벤트를 더하고 여기를 잊으면 **React 소비자에게만 조용히 없는 이벤트**가 된다.
 * ⇒ 도출 대신 **완전성을 컴파일 시간에 고정**한다(바로 아래).
 */
const RICH_TABLE_EVENTS = {
  onSelectionChange: 'selection-change',
  onSelectAll: 'select-all',
  onRowCreate: 'row-create',
  onRowUpdate: 'row-update',
  onRowDelete: 'row-delete',
  onRowExpand: 'row-expand',
  onSortChange: 'sort-change',
  onFilterChange: 'filter-change',
  onPageChange: 'page-change',
  onPaste: 'paste',
} as const satisfies Record<string, keyof RichTableEventMap>;

/**
 * `RichTableEventMap` 의 키 중 위 표가 덮지 않은 것 — **있으면 컴파일 에러**다.
 *
 * ⚠거짓 분기를 `never` 가 아니라 **빠진 키 자체**로 둔 것이 요점이다. `never` 로 두면
 * 에러가 `Type 'true' is not assignable to type 'never'` 라 **무엇이 빠졌는지 말하지 않는다.**
 * 지금은 `… to type '"select-all"'` 처럼 이름이 그대로 나온다.
 *
 * ★네거티브 컨트롤로 `onSelectAll` 을 지워 실제로 발화하는 것을 확인했다.
 */
type UncoveredRichTableEvents = Exclude<
  keyof RichTableEventMap,
  (typeof RICH_TABLE_EVENTS)[keyof typeof RICH_TABLE_EVENTS]
>;
const _richTableEventsAreExhaustive: UncoveredRichTableEvents extends never
  ? true
  : UncoveredRichTableEvents = true;
void _richTableEventsAreExhaustive;

/** URichTable React 래퍼 — RichTableEventMap의 모든 이벤트를 onXxx로 노출 */
export const URichTableReact = createComponent({
  tagName: 'u-rich-table',
  elementClass: URichTable,
  react: React,
  events: RICH_TABLE_EVENTS as {
    [K in keyof typeof RICH_TABLE_EVENTS]: EventName<
      RichTableEventMap[(typeof RICH_TABLE_EVENTS)[K]]
    >;
  },
});

export { USimpleSheet, UDataView, URichTable };
export type { SheetColumn } from './components/simple-sheet/USimpleSheet';
export type { DataColumn, ViewMode } from './components/data-view/UDataView';
export type {
  ColumnDef,
  CellPosition,
  SortState,
  FilterState,
  RichTableEventMap,
} from './components/u-rich-table/types';
