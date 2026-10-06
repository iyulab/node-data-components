import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';

/**
 * `u-rich-table`'s name comes from the host's `aria-label` — it names the grid and its pagination landmark.
 *
 * Defect: the grid is a `<table>` inside the shadow root, which a host attribute does not reach, so the grid had no
 * name and no way to get one; and every table's pagination was a `navigation` landmark named "Pagination" — two
 * tables on one screen gave two identical landmarks (axe `landmark-unique`), indistinguishable in a landmark list.
 */
type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  totalCount: number;
  pageSize: number;
  updateComplete: Promise<unknown>;
};

afterEach(() => { document.body.replaceChildren(); Locale.set('en'); });

async function mount(label?: string): Promise<Table> {
  const table = document.createElement('u-rich-table') as Table;
  if (label) table.setAttribute('aria-label', label);
  table.columns = [{ key: 'name', label: 'Name' }];
  table.data = [0, 1, 2].map((i) => ({ _id: `r${i}`, name: `name ${i}` }));
  table.totalCount = 30;
  table.pageSize = 10;
  document.body.append(table);
  await table.updateComplete;
  return table;
}

const count = (role: 'grid' | 'navigation', name: string) =>
  page.getByRole(role, { name, exact: true }).elements().length;

describe('u-rich-table accessible name', () => {
  it('two named tables — named grids and distinct pagination landmarks', async () => {
    await mount('Orders');
    await mount('Invoices');
    expect(count('grid', 'Orders')).toBe(1);
    expect(count('grid', 'Invoices')).toBe(1);
    expect(count('navigation', 'Orders pagination')).toBe(1);
    expect(count('navigation', 'Invoices pagination')).toBe(1);
  });

  it('the name follows the host attribute', async () => {
    const table = await mount('Before');
    table.setAttribute('aria-label', 'After');
    await table.updateComplete;
    expect(count('grid', 'After')).toBe(1);
  });

  it('the landmark name is localized', async () => {
    Locale.set('ko');
    await mount('주문');
    expect(count('navigation', '주문 페이지 이동')).toBe(1);
  });

  it('NEGATIVE — an unnamed table keeps the plain landmark name', async () => {
    await mount();
    expect(count('navigation', 'Pagination')).toBe(1);
  });
});
