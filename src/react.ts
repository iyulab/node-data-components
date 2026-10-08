/**
 * React 래퍼 엔트리 (`@iyulab/data-components/react`)
 *
 * `@lit/react` createComponent 기반 — rich property(`data`, `columns` 등)를
 * JSX props로 직접 전달할 수 있고, 커스텀 이벤트는 `onXxx` props로 노출됩니다.
 *
 * react / @lit/react 는 optional peerDependency — 이 서브패스를 import하는
 * React 소비자에게만 필요합니다.
 */
import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createComponent, type EventName } from '@lit/react';
import type { ReactiveController, ReactiveControllerHost, TemplateResult } from 'lit';

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

/** UDataView 기본 래퍼 — `onRowActivate` 는 두 표의 것과 같다. 공개 래퍼(`UDataViewReact`)는 아래 — `renderCard` 에 React 노드 경로를 더한다. */
const BaseUDataViewReact = createComponent({
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

/**
 * React roots for what the renderers return — one per drawn cell (or expanded row), alive while the table draws it.
 *
 * Every `u-rich-table` update calls the renderers of all the cells it draws, synchronously. The first call of an
 * update schedules a microtask that releases the roots no call of that update asked for — a row that left the page, a
 * column that was removed, a detail that was collapsed. ⚠The pool does not read the rows: they may come from React
 * (`data`) or from a data source bound to the element (`bindSource`, `u-list-page`), which React never sees. The
 * former pruning compared against the React `data` prop and so released every root of a bound table.
 */
class ReactRootPool implements ReactiveController {
  private readonly roots = new Map<string, { container: HTMLElement; root: Root }>();
  private readonly drawn = new Set<string>();
  private host: ReactiveControllerHost | null = null;

  constructor(private readonly tag: 'span' | 'div') {}

  /** Follows the table's updates — a Lit controller on the element (an update that draws no cell still releases). */
  attach(host: (ReactiveControllerHost & HTMLElement) | null): void {
    if (host === this.host) return;
    this.host?.removeController(this);
    this.host = host;
    host?.addController(this);
  }

  hostUpdate(): void {
    this.drawn.clear();
  }

  hostUpdated(): void {
    for (const [key, entry] of this.roots) {
      if (this.drawn.has(key)) continue;
      this.roots.delete(key);
      // Unmounting inside a render that is still committing warns — outside it, it does not (measured).
      queueMicrotask(() => entry.root.unmount());
    }
  }

  /** Renders `node` into the root for `key` (made on first use) and returns its container for the table to place. */
  mount(key: string, node: React.ReactNode): HTMLElement {
    this.drawn.add(key);
    let entry = this.roots.get(key);
    if (!entry) {
      const container = document.createElement(this.tag);
      entry = { container, root: createRoot(container) };
      this.roots.set(key, entry);
    }
    entry.root.render(node);
    return entry.container;
  }

  dispose(): void {
    this.attach(null);
    for (const entry of this.roots.values()) queueMicrotask(() => entry.root.unmount());
    this.roots.clear();
    this.drawn.clear();
  }
}

/** A column `render` that returned a React node is mounted in the cell's root; strings and elements pass through. */
function wrapColumnsForReact(columns: ColumnDefReact[] | undefined, pool: ReactRootPool): ColumnDef[] | undefined {
  if (!columns) return undefined;
  return columns.map((col): ColumnDef => {
    const originalRender = col.render;
    if (!originalRender) return col as ColumnDef;
    return {
      ...col,
      render: (value, row) => {
        const result = originalRender(value, row);
        if (typeof result === 'string' || result instanceof HTMLElement) return result;
        if (result == null || typeof result === 'boolean') return '';
        const rowId = String((row as { _id?: unknown })._id ?? '');
        return pool.mount(`${col.key}::${rowId}`, result);
      },
    };
  });
}

/**
 * 펼친 행의 상세 렌더러 — React 래퍼에서는 `ReactNode` 도 돌려줄 수 있다. vanilla 가 받는
 * Lit 템플릿·요소·문자열은 그대로 넘긴다(Lit 화면과 상세 렌더러를 공유하는 경우).
 */
export type DetailRendererReact = (row: Record<string, unknown>) => React.ReactNode | TemplateResult | HTMLElement;

const isTemplateResult = (v: unknown): v is TemplateResult =>
  typeof v === 'object' && v !== null && '_$litType$' in v;

/** The detail renderer's React node is mounted in the row's root — it lives while the row is expanded and drawn. */
function wrapDetailForReact(render: DetailRendererReact | undefined, pool: ReactRootPool): URichTable['detailRenderer'] {
  if (!render) return undefined;
  return (row) => {
    const result = render(row);
    if (typeof result === 'string' || result instanceof HTMLElement || isTemplateResult(result)) return result;
    if (result == null || typeof result === 'boolean') return '';
    return pool.mount(String((row as { _id?: unknown })._id ?? ''), result as React.ReactNode);
  };
}

export type URichTableReactProps = Omit<React.ComponentProps<typeof BaseURichTableReact>, 'columns' | 'detailRenderer'> & {
  columns?: ColumnDefReact[];
  detailRenderer?: DetailRendererReact;
};

/**
 * `URichTable`(`data-view`가 아니라 `u-rich-table`) React 래퍼. 이벤트는
 * `BaseURichTableReact`(RichTableEventMap 전체를 onXxx로 노출)를 그대로 물려받고,
 * `columns[].render`·`detailRenderer` 에만 `ReactNode` 반환 경로를 추가한다.
 *
 * ⚠Props the caller did not give are not passed on — `@lit/react` assigns every prop it receives on every render, so
 * an always-passed `data` set the rows of a table bound to a data source (`u-list-page`, `bindSource`) to `undefined`
 * whenever the screen re-rendered.
 */
export const URichTableReact = forwardRef<URichTable, URichTableReactProps>((props, ref) => {
  const poolRef = useRef<ReactRootPool>(null);
  const detailPoolRef = useRef<ReactRootPool>(null);
  poolRef.current ??= new ReactRootPool('span');
  detailPoolRef.current ??= new ReactRootPool('div');
  const { columns, detailRenderer, ...rest } = props;

  const wrappedColumns = useMemo(() => wrapColumnsForReact(columns, poolRef.current!), [columns]);
  const wrappedDetail = useMemo(() => wrapDetailForReact(detailRenderer, detailPoolRef.current!), [detailRenderer]);

  // The element, for the pools to follow its updates — and the caller's ref, forwarded.
  const elementRef = useRef<URichTable | null>(null);
  const setRef = useCallback((el: URichTable | null) => {
    elementRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  useEffect(() => {
    const pools = [poolRef.current!, detailPoolRef.current!];
    for (const pool of pools) pool.attach(elementRef.current);
    // 이 cleanup 은 바깥 root 자신의 unmount 커밋 도중에 실행된다 — 풀은 언마운트를 마이크로태스크로 미룬다.
    return () => { for (const pool of pools) pool.dispose(); };
  }, []);

  return React.createElement(BaseURichTableReact, {
    ...rest,
    ...('columns' in props ? { columns: wrappedColumns } : {}),
    ...('detailRenderer' in props ? { detailRenderer: wrappedDetail } : {}),
    ref: setRef,
  } as React.ComponentProps<typeof BaseURichTableReact>);
});
URichTableReact.displayName = 'URichTableReact';

/** A card renderer for React — a React node, or what the element takes (a Lit template, an element, text). */
export type DataViewCardRendererReact = (item: Record<string, unknown>, index: number) => React.ReactNode | TemplateResult | HTMLElement;

export type UDataViewReactProps = Omit<React.ComponentProps<typeof BaseUDataViewReact>, 'renderCard'> & {
  renderCard?: DataViewCardRendererReact;
};

/**
 * `UDataView` React 래퍼 — `renderCard` 가 React 노드를 돌려줄 수 있다(카드마다 React root · 그려진 동안만 산다 — 표의 셀과 같은
 * 풀). 종전에는 Lit 템플릿만 받아, 표의 `render` 는 JSX 인 화면이 카드만 Lit 으로 써야 했다. 넘기지 않은 prop 은 전하지 않는다
 * (`URichTableReact` 와 같은 이유 — 소스에 묶인 카드 보기의 `data` 를 지우지 않게).
 */
export const UDataViewReact = forwardRef<UDataView, UDataViewReactProps>((props, ref) => {
  const poolRef = useRef<ReactRootPool>(null);
  poolRef.current ??= new ReactRootPool('div');
  const { renderCard, ...rest } = props;

  const wrappedCard = useMemo(() => {
    if (!renderCard) return undefined;
    const pool = poolRef.current!;
    return (item: Record<string, unknown>, index: number) => {
      const result = renderCard(item, index);
      if (typeof result === 'string' || result instanceof HTMLElement || isTemplateResult(result)) return result;
      if (result == null || typeof result === 'boolean') return '';
      return pool.mount(String(item._id ?? `#${index}`), result as React.ReactNode);
    };
  }, [renderCard]);

  const elementRef = useRef<UDataView | null>(null);
  const setRef = useCallback((el: UDataView | null) => {
    elementRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  useEffect(() => {
    const pool = poolRef.current!;
    pool.attach(elementRef.current);
    return () => pool.dispose();
  }, []);

  return React.createElement(BaseUDataViewReact, {
    ...rest,
    ...('renderCard' in props ? { renderCard: wrappedCard } : {}),
    ref: setRef,
  } as React.ComponentProps<typeof BaseUDataViewReact>);
});
UDataViewReact.displayName = 'UDataViewReact';

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
