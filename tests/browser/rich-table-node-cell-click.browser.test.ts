import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { html } from 'lit';
import '../../src/components/u-rich-table/URichTable';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';

/**
 * 셀 `render()` 가 «노드» 를 돌려줘도 그 셀을 누르면 행이 열린다.
 *
 * 실제 마우스는 누른 자리의 `td` 에 포커스를 주고(→ 표가 다시 그린다), 뗄 때 `click` 을 낸다. 다시 그리는 동안 누른 대상 노드가
 * 문서에서 떼어지면 브라우저는 그 `click` 을 내지 않는다. 문자열과 Lit 템플릿은 제자리에서 갱신돼 살아남지만, 노드는 매 그림마다
 * 새 감싸개 안으로 옮겨져 떼어졌다 — 그래서 노드를 돌려주는 열(React 래퍼의 뿌리 컨테이너도 같다)에서만 클릭이 행을 열지 못했다.
 * 합성 `click()` 은 포커스·누름을 거치지 않아 이 결함을 보지 못한다 — 실제 마우스(`userEvent.click`)로 잰다.
 */

let table: URichTable;
afterEach(() => { table?.remove(); });

const DATA = [{ _id: 'a', name: 'Alpha' }, { _id: 'b', name: 'Bravo' }];

async function mount(render: (v: unknown, row: Record<string, unknown>) => HTMLElement) {
  table = document.createElement('u-rich-table') as URichTable;
  table.style.width = '800px';
  table.layout = 'table';
  table.columns = [{ key: 'name', label: 'Name', render }];
  table.data = DATA;
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

function activations() {
  const got: string[] = [];
  table.addEventListener('row-activate', (e) => got.push(`${e.detail.id}:${e.detail.via}`));
  return got;
}

const cellNode = () => table.shadowRoot!.querySelector<HTMLElement>('tbody tr:nth-child(2) td [data-node]')!;

describe('u-rich-table — a cell whose render() returns a node still opens the row on a real click', () => {
  it('🔴a fresh element per render', async () => {
    await mount((v) => {
      const el = document.createElement('span');
      el.dataset.node = '';
      el.textContent = String(v);
      return el;
    });
    const got = activations();
    await userEvent.click(cellNode());
    expect(got, '누른 노드가 다시 그림에서 떼어지면 click 이 사라진다').toEqual(['b:click']);
  });

  it('🔴the same element returned again for the same row', async () => {
    const cache = new Map<unknown, HTMLElement>();
    await mount((v, row) => {
      let el = cache.get(row._id);
      if (!el) {
        el = document.createElement('span');
        el.dataset.node = '';
        el.textContent = String(v);
        cache.set(row._id, el);
      }
      return el;
    });
    const got = activations();
    const node = cellNode();
    await userEvent.click(node);
    expect(got).toEqual(['b:click']);
    expect(cellNode(), '같은 노드는 다시 그려도 그 자리에 남는다').toBe(node);
  });

  it('a template cell keeps working (baseline)', async () => {
    table = document.createElement('u-rich-table') as URichTable;
    table.style.width = '800px';
    table.layout = 'table';
    table.columns = [{ key: 'name', label: 'Name', render: (v) => html`<i data-node>${String(v)}</i>` }];
    table.data = DATA;
    document.body.appendChild(table);
    await table.updateComplete;
    const got = activations();
    await userEvent.click(cellNode());
    expect(got).toEqual(['b:click']);
  });

  it('a control inside the returned node still owns its own click', async () => {
    await mount((v) => {
      const b = document.createElement('button');
      b.dataset.node = '';
      b.textContent = String(v);
      return b;
    });
    const got = activations();
    await userEvent.click(cellNode());
    expect(got, '셀 안의 단추는 «행 열기» 가 아니다').toEqual([]);
  });
});
