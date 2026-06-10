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

/** URichTable React 래퍼 — RichTableEventMap의 모든 이벤트를 onXxx로 노출 */
export const URichTableReact = createComponent({
  tagName: 'u-rich-table',
  elementClass: URichTable,
  react: React,
  events: {
    onSelectionChange: 'selection-change' as EventName<RichTableEventMap['selection-change']>,
    onRowCreate: 'row-create' as EventName<RichTableEventMap['row-create']>,
    onRowUpdate: 'row-update' as EventName<RichTableEventMap['row-update']>,
    onRowDelete: 'row-delete' as EventName<RichTableEventMap['row-delete']>,
    onRowExpand: 'row-expand' as EventName<RichTableEventMap['row-expand']>,
    onSortChange: 'sort-change' as EventName<RichTableEventMap['sort-change']>,
    onFilterChange: 'filter-change' as EventName<RichTableEventMap['filter-change']>,
    onPageChange: 'page-change' as EventName<RichTableEventMap['page-change']>,
    onPaste: 'paste' as EventName<RichTableEventMap['paste']>,
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
