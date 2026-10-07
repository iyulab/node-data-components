/**
 * React 래퍼 엔트리 (`@iyulab/data-components/react`)
 *
 * `@lit/react` createComponent 기반 — rich property(`data`, `columns` 등)를
 * JSX props로 직접 전달할 수 있고, 커스텀 이벤트는 `onXxx` props로 노출됩니다.
 *
 * react / @lit/react 는 optional peerDependency — 이 서브패스를 import하는
 * React 소비자에게만 필요합니다.
 */
import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createComponent, type EventName } from '@lit/react';
import type { TemplateResult } from 'lit';

import './utilities/shadowDomProtection';

import { USimpleSheet } from './components/simple-sheet/USimpleSheet';
import type { SimpleSheetEventMap } from './components/simple-sheet/USimpleSheet';
import { UDataView, type DataViewEventMap } from './components/data-view/UDataView';
import { URichTable } from './components/u-rich-table/URichTable';
import type { ColumnDef, RichTableEventMap } from './components/u-rich-table/types';

/** USimpleSheet React 래퍼 — `SimpleSheetEventMap` 의 이벤트를 전부 `onXxx` 로 노출 */
export const USimpleSheetReact = createComponent({
  tagName: 'u-simple-sheet',
  elementClass: USimpleSheet,
  react: React,
  events: {
    onChange: 'change' as EventName<SimpleSheetEventMap['change']>,
    onPasteRejected: 'paste-rejected' as EventName<SimpleSheetEventMap['paste-rejected']>,
    onClipboardError: 'clipboard-error' as EventName<SimpleSheetEventMap['clipboard-error']>,
  },
});

/** `DataViewEventMap` → React `onXxx` prop — 완전성은 아래 단언이 컴파일 시간에 잰다(표와 같은 규칙). */
const DATA_VIEW_EVENTS = {
  onRowActivate: 'row-activate',
} as const satisfies Record<string, keyof DataViewEventMap>;

type UncoveredDataViewEvents = Exclude<
  keyof DataViewEventMap,
  (typeof DATA_VIEW_EVENTS)[keyof typeof DATA_VIEW_EVENTS]
>;
const _dataViewEventsAreExhaustive: UncoveredDataViewEvents extends never
  ? true
  : UncoveredDataViewEvents = true;
void _dataViewEventsAreExhaustive;

