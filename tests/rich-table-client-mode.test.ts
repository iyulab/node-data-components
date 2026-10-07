// @vitest-environment happy-dom
import { describe, it, afterEach, expect, vi } from 'vitest';
import '../src/components/u-rich-table/URichTable';

/**
 * `dataMode="client"` — `data` 가 전체 집합이고 표가 필터·정렬·페이지를 직접 적용한다.
 * 기본(`'server'`)은 종전 그대로 이벤트만 내고 `data` 를 받은 대로 그린다(NEGATIVE 로 고정).
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  dataMode: 'client' | 'server';
  pageSize: number;
  page: number;
  totalCount: number;
  updateComplete: Promise<unknown>;
  selectedRowIds: ReadonlySet<string>;
  filteredRowCount: number;
  noMatchingMessage: string;
  emptyMessage: string;
};

const COLUMNS = [
  { key: 'name', label: 'Name', filterable: true, sortable: true },
  { key: 'status', label: 'Status', filterable: true, filterType: 'select', options: [{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }] },
  { key: 'qty', label: 'Qty', type: 'number', sortable: true },
];
const ROWS = [
  { _id: 'a', name: 'Aster', status: 'open', qty: 10 },
  { _id: 'b', name: 'Blue Harbor', status: 'done', qty: 2 },
  { _id: 'c', name: 'Cedar', status: 'open', qty: 100 },
  { _id: 'd', name: 'aster two', status: 'done', qty: 7 },
];

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

const mount = async (props: Partial<Table> = {}) => {
  const el = document.createElement('u-rich-table') as unknown as Table;
  el.setAttribute('filterable', '');
  el.columns = COLUMNS;
  el.data = ROWS;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};
const $$ = (el: Table, sel: string) => [...el.shadowRoot!.querySelectorAll(sel)] as HTMLElement[];
/** 데이터 행의 이름 열 — 필터 행은 제외한다. */
const names = (el: Table) => $$(el, 'tbody tr:not(.filter-row)').map((tr) => tr.querySelectorAll('td')[0]?.textContent?.trim());
/** i 번째 필터 컨트롤 — 선택 칸이 있으면 필터 행 앞에 빈 칸이 붙으므로 칸이 아니라 컨트롤로 센다. */
/** 페이저는 `u-pagination` — 그 섀도의 쪽 번호 버튼을 누른다. */
const pager = async (el: Table) => {
  const p = el.shadowRoot!.querySelector('u-pagination') as HTMLElement & { updateComplete: Promise<unknown> };
  await p.updateComplete;
  return p;
};
const pageButton = (p: HTMLElement, label: string) =>
  [...p.shadowRoot!.querySelectorAll<HTMLElement>('[part="page"]')].find((b) => b.textContent!.trim() === label)!;
const filterInput = (el: Table, i: number) => $$(el, '.filter-row input, .filter-row select')[i] as HTMLInputElement;
const type = async (el: Table, i: number, value: string, ev = 'input') => {
  const input = filterInput(el, i);
  input.value = value;
  input.dispatchEvent(new Event(ev));
  await el.updateComplete;
};
const sortBy = async (el: Table, i: number) => {
  ($$(el, 'thead .sort-button')[i]).click();
  await el.updateComplete;
};

