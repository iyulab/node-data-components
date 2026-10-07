// @vitest-environment happy-dom
import { describe, it, afterEach, expect } from 'vitest';
import '../src/components/u-rich-table/URichTable';

/**
 * 표의 페이저 = `u-pagination`(0.46.0). 목록이 따로 쓰는 페이저와 같은 컴포넌트이고, 표는 끌 수 있다.
 *
 * 계기: 목록 키트는 페이저를 표 밖에 둔다(같은 소스에 묶은 `u-pagination`). 내장 페이저를 끌 수 없어 그 화면에는 페이저가
 * 둘 그려졌고, 둘은 다른 구현(다른 크기 목록 · 다른 단추)이었다.
 */
type Table = HTMLElement & {
  columns: unknown[]; data: Record<string, unknown>[]; totalCount: number; page: number; pageSize: number;
  pageSizes: number[]; hidePagination: boolean; updateComplete: Promise<unknown>;
};
type Pager = HTMLElement & { updateComplete: Promise<unknown>; pageSizes: number[] };

let table: Table | null = null;
afterEach(() => { table?.remove(); table = null; });

async function mount(attrs: Record<string, string> = {}) {
  table = document.createElement('u-rich-table') as Table;
  for (const [k, v] of Object.entries(attrs)) table.setAttribute(k, v);
  table.columns = [{ key: 'name', label: 'Name' }];
  table.data = [{ _id: 1, name: 'a' }];
  table.totalCount = 120;
  table.pageSize = 20;
  document.body.appendChild(table);
  await table.updateComplete;
  const pager = table.shadowRoot!.querySelector('u-pagination') as Pager | null;
  await pager?.updateComplete;
  return pager;
}

describe('u-rich-table pager', () => {
  it('🔴hide-pagination draws no pager — a list with its own u-pagination shows one', async () => {
    expect(await mount({ 'hide-pagination': '' })).toBeNull();
  });

  it('page-sizes chooses the sizes offered (default 25 · 50 · 100); empty hides the choice', async () => {
    expect((await mount())!.pageSizes).toEqual([25, 50, 100]);
    table!.remove();
    const pager = await mount({ 'page-sizes': '20,40' });
    expect(pager!.pageSizes).toEqual([20, 40]);
    table!.pageSizes = [];
    await table!.updateComplete;
    await pager!.updateComplete;
    expect(pager!.shadowRoot!.querySelector('[part="page-size"]')).toBeNull();
  });

  it('🔴one page-change per click — the inner pager’s own event does not reach the host as a second one', async () => {
    const pager = (await mount())!;
    const seen: Array<{ page: number; pageSize: number }> = [];
    table!.addEventListener('page-change', (e) => seen.push((e as CustomEvent).detail));
    (pager.shadowRoot!.querySelector('[part="next"]') as HTMLElement).click();
    expect(seen).toEqual([{ page: 1, pageSize: 20 }]);
  });

  it('pageInfoFormatter still words the range — (total, start, end)', async () => {
    table = null;
    const t = document.createElement('u-rich-table') as Table & { pageInfoFormatter: (t: number, s: number, e: number) => string };
    t.pageInfoFormatter = (total, start, end) => `${start}-${end} / ${total}`;
    t.columns = [{ key: 'name', label: 'Name' }];
    t.data = [{ _id: 1, name: 'a' }];
    t.totalCount = 45;
    t.pageSize = 20;
    t.page = 1;
    document.body.appendChild(t);
    table = t;
    await t.updateComplete;
    const pager = t.shadowRoot!.querySelector('u-pagination') as Pager;
    await pager.updateComplete;
    expect(pager.shadowRoot!.querySelector('[part="range"]')!.textContent).toBe('21-40 / 45');
  });
});
