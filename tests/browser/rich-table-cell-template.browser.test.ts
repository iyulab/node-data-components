import { describe, it, afterEach, expect } from 'vitest';
import { html } from 'lit';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '../../src/components/u-rich-table/URichTable';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';
import { URichTableReact } from '../../src/react';

/**
 * 셀 `render` 가 Lit 템플릿을 돌려준다 — 펼친 행의 `detailRenderer` 와 같은 세 가지(문자열 · 요소 · 템플릿).
 *
 * 계기: Lit 으로 쓰는 화면이 상태 칸에 `u-tag` 를 그리려면 `document.createElement` 로 요소를 손으로 지어야 했다 —
 * 템플릿을 돌려주면 값 대신 `String(value)` 가 그려졌다(오류 없이). React 래퍼는 같은 템플릿을 React 노드로 오인해 마운트했다.
 */
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROWS = [{ _id: 'a', status: 'Open' }, { _id: 'b', status: 'Closed' }];
let cleanup: (() => Promise<void> | void) | null = null;
afterEach(async () => { await cleanup?.(); cleanup = null; });

describe('u-rich-table — 셀 render 의 Lit 템플릿', () => {
  it('템플릿이 셀에 그려진다 — 값 문자열로 떨어지지 않는다', async () => {
    const el = document.createElement('u-rich-table') as URichTable;
    el.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
    el.columns = [{ key: 'status', label: 'Status', render: (v) => html`<mark data-probe>${String(v)}</mark>` }];
    el.data = ROWS;
    document.body.appendChild(el);
    await el.updateComplete;
    cleanup = () => el.remove();
    const marks = [...el.shadowRoot!.querySelectorAll('tbody mark[data-probe]')].map((m) => m.textContent);
    expect(marks).toEqual(['Open', 'Closed']);
  });

  it('URichTableReact 도 템플릿을 그대로 넘긴다 — React 노드로 마운트하지 않는다', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(URichTableReact, { layout: 'table',
        columns: [{ key: 'status', label: 'Status', render: (v: unknown) => html`<mark data-probe>${String(v)}</mark>` }],
        data: ROWS,
      }));
    });
    const el = container.querySelector('u-rich-table') as URichTable;
    await el.updateComplete;
    cleanup = async () => { await act(async () => { root.unmount(); }); container.remove(); };
    const marks = [...el.shadowRoot!.querySelectorAll('tbody mark[data-probe]')].map((m) => m.textContent);
    expect(marks).toEqual(['Open', 'Closed']);
  });
});
