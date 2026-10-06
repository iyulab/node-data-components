import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';
import { axActive } from './ax';

/**
 * `u-rich-table` — what assistive technology receives as the keyboard moves (Chromium's accessibility
 * tree, `./ax.ts`). The keyboard suite asserts which cell holds DOM focus; this asserts that the browser
 * exposes that cell, with its role and text, as the current node — including the header row (row −2).
 */

type Table = HTMLElement & {
  columns: { key: string; label: string; sortable?: boolean }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
};

let table: Table;
afterEach(() => document.body.replaceChildren());

async function mount() {
  table = document.createElement('u-rich-table') as Table;
  table.columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'note', label: 'Note' },
  ];
  table.data = [0, 1, 2].map((i) => ({ _id: `r${i}`, name: `name ${i}`, note: `note ${i}` }));
  document.body.append(table);
  await table.updateComplete;
}

const press = async (keys: string) => {
  await userEvent.keyboard(keys);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 40));
};
const cell = (r: number, c: number) =>
  table.shadowRoot!.querySelector<HTMLElement>(`td[data-cell][data-row="${r}"][data-col="${c}"]`)!;

describe('u-rich-table — accessibility tree', () => {
  it('the current node is the focused cell and follows the arrows into the header row', async () => {
    await mount();
    await userEvent.click(cell(1, 0));
    await press('{ArrowRight}');
    expect(await axActive()).toMatchObject({ role: 'gridcell', name: 'note 1', props: { focused: true } });
    await press('{ArrowUp}');
    expect(await axActive()).toMatchObject({ role: 'gridcell', name: 'note 0' });
    await press('{ArrowUp}');
    expect(await axActive()).toMatchObject({ role: 'columnheader', name: expect.stringContaining('Note') });
  });
});
