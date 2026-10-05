import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-rich-table/URichTable';

/**
 * A `date` column edits with `u-date-picker`, not the native date input — that one shows the browser's
 * UI language (`10/02/2026` in an English browser) while the table shows the ISO value. The picker's
 * text box reads and shows `YYYY-MM-DD`, with a calendar beside it. The stored value stays the ISO
 * day string; Enter commits and moves down, Escape cancels — but while the calendar is open, Escape
 * closes the calendar and keys pressed in it belong to it.
 */
type Table = HTMLElement & {
  columns: { key: string; label: string; type?: string; editable?: boolean; required?: boolean }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
};
type Picker = HTMLElement & { value: string; updateComplete: Promise<unknown> };

let table: Table;
const updates: { field: string; value: unknown }[] = [];

beforeEach(() => {
  Locale.set('en');
  updates.length = 0;
  document.body.innerHTML = '';
});
afterEach(() => table?.remove());

const settle = async () => {
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 80));
};

async function editing(value: unknown) {
  table = document.createElement('u-rich-table') as Table;
  table.columns = [{ key: 'd', label: 'D', type: 'date', editable: true }];
  table.data = [{ _id: 'r0', d: value }, { _id: 'r1', d: '2026-01-01' }];
  table.addEventListener('row-update', (e) => updates.push((e as CustomEvent).detail));
  document.body.appendChild(table);
  await table.updateComplete;
  const cell = table.shadowRoot!.querySelectorAll('tbody tr')[0].querySelectorAll('td')[0] as HTMLElement;
  cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
  await settle();
}

const picker = () => table.shadowRoot!.querySelector<Picker>('u-date-picker.cell-edit-input');
const text = () => picker()!.shadowRoot!.querySelector<HTMLInputElement>('[part~="input"]')!;
const calendarOpen = () => picker()!.matches(':state(open)');

describe('URichTable — date cell editor is u-date-picker', () => {
  it('edits with the picker, showing the ISO value focused and selected', async () => {
    await editing('2026-10-02');
    expect(picker(), 'picker editor').not.toBeNull();
    expect(table.shadowRoot!.querySelector('input[type="date"]')).toBeNull();
    expect(text().value).toBe('2026-10-02');
    expect(table.shadowRoot!.activeElement).toBe(picker());
    expect(text().selectionEnd! - text().selectionStart!).toBe(10);
  });

  it('reads a typed short form on Enter, stores YYYY-MM-DD and moves to the next row', async () => {
    await editing('2026-10-02');
    await userEvent.fill(text(), '20261231');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates).toEqual([expect.objectContaining({ field: 'd', value: '2026-12-31' })]);
    expect(text().value, 'the next row is being edited').toBe('2026-01-01');
  });

  it('rejects text that is not a date: keeps editing, keeps the value, says why', async () => {
    await editing('2026-10-02');
    await userEvent.fill(text(), '2026-02-30');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates).toEqual([]);
    expect(picker(), 'still editing').not.toBeNull();
    expect(table.shadowRoot!.querySelector('.validation-error')?.textContent?.trim()).toBeTruthy();
  });

  it('Escape with the calendar open closes the calendar and keeps editing; the next Escape cancels', async () => {
    await editing('2026-10-02');
    text().click();
    await settle();
    expect(calendarOpen(), 'precondition: calendar open').toBe(true);
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(picker(), 'still editing').not.toBeNull();
    expect(calendarOpen()).toBe(false);
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(picker()).toBeNull();
    expect(updates).toEqual([]);
  });

  it('a day picked in the calendar is the new value', async () => {
    await editing('2026-10-02');
    text().click();
    await settle();
    const grid = picker()!.shadowRoot!.querySelector('u-calendar')!.shadowRoot!;
    const day = grid.querySelector<HTMLElement>('[data-iso="2026-10-15"]');
    expect(day, 'precondition: day cell').toBeTruthy();
    await userEvent.click(day!);
    await settle();
    expect(updates).toEqual([expect.objectContaining({ value: '2026-10-15' })]);
  });

  it('NEGATIVE a value that is not an ISO day opens an empty box, and leaving it unchanged writes nothing', async () => {
    await editing(null);
    expect(text().value).toBe('');
    text().blur();
    (document.activeElement as HTMLElement | null)?.blur();
    picker()!.dispatchEvent(new FocusEvent('blur'));
    await settle();
    expect(updates).toEqual([]);
  });
});

/**
 * Moving on after an edit, for every column type. Enter and Tab decided where to go from the editing
 * cell *after* confirming it — which is empty once a confirm succeeds — so a successful edit never
 * moved on, and an edit that failed validation moved away from its error. And the editor that is
 * removed by moving on blurs, which must not confirm (and close) the cell that is now being edited.
 */
describe('URichTable — Enter and Tab move on from the confirmed cell', () => {
  async function editingText(columns: Table['columns']) {
    table = document.createElement('u-rich-table') as Table;
    table.columns = columns;
    table.data = [{ _id: 'r0', a: 'a0', b: 'b0' }, { _id: 'r1', a: 'a1', b: 'b1' }];
    table.addEventListener('row-update', (e) => updates.push((e as CustomEvent).detail));
    document.body.appendChild(table);
    await table.updateComplete;
    const cell = table.shadowRoot!.querySelectorAll('tbody tr')[0].querySelectorAll('td')[0] as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    await settle();
  }
  const editor = () => table.shadowRoot!.querySelector<HTMLInputElement>('input.cell-edit-input');

  it('Enter confirms and edits the same column in the next row', async () => {
    await editingText([{ key: 'a', label: 'A', editable: true }]);
    await userEvent.fill(editor()!, 'x');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates).toEqual([expect.objectContaining({ field: 'a', value: 'x' })]);
    expect(editor()?.value, 'editing row 1').toBe('a1');
  });

  it('Tab confirms and edits the next editable cell', async () => {
    await editingText([{ key: 'a', label: 'A', editable: true }, { key: 'b', label: 'B', editable: true }]);
    await userEvent.fill(editor()!, 'x');
    await userEvent.keyboard('{Tab}');
    await settle();
    expect(updates).toEqual([expect.objectContaining({ field: 'a', value: 'x' })]);
    expect(editor()?.value, 'editing column b').toBe('b0');
  });

  it('NEGATIVE an edit that fails validation stays on its cell with the error', async () => {
    await editingText([{ key: 'a', label: 'A', editable: true, required: true }]);
    await userEvent.fill(editor()!, '');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates).toEqual([]);
    expect(editor()?.value, 'still editing row 0').toBe('');
    expect(table.shadowRoot!.querySelector('.validation-error')).not.toBeNull();
  });
});
