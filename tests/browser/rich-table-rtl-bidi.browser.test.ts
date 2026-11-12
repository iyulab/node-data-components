import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';

/**
 * 셀의 글자는 앱이 넣은 데이터다 — 페이지 방향이 무엇이든. 오른쪽에서 왼쪽으로 가는 페이지의 라틴 글자(회사명 · 품번)는 페이지가 문단 방향이라
 * 끝의 마침표와 앞의 부호가 반대편으로 간다(«Blue Harbor Co.» 가 «.Blue Harbor Co»). 값마다 격리(`<bdi>`)해 값이 자기 방향으로 읽히고
 * 칸이 정한 정렬은 그대로 둔다.
 */
let table: URichTable;
afterEach(() => { table?.remove(); document.documentElement.dir = 'ltr'; });

async function mount(dir: 'ltr' | 'rtl', values: string[]) {
  document.documentElement.dir = dir;
  table = document.createElement('u-rich-table') as URichTable;
  table.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
  table.style.display = 'block';
  table.style.width = '500px';
  table.columns = [{ key: 'name', label: 'Name', width: '300px' }] as never;
  table.data = values.map((name, i) => ({ _id: String(i), name })) as never;
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 120));
}

function edges(text: string) {
  const td = [...table.shadowRoot!.querySelectorAll<HTMLElement>('td[data-cell]')].find((c) => c.textContent?.trim() === text)!;
  const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node && node.data.trim() !== text) node = walker.nextNode() as Text | null;
  const range = document.createRange();
  range.setStart(node!, 0);
  range.setEnd(node!, 1);
  const first = range.getBoundingClientRect();
  range.setStart(node!, node!.data.length - 1);
  range.setEnd(node!, node!.data.length);
  const last = range.getBoundingClientRect();
  return { first: first.left, last: last.left, cell: td.getBoundingClientRect(), lastRight: last.right, firstRight: first.right };
}

describe('u-rich-table — 값은 칸 안에서 자기 방향을 지킨다', () => {
  it('RTL 페이지의 라틴 값은 왼쪽에서 오른쪽으로 읽힌다 — 마침표가 마지막 낱말 뒤에 선다', async () => {
    await mount('rtl', ['Blue Harbor Co.']);
    const e = edges('Blue Harbor Co.');
    expect(e.last).toBeGreaterThan(e.first);
  });

  it('…값은 칸이 정한 자리(RTL 의 시작 = 오른쪽)에 그대로 선다', async () => {
    await mount('rtl', ['Blue Harbor Co.']);
    const e = edges('Blue Harbor Co.');
    expect(e.cell.right - e.lastRight).toBeLessThan(e.firstRight - e.cell.left);
  });

  it('NEGATIVE: LTR 페이지에서는 종전 그대로 — 첫 글자가 칸의 시작 가장자리 쪽', async () => {
    await mount('ltr', ['Blue Harbor Co.']);
    const e = edges('Blue Harbor Co.');
    expect(e.last).toBeGreaterThan(e.first);
    expect(e.first - e.cell.left).toBeLessThan(30);
  });
});
