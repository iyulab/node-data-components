import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * 필터 행 계약 — 실제 레이아웃으로 잰다.
 *
 * ⑴필터 입력칸은 칸 안에 들어간다 — 공간이 남는 표에 가로 스크롤바가 생기지 않는다.
 * ⑵열의 `filterable` 은 opt-in 이다(`sortable` 과 같은 방향) — 표시한 열만 필터 칸을 받는다.
 * ⑶걸러낼 열이 하나도 없으면 필터 행 자체가 없다.
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
};

afterEach(() => { document.body.replaceChildren(); });

const mount = async (columns: Record<string, unknown>[], width = '900px') => {
  const el = document.createElement('u-rich-table') as unknown as Table;
  el.setAttribute('filterable', '');
  el.columns = columns;
  el.data = [{ _id: 'a', id: 'G-1', customer: 'Aster', status: 'pending', total: '₩1,240,000' }];
  el.style.width = width;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 30));
  return el;
};

const COLUMNS = [
  { key: 'id', label: 'Order', width: '120px' },
  { key: 'customer', label: 'Customer', width: '200px', filterable: true },
  { key: 'status', label: 'Status', width: '140px', filterable: true, filterType: 'select',
    options: [{ value: 'pending', label: 'Pending' }] },
  { key: 'total', label: 'Total', width: '120px', align: 'right', filterable: true },
];

describe('u-rich-table 필터 행', () => {
  it('🔴공간이 남는 표에서 필터 입력칸이 넘치지 않는다 — 가로 스크롤바 없음', async () => {
    const el = await mount(COLUMNS);
    const wrap = el.shadowRoot!.querySelector('.table-wrap') as HTMLElement;
    expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
    for (const input of el.shadowRoot!.querySelectorAll('.filter-row input, .filter-row select')) {
      const cell = (input as HTMLElement).closest('td')!.getBoundingClientRect();
      expect((input as HTMLElement).getBoundingClientRect().right).toBeLessThanOrEqual(cell.right + 0.5);
    }
  });

  it('🔴filterable 을 적은 열만 필터 칸을 받는다', async () => {
    const el = await mount(COLUMNS);
    const cells = [...el.shadowRoot!.querySelectorAll('.filter-row td')] as HTMLElement[];
    expect(cells.map((td) => td.querySelector('input, select') ? 'f' : '-').join('')).toBe('-fff');
  });

  it('🔴걸러낼 열이 없으면 표가 filterable 이어도 필터 행이 없다', async () => {
    const el = await mount(COLUMNS.map(({ filterable: _f, ...c }) => c));
    expect(el.shadowRoot!.querySelector('.filter-row')).toBeNull();
  });
});
