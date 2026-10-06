import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * `u-rich-table` keyboard model, pressed with real keys.
 *
 * The keys were handled on the host, but no cell ever held DOM focus: clicking a cell set the
 * focused-cell state while focus stayed on the page body, so arrows, Enter, Space, Delete and
 * Ctrl/Cmd + A, C, V reached the table only while a control inside it (a row checkbox) had focus —
 * and then they took that control's keys too: ←/→ in a filter box moved the cell, Space toggled a
 * row, Delete emitted `row-delete`. Cells now hold focus with a roving tabindex (WAI-ARIA APG grid),
 * and the cell keys apply only to keys pressed on a cell.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string; editable?: boolean; filterable?: boolean }[];
  data: Record<string, unknown>[];
  filterable: boolean;
  deletable: boolean;
  updateComplete: Promise<unknown>;
  setSelection(ids: Iterable<string>): void;
  readonly selectedRowIds: ReadonlySet<string>;
};

let table: Table;
afterEach(() => document.body.replaceChildren());

async function mount() {
  const before = document.createElement('button');
  before.textContent = 'before';
  table = document.createElement('u-rich-table') as Table;
  table.setAttribute('selectable', '');
  table.filterable = true;
  table.deletable = true;
  table.columns = [
    { key: 'name', label: 'Name', editable: true, filterable: true },
    { key: 'note', label: 'Note' },
  ];
  table.data = [0, 1, 2].map((i) => ({ _id: `r${i}`, name: `name ${i}`, note: `note ${i}` }));
  document.body.append(before, table);
  await table.updateComplete;
  return before;
}

const settle = async () => {
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 30));
};
const press = async (keys: string) => {
  await userEvent.keyboard(keys);
  await settle();
};
const cell = (r: number, c: number) =>
  table.shadowRoot!.querySelector<HTMLElement>(`td[data-cell][data-row="${r}"][data-col="${c}"]`)!;
const focused = () => {
  const el = table.shadowRoot!.activeElement as HTMLElement | null;
  return el?.hasAttribute('data-cell') ? [Number(el.dataset.row), Number(el.dataset.col)] : el?.localName ?? null;
};
const filterInput = () => table.shadowRoot!.querySelector<HTMLInputElement>('tr.filter-row input')!;

describe('u-rich-table keyboard — cells hold focus', () => {
  it('Tab enters the grid on the first cell; arrows move DOM focus between cells', async () => {
    const before = await mount();
    before.focus();
    // The header and filter controls come first in Tab order; Tab until a cell has focus.
    for (let i = 0; i < 10 && !Array.isArray(focused()); i++) await press('{Tab}');
    expect(focused()).toEqual([0, 0]);
    await press('{ArrowDown}{ArrowRight}');
    expect(focused()).toEqual([1, 1]);
  });

  it('a clicked cell takes focus, and the arrows go on from there', async () => {
    await mount();
    await userEvent.click(cell(1, 1));
    await settle();
    expect(focused()).toEqual([1, 1]);
    await press('{ArrowUp}{ArrowLeft}');
    expect(focused()).toEqual([0, 0]);
  });

  it('the grid is one Tab stop — only the focused cell is tabbable', async () => {
    await mount();
    await userEvent.click(cell(2, 1));
    await settle();
    const stops = Array.from(table.shadowRoot!.querySelectorAll('td[data-cell][tabindex="0"]'));
    expect(stops).toEqual([cell(2, 1)]);
  });

  it('Enter on a non-editable cell emits row-activate; Space toggles the row', async () => {
    await mount();
    const activated: string[] = [];
    table.addEventListener('row-activate', (e) => activated.push(`${(e as CustomEvent).detail.id}:${(e as CustomEvent).detail.via}`));
    await userEvent.click(cell(1, 1));
    await settle();
    activated.length = 0;
    await press('{Enter}');
    expect(activated).toEqual(['r1:keyboard']);
    await press(' ');
    expect([...table.selectedRowIds]).toEqual(['r1']);
  });

  it('Escape ends an edit and focus returns to the cell', async () => {
    await mount();
    await userEvent.click(cell(1, 0));
    await settle();
    await press('{Enter}');
    await new Promise((r) => requestAnimationFrame(r));
    expect(focused()).toBe('input');
    await press('{Escape}');
    expect(focused()).toEqual([1, 0]);
  });
});

describe('u-rich-table keyboard — keys in a filter box are the box’s', () => {
  it('Space and ArrowLeft type and move the caret; they do not toggle a row or move the cell', async () => {
    await mount();
    await userEvent.click(cell(1, 1));
    await settle();
    await userEvent.click(filterInput());
    await press('ab{ArrowLeft} ');
    expect(filterInput().value).toBe('a b');
    expect([...table.selectedRowIds]).toEqual([]);
  });

  it('Delete edits the text and emits no row-delete; Ctrl+A selects the text, not the rows', async () => {
    await mount();
    const deleted: unknown[] = [];
    table.addEventListener('row-delete', (e) => deleted.push(e));
    table.setSelection(['r0']);
    await userEvent.click(cell(0, 1));
    await settle();
    await userEvent.click(filterInput());
    await press('xy{Home}{Delete}');
    expect(filterInput().value).toBe('y');
    expect(deleted).toEqual([]);
    await press('{Control>}a{/Control}');
    expect([...table.selectedRowIds]).toEqual(['r0']);
  });
});
