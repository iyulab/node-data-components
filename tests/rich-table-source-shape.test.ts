// @vitest-environment happy-dom
import { describe, it, afterEach, expect } from 'vitest';
import '../src/components/u-rich-table/URichTable';

/**
 * `u-rich-table` 의 정렬·페이지는 데이터 소스(`@iyulab/flex-table/odata` 의 `createODataSource`·`useODataSource`)와 같은
 * 모양이다 — `sort-change` 의 `detail.criteria` 는 소스의 `setSort` 가, `page-change` 의 0 기준 `detail.page` 는 `setPage` 가
 * 그대로 받는다. 종전에는 `{ field, direction }` · 1 기준이라, 소스를 이으면 정렬이 조용히 아무 일도 안 했다.
 */
type Criteria = { key: string; direction: 'asc' | 'desc' }[];
type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  totalCount: number;
  pageSize: number;
  page: number;
  sortCriteria: Criteria;
  updateComplete: Promise<unknown>;
};

afterEach(() => { document.body.replaceChildren(); });

const mount = async (props: Partial<Table> = {}) => {
  const el = document.createElement('u-rich-table') as unknown as Table;
  Object.assign(el, {
    columns: [{ key: 'name', label: 'Name', sortable: true }, { key: 'qty', label: 'Qty', sortable: true }],
    data: [{ _id: 1, name: 'a', qty: 1 }],
    totalCount: 60,
    pageSize: 25,
    ...props,
  });
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const sortButton = (el: Table, i: number) => el.shadowRoot!.querySelectorAll<HTMLElement>('.sort-button')[i];
const pageButtons = (el: Table) => [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.page-buttons button')];

describe('u-rich-table — 소스와 같은 정렬·페이지 모양', () => {
  it('🔴sort-change 는 criteria 를 낸다 — 오름 · 내림 · 없음', async () => {
    const el = await mount();
    const seen: Criteria[] = [];
    el.addEventListener('sort-change', (e) => seen.push((e as CustomEvent<{ criteria: Criteria }>).detail.criteria));
    for (let i = 0; i < 3; i++) {
      sortButton(el, 0).click();
      await el.updateComplete;
    }
    expect(seen).toEqual([[{ key: 'name', direction: 'asc' }], [{ key: 'name', direction: 'desc' }], []]);
  });

  it('🔴sortCriteria 를 넘기면 헤더가 그 정렬을 보인다(복원한 정렬)', async () => {
    const el = await mount({ sortCriteria: [{ key: 'qty', direction: 'desc' }] });
    const heads = el.shadowRoot!.querySelectorAll('th[aria-sort]');
    expect([...heads].map((h) => h.getAttribute('aria-sort'))).toEqual(['none', 'descending']);
  });

  it('🔴page 는 0 기준 — page=1 이면 페이저의 «2» 가 현재 · 다음은 page 2 를 낸다', async () => {
    const el = await mount({ page: 1 });
    const pages: number[] = [];
    el.addEventListener('page-change', (e) => pages.push((e as CustomEvent<{ page: number }>).detail.page));
    const current = pageButtons(el).find((b) => b.getAttribute('aria-current') === 'page');
    expect(current?.textContent?.trim()).toBe('2');
    pageButtons(el).at(-1)!.click();
    pageButtons(el).find((b) => b.textContent?.trim() === '1')!.click();
    expect(pages).toEqual([2, 0]);
  });
});
