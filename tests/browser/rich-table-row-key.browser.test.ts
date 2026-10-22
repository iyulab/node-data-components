import { describe, it, afterEach, expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '../../src/components/u-rich-table/URichTable';
import '../../src/components/data-view/UDataView';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';
import type { UDataView } from '../../src/components/data-view/UDataView';
import { URichTableReact } from '../../src/react';

/**
 * `row-key` — 레코드의 키를 가리킨다(flex-table 의 `rowKey` 와 같은 이름·같은 뜻).
 *
 * 계기: 행 식별이 `_id` 로 고정돼, OData 엔티티(`Id`)나 업무 키(관리번호)를 쓰는 소비자는 모두 행마다 키를 `_id` 로 복제했다
 * (house-style 참조 앱 · 시안 구현 · 이 패키지 자신의 `u-record-picker`). 복제를 잊으면 경고 하나와 함께 «위치» 로 식별돼,
 * 목록 골격에 묶인 서버 페이지에서는 다른 페이지의 같은 자리 행과 선택이 겹친다.
 *
 * React 래퍼의 셀 렌더 풀도 `_id` 를 직접 읽어, 키 없는 행은 모두 같은 풀 키(`열::`)로 한 루트를 나눠 썼다.
 */
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROWS = [{ Id: 'G-1', name: 'Alpha' }, { Id: 'G-2', name: 'Bravo' }, { Id: 'G-3', name: 'Charlie' }];

let cleanup: (() => Promise<void> | void) | null = null;
afterEach(async () => { await cleanup?.(); cleanup = null; });

async function mountTable(set: (el: URichTable) => void) {
  const el = document.createElement('u-rich-table') as URichTable;
  el.setAttribute('selectable', '');
  el.columns = [{ key: 'name', label: 'Name' }];
  set(el);
  document.body.appendChild(el);
  await el.updateComplete;
  cleanup = () => el.remove();
  return el;
}

const rowBoxes = (el: URichTable) =>
  [...el.shadowRoot!.querySelectorAll('tbody .checkbox-cell input[type=checkbox]')] as HTMLInputElement[];

describe('u-rich-table row-key', () => {
  it('선택 · selection-change 가 row-key 가 가리킨 필드로 행을 말하고, 키 경고를 내지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await mountTable((t) => { t.setAttribute('row-key', 'Id'); t.data = ROWS; });
    const ids: string[][] = [];
    el.addEventListener('selection-change', (e) => ids.push([...(e as CustomEvent<{ selectedIds: string[] }>).detail.selectedIds]));
    await userEvent.click(rowBoxes(el)[0]);
    await userEvent.click(rowBoxes(el)[2]);
    expect(ids.at(-1)).toEqual(['G-1', 'G-3']);
    expect([...el.selectedRowIds]).toEqual(['G-1', 'G-3']);
    expect(warn.mock.calls.some((c) => String(c[0]).includes('rows have no key'))).toBe(false);
    warn.mockRestore();
  });

  it('함수 키도 받는다 — 행에서 키를 지어낸다', async () => {
    const el = await mountTable((t) => { t.rowKey = (row) => `k:${row.Id as string}`; t.data = ROWS; });
    await userEvent.click(rowBoxes(el)[1]);
    expect([...el.selectedRowIds]).toEqual(['k:G-2']);
  });

  it('row-activate 의 id 가 그 키다', async () => {
    const el = await mountTable((t) => { t.setAttribute('row-key', 'Id'); t.data = ROWS; });
    const got: string[] = [];
    el.addEventListener('row-activate', (e) => got.push((e as CustomEvent<{ id: string }>).detail.id));
    const cells = el.shadowRoot!.querySelectorAll('tbody td:not(.checkbox-cell)');
    await userEvent.click(cells[1] as HTMLElement);
    expect(got).toEqual(['G-2']);
  });

  it('NEGATIVE: row-key 를 주지 않으면 종전대로 _id 다', async () => {
    const el = await mountTable((t) => { t.data = ROWS.map((r) => ({ ...r, _id: `x${r.Id}` })); });
    await userEvent.click(rowBoxes(el)[0]);
    expect([...el.selectedRowIds]).toEqual(['xG-1']);
  });
});

describe('u-data-view row-key', () => {
  it('row-activate 의 id 가 row-key 가 가리킨 필드다', async () => {
    const view = document.createElement('u-data-view') as UDataView;
    view.style.width = '600px';
    view.mode = 'list';
    view.setAttribute('row-key', 'Id');
    view.data = ROWS;
    document.body.appendChild(view);
    await view.updateComplete;
    cleanup = () => view.remove();
    const got: string[] = [];
    view.addEventListener('row-activate', (e) => got.push(e.detail.id));
    await userEvent.click(view.shadowRoot!.querySelectorAll<HTMLElement>('[data-index]')[2]);
    expect(got).toEqual(['G-3']);
  });
});

describe('URichTableReact — 셀 렌더 풀의 행 구분', () => {
  async function mountReact(props: Record<string, unknown>) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    await act(async () => { root.render(React.createElement(URichTableReact, props)); });
    const el = container.querySelector('u-rich-table') as URichTable;
    await el.updateComplete;
    cleanup = async () => { await act(async () => { root.unmount(); }); container.remove(); };
    return el;
  }

  const columns = [{ key: 'name', label: 'Name', render: (v: unknown) => React.createElement('b', null, String(v)) }];

  it('키 없는 행도 각자 자기 React 셀을 갖는다 — 한 루트를 나눠 쓰지 않는다', async () => {
    const el = await mountReact({ columns, data: [{ name: 'Alpha' }, { name: 'Bravo' }, { name: 'Charlie' }] });
    const cells = [...el.shadowRoot!.querySelectorAll('tbody td b')].map((b) => b.textContent);
    expect(cells).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('row-key 를 준 행도 각자 자기 React 셀을 갖는다', async () => {
    const el = await mountReact({ columns, rowKey: 'Id', data: ROWS });
    const cells = [...el.shadowRoot!.querySelectorAll('tbody td b')].map((b) => b.textContent);
    expect(cells).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
});
