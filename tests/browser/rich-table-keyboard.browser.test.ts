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
  columns: { key: string; label: string; editable?: boolean; filterable?: boolean; sortable?: boolean }[];
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
    await press('{Tab}');
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

describe('u-rich-table keyboard — row controls are grid cells, not Tab stops', () => {
  const inTable = () => {
    const el = table.shadowRoot!.activeElement as HTMLElement | null;
    if (document.activeElement !== table || !el) return null;
    return el.hasAttribute('data-cell') ? `cell ${el.dataset.row},${el.dataset.col}` : `${el.localName}.${el.className}`;
  };

  it('Tab crosses the body once — no row checkbox or row button is a Tab stop', async () => {
    const before = await mount();
    const after = document.createElement('button');
    after.textContent = 'after';
    document.body.append(after);
    before.focus();
    const seen: string[] = [];
    for (let i = 0; i < 30 && document.activeElement !== after; i++) {
      await press('{Tab}');
      const at = inTable();
      if (at) seen.push(at);
    }
    expect(document.activeElement).toBe(after);
    // 그리드 전체가 Tab 정지점 하나다 — 머리 줄의 전체 선택 · 정렬 · 필터도 셀 이동으로 닿는다(APG Grid).
    expect(seen).toEqual(['cell 0,0']);
  });

  it('ArrowLeft reaches the selection cell; Space there toggles the row once', async () => {
    await mount();
    await userEvent.click(cell(1, 0));
    await settle();
    await press('{ArrowLeft}');
    expect(focused()).toEqual([1, -1]);
    await press(' ');
    expect([...table.selectedRowIds]).toEqual(['r1']);
    await press('{ArrowRight}');
    expect(focused()).toEqual([1, 0]);
  });

  it('a clicked row checkbox: arrows move the cell, Space is the checkbox’s (one toggle)', async () => {
    await mount();
    const box = cell(1, -1).querySelector('input')!;
    await userEvent.click(box);
    await settle();
    expect([...table.selectedRowIds]).toEqual(['r1']);
    await press(' ');
    expect([...table.selectedRowIds]).toEqual([]);
    await press('{ArrowRight}');
    expect(focused()).toEqual([1, 0]);
  });

  it('the row-actions cell: Enter goes in, Escape comes back, ↑/↓ move rows', async () => {
    await mount();
    const deleted: unknown[] = [];
    table.addEventListener('row-delete', (e) => deleted.push((e as CustomEvent).detail.row._id));
    await userEvent.click(cell(0, 1));
    await settle();
    await press('{ArrowRight}');
    expect(focused()).toEqual([0, 2]);
    await press('{Enter}');
    expect(inTable()).toMatch(/^button\.row-delete/);
    await press('{Escape}');
    expect(focused()).toEqual([0, 2]);
    await press('{ArrowDown}{Enter}{Enter}');
    expect(deleted).toEqual(['r1']);
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


describe('u-rich-table keyboard — the header and filter rows are grid rows', () => {
  const headCell = (r: number, c: number) =>
    table.shadowRoot!.querySelector<HTMLElement>(`[data-cell][data-row="${r}"][data-col="${c}"]`)!;
  const mountSortable = async () => {
    const before = await mount();
    table.columns = [
      { key: 'name', label: 'Name', editable: true, filterable: true, sortable: true } as Table['columns'][number],
      { key: 'note', label: 'Note' },
    ];
    await settle();
    return before;
  };

  it('↑ from the first row reaches the filter row, then the header row; header widgets are not Tab stops', async () => {
    await mountSortable();
    await userEvent.click(cell(0, 0));
    await settle();
    await press('{ArrowUp}');
    expect(focused()).toEqual([-1, 0]);
    await press('{ArrowUp}');
    expect(focused()).toEqual([-2, 0]);
    expect(table.shadowRoot!.querySelector('.sort-button')!.getAttribute('tabindex')).toBe('-1');
    expect(table.shadowRoot!.querySelector('thead input')!.getAttribute('tabindex')).toBe('-1');
    expect(filterInput().getAttribute('tabindex')).toBe('-1');
  });

  it('Enter on a sortable header cell sorts; Space on the select-all header cell selects the page', async () => {
    await mountSortable();
    const sorts: string[] = [];
    table.addEventListener('sort-change', (e) => sorts.push(`${(e as CustomEvent).detail.field}:${(e as CustomEvent).detail.direction}`));
    await userEvent.click(cell(0, 0));
    await settle();
    await press('{ArrowUp}{ArrowUp}');
    await press('{Enter}');
    expect(sorts).toEqual(['name:asc']);
    expect(headCell(-2, 0).getAttribute('aria-sort')).toBe('ascending');
    expect(focused(), 'focus stays on the header cell after the re-render').toEqual([-2, 0]);
    await press('{ArrowLeft}');
    expect(focused()).toEqual([-2, -1]);
    await press(' ');
    expect([...table.selectedRowIds].sort()).toEqual(['r0', 'r1', 'r2']);
  });

  it('on a filter cell, typing goes into the filter; Escape returns to the cell; ↓ from the input goes to the body', async () => {
    await mountSortable();
    const filters: string[] = [];
    table.addEventListener('filter-change', (e) => filters.push(JSON.stringify((e as CustomEvent).detail.filters)));
    await userEvent.click(cell(0, 0));
    await settle();
    await press('{ArrowUp}');
    expect(focused()).toEqual([-1, 0]);
    await press('n');
    expect(focused()).toBe('input');
    expect(filterInput().value).toBe('n');
    await press('{Escape}');
    expect(focused()).toEqual([-1, 0]);
    await press('{Enter}');
    expect(focused()).toBe('input');
    await press('{ArrowDown}');
    expect(focused()).toEqual([0, 0]);
    expect(filters.length).toBeGreaterThan(0);
  });

  it('an empty table keeps one Tab stop — the first header cell', async () => {
    const before = await mount();
    table.data = [];
    await settle();
    before.focus();
    await press('{Tab}');
    expect(focused()).toEqual([-2, -1]);
  });
});

describe('u-rich-table keyboard — Tab while editing leaves the table at its ends', () => {
  // Tab while editing walks the editable cells (spreadsheet convention). On the last editable cell it used to
  // re-open the same cell, and Shift+Tab on the first did the same: the only way out was Escape first.
  // Siblings commit and leave there (flex-table, u-simple-sheet) — SC 2.1.2.
  const editor = () => table.shadowRoot!.querySelector<HTMLInputElement>('.cell-edit-input');

  const startEdit = async (r: number, c: number) => {
    await userEvent.click(cell(r, c));
    await settle();
    await press('{Enter}');
    await new Promise((res) => requestAnimationFrame(res));
  };

  async function mountEditable() {
    const before = document.createElement('button');
    before.textContent = 'before';
    const after = document.createElement('button');
    after.textContent = 'after';
    table = document.createElement('u-rich-table') as Table;
    table.columns = [
      { key: 'name', label: 'Name', editable: true },
      { key: 'note', label: 'Note', editable: true },
    ];
    table.data = [0, 1].map((i) => ({ _id: `r${i}`, name: `name ${i}`, note: `note ${i}` }));
    document.body.append(before, table, after);
    await table.updateComplete;
    return { before, after };
  }

  it('Tab on the last editable cell commits and leaves the table', async () => {
    const { after } = await mountEditable();
    const updates: unknown[] = [];
    table.addEventListener('row-update', (e) => updates.push((e as CustomEvent).detail.value));
    await startEdit(1, 1);
    expect(editor()).not.toBeNull();
    await userEvent.keyboard('{Control>}a{/Control}changed');
    await press('{Tab}');
    expect(updates).toEqual(['changed']);
    expect(editor(), 'no editor re-opened').toBeNull();
    expect(document.activeElement).toBe(after);
  });

  it('Shift+Tab on the first editable cell commits and leaves the table backwards', async () => {
    const { before } = await mountEditable();
    await startEdit(0, 0);
    await press('{Shift>}{Tab}{/Shift}');
    expect(editor()).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  it('NEGATIVE Tab in the middle still walks to the next editable cell', async () => {
    await mountEditable();
    await startEdit(0, 1);
    await press('{Tab}');
    // The editing cell renders as a bare <td> — read its place from the row and column positions.
    const td = editor()!.closest('td')!;
    expect(editor()!.getAttribute('aria-label')).toBe('Name');
    expect([...td.parentElement!.parentElement!.children].indexOf(td.parentElement!)).toBe(1);
  });
});