/** UDataView React 래퍼 — `onRowActivate` 는 두 표의 것과 같다. */
export const UDataViewReact = createComponent({
  tagName: 'u-data-view',
  elementClass: UDataView,
  react: React,
  events: DATA_VIEW_EVENTS as {
    [K in keyof typeof DATA_VIEW_EVENTS]: EventName<DataViewEventMap[(typeof DATA_VIEW_EVENTS)[K]]>;
  },
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
  onRowActivate: 'row-activate',
  onSortChange: 'sort-change',
  onFilterChange: 'filter-change',
  onPageChange: 'page-change',
  onClipboardPaste: 'clipboard-paste',
  onClipboardError: 'clipboard-error',
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

/** URichTable(vanilla) React 래퍼 — RichTableEventMap의 모든 이벤트를 onXxx로 노출 */
const BaseURichTableReact = createComponent({
  tagName: 'u-rich-table',
  elementClass: URichTable,
  react: React,
  events: RICH_TABLE_EVENTS as {
    [K in keyof typeof RICH_TABLE_EVENTS]: EventName<
      RichTableEventMap[(typeof RICH_TABLE_EVENTS)[K]]
    >;
  },
});

/**
 * React 셀 렌더러 — 레이어 경계는 유지한다. vanilla
 * `ColumnDef.render`(`URichTable`, `types.ts`)는 `string | HTMLElement`만 반환하는
 * 계약을 그대로 유지한다 — 이 타입은 **React 래퍼(`URichTableReact`)에서만** 쓰며,
 * `render`가 `ReactNode`도 반환할 수 있게 넓힌다.
 *
 * ⚠`HTMLElement`도 함께 선언하는 것은 «넓힘»이 아니라 **아래 `wrapColumnsForReact` 가
 * 이미 하고 있는 일을 그대로 적는 것**이다 — 그 함수는 `string`·`HTMLElement`·React
 * 노드 셋을 모두 분기해 처리한다. `ReactNode` 만 선언하면 vanilla 계약대로 쓴
 * `ColumnDef[]`(예: Lit 화면과 React 화면이 컬럼 정의를 공유하는 경우)이 **런타임에는
 * 동작하는데 타입에서 거부**된다.
 */
export interface ColumnDefReact extends Omit<ColumnDef, 'render'> {
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode | HTMLElement;
}

interface ReactCellRoot { container: HTMLElement; root: Root; rowId: string }

/**
 * `col.render`가 돌려준 값이 vanilla 계약(`string | HTMLElement`)을 벗어나면 —
 * React 엘리먼트로 보고 캐시된 React root에 마운트해 그 컨테이너를 대신 돌려준다.
 * root는 (컬럼 key + row `_id`) 단위로 재사용한다 — 매 Lit 재렌더마다 리마운트하면
 * React 쪽 로컬 상태(예: hover)가 매번 날아가고 비용도 크다.
 */
function wrapColumnsForReact(
  columns: ColumnDefReact[] | undefined,
  roots: Map<string, ReactCellRoot>,
): ColumnDef[] | undefined {
  if (!columns) return undefined;
  return columns.map((col): ColumnDef => {
    const originalRender = col.render;
    if (!originalRender) return col as ColumnDef;
    return {
      ...col,
      render: (value, row) => {
        const result = originalRender(value, row);
        if (typeof result === 'string') return result;
        if (result instanceof HTMLElement) return result;
        if (result == null || typeof result === 'boolean') return '';

        const rowId = String((row as { _id?: unknown })._id ?? '');
        const key = `${col.key}::${rowId}`;
        let entry = roots.get(key);
        if (!entry) {
          const container = document.createElement('span');
          entry = { container, root: createRoot(container), rowId };
          roots.set(key, entry);
        }
        entry.root.render(result);
        return entry.container;
      },
    };
  });
}

/**
 * 더 이상 렌더되지 않는(행이 사라졌거나 컬럼이 바뀐) 캐시 root를 정리한다.
 * `useEffect`(커밋 이후)에서만 부른다 — React root의 마운트/언마운트는 React 렌더
 * 단계 밖에서 하는 것이 안전하다(StrictMode 이중 호출과도 충돌하지 않는다).
 */
function pruneStaleRoots(
  roots: Map<string, ReactCellRoot>,
  columns: ColumnDefReact[] | undefined,
  data: Record<string, unknown>[] | undefined,
): void {
  const validColKeys = new Set((columns ?? []).map(c => c.key));
  const validRowIds = new Set((data ?? []).map(row => String((row as { _id?: unknown })._id ?? '')));
  for (const [key, entry] of roots) {
    const colKey = key.slice(0, key.length - 2 - entry.rowId.length);
    if (!validColKeys.has(colKey) || !validRowIds.has(entry.rowId)) {
      roots.delete(key);
      // react-dom은 다른 root가 렌더 중일 때 동기 unmount를 경고한다("Attempted to
      // synchronously unmount a root while React was already rendering") — 이 effect
      // 자체가 React 커밋 사이클 안에서 실행되므로, 실제 unmount는 그 사이클 밖(마이크로
      // 태스크)으로 미룬다.
      queueMicrotask(() => entry.root.unmount());
    }
  }
}

/**
 * 펼친 행의 상세 렌더러 — React 래퍼에서는 `ReactNode` 도 돌려줄 수 있다. vanilla 가 받는
 * Lit 템플릿·요소·문자열은 그대로 넘긴다(Lit 화면과 상세 렌더러를 공유하는 경우).
 */
export type DetailRendererReact = (row: Record<string, unknown>) => React.ReactNode | TemplateResult | HTMLElement;

const isTemplateResult = (v: unknown): v is TemplateResult =>
  typeof v === 'object' && v !== null && '_$litType$' in v;

/**
 * 상세 렌더러가 React 노드를 돌려주면 행(`_id`)마다 캐시된 React root 에 마운트해 그 컨테이너를
 * 넘긴다 — 셀 렌더러(`wrapColumnsForReact`)와 같은 수명 관리다. root 는 행이 **펼쳐져 있는
 * 동안** 산다: 접히거나(`row-expand` 의 `expanded: false`) 행이 데이터에서 사라지면 언마운트된다.
 */
function wrapDetailForReact(
  render: DetailRendererReact | undefined,
  roots: Map<string, ReactCellRoot>,
): URichTable['detailRenderer'] {
  if (!render) return undefined;
  return (row) => {
    const result = render(row);
    if (typeof result === 'string' || result instanceof HTMLElement || isTemplateResult(result)) return result;
    if (result == null || typeof result === 'boolean') return '';
    const rowId = String((row as { _id?: unknown })._id ?? '');
    let entry = roots.get(rowId);
    if (!entry) {
      const container = document.createElement('div');
      entry = { container, root: createRoot(container), rowId };
      roots.set(rowId, entry);
    }
    entry.root.render(result as React.ReactNode);
    return entry.container;
  };
}

/** 한 행의 상세 root 를 놓는다 — 커밋 사이클 밖(마이크로태스크)에서 언마운트한다(`pruneStaleRoots` 와 같은 이유). */
function releaseDetailRoot(roots: Map<string, ReactCellRoot>, rowId: string): void {
  const entry = roots.get(rowId);
  if (!entry) return;
  roots.delete(rowId);
  queueMicrotask(() => entry.root.unmount());
}

export type URichTableReactProps = Omit<React.ComponentProps<typeof BaseURichTableReact>, 'columns' | 'detailRenderer'> & {
  columns?: ColumnDefReact[];
  detailRenderer?: DetailRendererReact;
};

/**
 * `URichTable`(`data-view`가 아니라 `u-rich-table`) React 래퍼. 이벤트는
 * `BaseURichTableReact`(RichTableEventMap 전체를 onXxx로 노출)를 그대로 물려받고,
 * `columns[].render`에만 `ReactNode` 반환 경로를 추가한다.
 */
export const URichTableReact = forwardRef<URichTable, URichTableReactProps>((props, ref) => {
  const rootsRef = useRef<Map<string, ReactCellRoot>>(new Map());
  const detailRootsRef = useRef<Map<string, ReactCellRoot>>(new Map());
  const { columns, data, detailRenderer, onRowExpand, ...rest } = props;

  const wrappedColumns = useMemo(
    () => wrapColumnsForReact(columns, rootsRef.current),
    [columns]
  );
  const wrappedDetail = useMemo(
    () => wrapDetailForReact(detailRenderer, detailRootsRef.current),
    [detailRenderer]
  );

  // 접힌 행의 상세 root 를 놓은 뒤 소비자의 핸들러로 넘긴다.
  const handleRowExpand = useMemo(
    () => (e: RichTableEventMap['row-expand']) => {
      if (!e.detail.expanded) releaseDetailRoot(detailRootsRef.current, String((e.detail.row as { _id?: unknown })._id ?? ''));
      onRowExpand?.(e);
    },
    [onRowExpand]
  );

  useEffect(() => {
    pruneStaleRoots(rootsRef.current, columns, data);
    const ids = new Set((data ?? []).map(row => String((row as { _id?: unknown })._id ?? '')));
    for (const rowId of [...detailRootsRef.current.keys()]) {
      if (!ids.has(rowId)) releaseDetailRoot(detailRootsRef.current, rowId);
    }
  }, [columns, data]);

  useEffect(() => {
    const roots = rootsRef.current;
    const detailRoots = detailRootsRef.current;
    return () => {
      for (const entry of detailRoots.values()) queueMicrotask(() => entry.root.unmount());
      detailRoots.clear();
      // 같은 이유로(위 pruneStaleRoots 주석 참조) 마이크로태스크로 미룬다 — 이 cleanup은
      // 바깥 root 자신의 unmount 커밋 도중에 실행되므로, 안쪽 per-cell root들을 동기로
      // unmount하면 그 경고가 그대로 재현된다(실측).
      for (const entry of roots.values()) queueMicrotask(() => entry.root.unmount());
      roots.clear();
    };
  }, []);

  return React.createElement(BaseURichTableReact, {
    ...rest,
    data,
    columns: wrappedColumns,
    detailRenderer: wrappedDetail,
    onRowExpand: handleRowExpand,
    ref,
  } as React.ComponentProps<typeof BaseURichTableReact>);
});
URichTableReact.displayName = 'URichTableReact';

export { USimpleSheet, UDataView, URichTable };
export type { SheetColumn } from './components/simple-sheet/USimpleSheet';
export type { DataColumn, ViewMode, DataViewEventMap } from './components/data-view/UDataView';
export type {
  ColumnDef,
  CellPosition,
  SortCriteria,
  FilterState,
  RichTableEventMap,
  RowAction,
  RowActionEventDetail,
} from './components/u-rich-table/types';
