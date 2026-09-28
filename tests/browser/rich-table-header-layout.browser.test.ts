import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * 머리글 배치 계약 — 실제 레이아웃으로 잰다(계산값 · 좌표).
 *
 * ⑴열의 `align` 이 머리글에도 적용된다 — 숫자 열은 머리글과 값이 같은 가장자리에 붙는다.
 * ⑵전체 선택 체크박스는 머리글 칸, 곧 **행 체크박스와 같은 열**에 있고 이름이 있다.
 * ⑶보여 줄 것이 없는 툴바는 줄을 차지하지 않는다(종전: 체크박스 하나만 든 빈 띠).
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
  setSelection(ids: Iterable<string>): void;
};

afterEach(() => { document.body.replaceChildren(); });

const mount = async (attrs: string[] = []) => {
  const el = document.createElement('u-rich-table') as unknown as Table;
  for (const a of attrs) el.setAttribute(a, '');
  el.columns = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'total', label: 'Total', width: '120px', align: 'end' },
    { key: 'qty', label: 'Qty', width: '120px', align: 'end', sortable: true },
  ];
  el.data = [{ _id: 'a', name: 'A', total: 1000, qty: 2 }, { _id: 'b', name: 'B', total: 20, qty: 3 }];
  el.style.width = '700px';
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 30));
  return el;
};

const $ = (el: Table, sel: string) => el.shadowRoot!.querySelector(sel) as HTMLElement;
const $$ = (el: Table, sel: string) => [...el.shadowRoot!.querySelectorAll(sel)] as HTMLElement[];

describe('u-rich-table 머리글 배치', () => {
  it('🔴align:end 열의 머리글 글자가 값과 같은 끝 가장자리에 붙는다(정렬 버튼 포함)', async () => {
    const el = await mount();
    const ths = $$(el, 'thead th');
    expect(getComputedStyle(ths[1]).textAlign).toBe('end');
    // 정렬 가능한 열 — 머리글은 버튼이 칸을 채우므로 버튼 안의 배치를 본다
    const btn = ths[2].querySelector('.sort-button') as HTMLElement;
    expect(getComputedStyle(btn).justifyContent).toBe('flex-end');
    // 좌표로도 — 머리글 글자의 오른쪽 끝이 첫 행 값의 오른쪽 끝과 몇 px 안에 있다
    const range = document.createRange();
    range.selectNodeContents(ths[1]);
    const headRight = range.getBoundingClientRect().right;
    const cell = $$(el, 'tbody tr')[0].querySelectorAll('td')[1] as HTMLElement;
    range.selectNodeContents(cell);
    const cellRight = range.getBoundingClientRect().right;
    expect(Math.abs(headRight - cellRight)).toBeLessThan(2);
  });

  it('⚪NEGATIVE — align 이 없는 열의 머리글은 왼쪽 그대로', async () => {
    const el = await mount();
    expect(getComputedStyle($$(el, 'thead th')[0]).textAlign).toBe('left');
  });

  it('🔴전체 선택은 머리글 칸에 있고, 행 체크박스와 같은 x 에 있으며, 이름이 있다', async () => {
    const el = await mount(['selectable']);
    const all = $(el, 'thead .checkbox-cell input[type=checkbox]') as HTMLInputElement;
    const row = $(el, 'tbody .checkbox-cell input[type=checkbox]') as HTMLInputElement;
    expect(all).not.toBeNull();
    expect(all.getAttribute('aria-label')).toBeTruthy();
    expect(Math.abs(all.getBoundingClientRect().left - row.getBoundingClientRect().left)).toBeLessThan(1);
  });

  it('🔴보여 줄 것이 없는 툴바는 줄을 차지하지 않는다 — 선택하면 건수와 함께 나타난다', async () => {
    const el = await mount(['selectable']);
    expect($(el, '.toolbar').getBoundingClientRect().height).toBe(0);
    el.setSelection(['a']);
    await el.updateComplete;
    expect($(el, '.toolbar').getBoundingClientRect().height).toBeGreaterThan(0);
    expect($(el, '.selection-info span').textContent).toMatch(/1/);
  });

  it('⚪NEGATIVE — toolbar-end 에 무언가 꽂으면 선택이 없어도 툴바가 보인다', async () => {
    const el = document.createElement('u-rich-table') as unknown as Table;
    el.innerHTML = '<button slot="toolbar-end">Export</button>';
    el.columns = [{ key: 'name', label: 'Name' }];
    el.data = [{ _id: 'a', name: 'A' }];
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 30));
    expect($(el, '.toolbar').getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
