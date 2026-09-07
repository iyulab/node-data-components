import { describe, it, afterEach, expect, vi } from 'vitest';
import React, { act, useState, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { URichTableReact, type ColumnDefReact } from '../../src/react';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';
import type { ColumnDef } from '../../src/components/u-rich-table/types';

/**
 * 컴파일 시간 단언 — `wrapColumnsForReact` 는 `string`·`HTMLElement`·React 노드 셋을
 * 모두 분기해 처리하므로 **vanilla `ColumnDef[]` 를 그대로 넘기는 것이 유효**해야 한다.
 * 종전에는 `ColumnDefReact.render` 가 `ReactNode` 만 선언해 이 대입이 `TS2322` 로
 * 막혔다 — 런타임은 되는데 타입이 거부하는 «선언 ≠ 동작» 이었고, 실제로 한 소비앱의
 * CI 를 빨갛게 만들었다. 이 단언은 `tests/**` 가 `tsconfig.include` 에 있어
 * `npm run typecheck`(= `build` 게이트)에서 돈다 — 브라우저 러너를 켜지 않아도 잰다.
 */
const _vanillaColumnsAreAcceptable: ColumnDefReact[] = [] as ColumnDef[];
void _vanillaColumnsAreAcceptable;

/**
 * docket `#155` — React 셀 렌더러 부재.
 * vanilla `ColumnDef.render`는 `string | HTMLElement`만 반환하는 계약을 그대로 두고,
 * `URichTableReact`(React 래퍼)에서만 `ReactNode`를 받아 React root로 마운트해
 * `HTMLElement`로 감싸 넘긴다(`react.ts` `wrapColumnsForReact` 참조).
 *
 * ★**이 파일이 `tests/browser/`에 있는 이유** — `@lit/react`의 `package.json` `exports`
 * 는 `"node"` 조건에서 SSR 전용 빌드(`node/`)로 갈라진다. 그 빌드는 property-setting
 * `useLayoutEffect` 자체를 등록하지 않고 `_$litProps$` SSR 백에 담는데, 우리는 SSR을
 * 하지 않으므로 그 프로퍼티가 **어디에도 적용되지 않는다**(실측: `tests/*.test.ts`의
 * Node 프로젝트에서 이 스위트를 그대로 돌리면 `el.data`가 항상 `[]`로 남는다). Vitest
 * `unit` 프로젝트는 `environment: 'happy-dom'`이어도 모듈 자체는 여전히 Node.js
 * 프로세스(vite-node)에서 로드되므로 `"node"` 조건이 선택된다 — `environment`가
 * DOM 시뮬레이션만 바꿀 뿐 모듈 해석 조건은 안 바꾼다는 뜻이다. `browser` 프로젝트만
 * 실제 Playwright Chromium에서 번들을 실행해 `"browser"` 조건(정상 client 빌드)을
 * 탄다 — 이 리포가 이미 §CLAUDE.md에서 "jsdom이 재현하지 못하는 것"이라고 적어 둔
 * 범주의 새 사례다.
 */

// react-dom의 `act()`가 이 환경을 "테스트 환경"으로 인식하게 한다 — 없으면 셀 안에서
// Lit이 비동기로 트리거하는 per-cell React root의 render/unmount가 `act()` 경계 밖에서
// 스케줄되어, 테스트 사이에 "Attempted to synchronously unmount a root while React was
// already rendering" 레이스가 실제로 재현됐다(고쳐서 확인).
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement | null = null;
let root: Root | null = null;

afterEach(async () => {
  if (root) {
    await act(async () => { root!.unmount(); });
    root = null;
  }
  container?.remove();
  container = null;
});

const mount = async (props: Record<string, unknown>) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(React.createElement(URichTableReact, props));
  });
  const el = container.querySelector('u-rich-table') as URichTable;
  await el.updateComplete;
  return el;
};

describe('URichTableReact — React 셀 렌더러', () => {
  it('render가 React 엘리먼트를 반환하면 실제 DOM에 마운트되고 클릭이 동작한다', async () => {
    const handler = vi.fn();
    const el = await mount({
      columns: [{
        key: 'name',
        label: 'Name',
        render: () => React.createElement('button', { onClick: handler }, 'Edit'),
      }],
      data: [{ _id: 'r0', name: 'first' }],
    });

    const button = el.shadowRoot!.querySelector('tbody button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Edit');

    await act(async () => { button.click(); });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('render가 문자열을 반환하면 종전대로 문자열 그대로 렌더된다(vanilla 계약 유지)', async () => {
    const el = await mount({
      columns: [{ key: 'name', label: 'Name', render: (v: unknown) => `plain:${v}` }],
      data: [{ _id: 'r0', name: 'first' }],
    });

    const cell = el.shadowRoot!.querySelectorAll('tbody td')[0];
    expect(cell.textContent?.trim()).toBe('plain:first');
    expect(cell.querySelector('button')).toBeFalsy();
  });

  it('같은 셀은 재렌더 사이에 root를 재사용한다 — React 로컬 상태가 유지된다', async () => {
    const Counter = () => {
      const [n, setN] = useState(0);
      return React.createElement('button', { onClick: () => setN(x => x + 1) }, `n=${n}`);
    };
    const columns = [{ key: 'name', label: 'Name', render: () => React.createElement(Counter) }];
    const data = [{ _id: 'r0', name: 'first' }];

    const el = await mount({ columns, data });
    let button = el.shadowRoot!.querySelector('button') as HTMLButtonElement;
    await act(async () => { button.click(); }); // n=0 -> n=1
    expect(button.textContent).toBe('n=1');

    // 새 data 배열 참조로 재렌더(내용은 동일 행) — 리마운트라면 카운터가 0으로 되돌아간다
    await act(async () => {
      root!.render(React.createElement(URichTableReact, { columns, data: [...data] }));
    });
    await el.updateComplete;

    button = el.shadowRoot!.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toBe('n=1'); // 리마운트되지 않았다면 유지된다
  });

  it('행이 데이터에서 사라지면 그 셀의 React root가 언마운트된다(누수 방지)', async () => {
    const unmounted = vi.fn();
    const Probe = () => {
      useEffect(() => unmounted, []);
      return React.createElement('span', null, 'probe');
    };
    const columns = [{ key: 'name', label: 'Name', render: () => React.createElement(Probe) }];

    const el = await mount({ columns, data: [{ _id: 'r0', name: 'first' }] });
    expect(unmounted).not.toHaveBeenCalled();

    await act(async () => {
      root!.render(React.createElement(URichTableReact, { columns, data: [] }));
    });
    await el.updateComplete;

    expect(unmounted).toHaveBeenCalledTimes(1);
  });
});
