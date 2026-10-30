import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * Whether a cell may change, decided per row — `editable: (row, col) => boolean` — and the
 * table-wide `editable` switch.
 *
 * A column whose cells lock with the row's state (a shipped order's quantity) could only opt in as a
 * whole, so the editor opened on a locked cell and a `validator` refused the value on commit. The
 * table-wide `editable` was documented as the gate for column editing but never read: a column with
 * `editable: true` edited in a table set to `editable = false`.
 */

type Row = Record<string, unknown>;
type Table = HTMLElement & {
  columns: { key: string; label: string; editable?: boolean | ((row: Row) => boolean) }[];
  data: Row[];
  editable: boolean;
  updateComplete: Promise<unknown>;
};

let table: Table;
afterEach(() => document.body.replaceChildren());

const unlocked = (row: Row) => !row.locked;

async function mount() {
  const after = document.createElement('button');
  after.textContent = 'after';
  table = document.createElement('u-rich-table') as Table;
  table.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
  table.columns = [
    { key: 'name', label: 'Name', editable: true },
    { key: 'qty', label: 'Qty', editable: unlocked },
  ];
  table.data = [0, 1, 2].map((i) => ({ _id: `r${i}`, name: `name ${i}`, qty: `${i}`, locked: i === 1 }));
  document.body.append(table, after);
  await table.updateComplete;
  return after;
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
const editor = () => table.shadowRoot!.querySelector<HTMLInputElement>('.cell-edit-input');
/** The editing cell renders as a bare `<td>` — read its row from its position. */
const editingRow = () => {
  const tr = editor()!.closest('tr')!;
  return [...tr.parentElement!.children].indexOf(tr);
};
const frame = () => new Promise((res) => requestAnimationFrame(res));

describe('u-rich-table — a locked row opens no editor', () => {
  it('double-click and Enter on a locked cell open nothing; Enter activates the row instead', async () => {
    await mount();
    const activated: string[] = [];
    table.addEventListener('row-activate', (e) => activated.push((e as CustomEvent).detail.via));
    await userEvent.dblClick(cell(1, 1));
    await settle();
    await frame();
    expect(editor(), 'double-click on a locked cell').toBeNull();
    activated.length = 0;
    await press('{Enter}');
    await frame();
    expect(editor(), 'Enter on a locked cell').toBeNull();
    expect(activated).toEqual(['keyboard']);

    await userEvent.dblClick(cell(2, 1));
    await settle();
    await frame();
    expect(editor(), 'the same column in an open row edits').not.toBeNull();
  });

  it('a locked cell is aria-readonly; the same column in an open row is not', async () => {
    await mount();
    expect(cell(1, 1).getAttribute('aria-readonly')).toBe('true');
    expect(cell(0, 1).hasAttribute('aria-readonly')).toBe(false);
  });

  it('Tab while editing skips the locked cell', async () => {
    await mount();
    await userEvent.dblClick(cell(1, 0));
    await settle();
    await frame();
    expect(editingRow()).toBe(1);
    await press('{Tab}');
    await frame();
    // Row 1's Qty is locked — the next editable cell is row 2's Name.
    expect(editor()!.getAttribute('aria-label')).toBe('Name');
    expect(editingRow()).toBe(2);
  });
});

describe('u-rich-table — the table-wide editable switch', () => {
  it('editable = false locks every cell, columns marked editable included', async () => {
    await mount();
    table.editable = false;
    await settle();
    await userEvent.dblClick(cell(0, 0));
    await settle();
    await frame();
    expect(editor()).toBeNull();
    expect(cell(0, 0).getAttribute('aria-readonly')).toBe('true');
  });

  it('NEGATIVE by default a column that opts in edits — the switch only takes editing away', async () => {
    await mount();
    await userEvent.dblClick(cell(0, 0));
    await settle();
    await frame();
    expect(editor()).not.toBeNull();
  });
});