describe('u-rich-table dataMode="client"', () => {
  it('🔴텍스트 필터는 대소문자를 가리지 않는 «포함», 선택 필터는 값 일치', async () => {
    const el = await mount({ dataMode: 'client' });
    await type(el, 0, 'ASTER');
    expect(names(el)).toEqual(['Aster', 'aster two']);
    await type(el, 1, 'done', 'change');
    expect(names(el)).toEqual(['aster two']);
  });

  it('🔴필터는 여전히 filter-change 를 낸다', async () => {
    const el = await mount({ dataMode: 'client' });
    const spy = vi.fn();
    el.addEventListener('filter-change', spy);
    await type(el, 0, 'ce');
    expect(spy.mock.calls[0][0].detail.filters).toEqual({ name: 'ce' });
  });

  it('🔴type:number 열은 수로 정렬한다(문자열 순서라면 10 < 100 < 2)', async () => {
    const el = await mount({ dataMode: 'client' });
    await sortBy(el, 1);
    expect(names(el)).toEqual(['Blue Harbor', 'aster two', 'Aster', 'Cedar']);
    await sortBy(el, 1);
    expect(names(el)).toEqual(['Cedar', 'Aster', 'aster two', 'Blue Harbor']);
  });

  it('🔴페이지를 직접 나누고, 푸터는 «걸러진» 건수를 말한다', async () => {
    const el = await mount({ dataMode: 'client', pageSize: 2 });
    expect(names(el)).toEqual(['Aster', 'Blue Harbor']);
    const p = await pager(el);
    expect(p.shadowRoot!.querySelector('[part="range"]')!.textContent).toMatch(/1\D+2\D+4/);
    pageButton(p, '2').click();
    await el.updateComplete;
    expect(names(el)).toEqual(['Cedar', 'aster two']);
  });

  it('🔴새 필터 조건은 첫 페이지로 돌아간다', async () => {
    const el = await mount({ dataMode: 'client', pageSize: 2 });
    pageButton(await pager(el), '2').click();
    await el.updateComplete;
    await type(el, 0, 'a');
    expect(el.page).toBe(0);
    expect(names(el)[0]).toBe('Aster');
  });

  it('🔴_id 없는 행도 걸러낸 뒤 고른 선택이 필터를 풀어도 같은 행에 남는다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await mount({ dataMode: 'client', data: ROWS.map(({ _id: _x, ...r }) => r) });
    el.setAttribute('selectable', '');
    await el.updateComplete;
    await type(el, 0, 'cedar');
    const box = () => $$(el, 'tbody tr:not(.filter-row) .checkbox-cell input')[0] as HTMLInputElement;
    box().click();
    await el.updateComplete;
    await type(el, 0, '');
    const checked = $$(el, 'tbody tr:not(.filter-row)')
      .filter((tr) => (tr.querySelector('.checkbox-cell input') as HTMLInputElement)?.checked)
      .map((tr) => tr.querySelectorAll('td')[1]?.textContent?.trim());
    expect(checked).toEqual(['Cedar']);
    expect([...el.selectedRowIds]).toEqual(['#2']);
  });

  it('🔴걸러진 건수를 알린다 — filteredRowCount 와 filter-change 의 filteredCount (페이지와 무관)', async () => {
    const el = await mount({ dataMode: 'client', pageSize: 1 });
    expect(el.filteredRowCount).toBe(4);
    const spy = vi.fn();
    el.addEventListener('filter-change', spy);
    await type(el, 0, 'aster');
    expect(spy.mock.calls[0][0].detail.filteredCount).toBe(2);
    expect(el.filteredRowCount).toBe(2);
  });

  it('🔴데이터는 있는데 걸러낸 결과가 비면 «일치 없음», data 가 비면 «데이터 없음»', async () => {
    const el = await mount({ dataMode: 'client', noMatchingMessage: 'No orders match', emptyMessage: 'No orders yet' });
    await type(el, 0, 'zzz');
    expect(el.shadowRoot!.querySelector('.empty-message')!.textContent).toBe('No orders match');
    el.data = [];
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.empty-message')!.textContent).toBe('No orders yet');
  });

  it('⚪NEGATIVE — server 모드의 filteredRowCount 는 호스트가 준 totalCount 이고, 이벤트에 filteredCount 가 없다', async () => {
    const el = await mount({ totalCount: 120 });
    expect(el.filteredRowCount).toBe(120);
    const spy = vi.fn();
    el.addEventListener('filter-change', spy);
    await type(el, 0, 'x');
    expect('filteredCount' in spy.mock.calls[0][0].detail).toBe(false);
  });

  it('⚪NEGATIVE — 기본(server)은 data 를 받은 대로 그리고 거르지 않는다', async () => {
    const el = await mount();
    await type(el, 0, 'cedar');
    expect(names(el)).toHaveLength(4);
    await sortBy(el, 1);
    expect(names(el)).toEqual(['Aster', 'Blue Harbor', 'Cedar', 'aster two']);
  });
});
