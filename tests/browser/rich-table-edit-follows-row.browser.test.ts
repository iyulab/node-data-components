import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * An open cell editor belongs to the row it was started on. The edit remembered a position in the page
 * (`rowIndex`) and confirmed whatever row stood there: a refresh that put a row above the one being
 * edited, or a sort, made `row-update` name another row — the host then saved the typed value into the
 * wrong record. Now the edit follows its row (by `_id`), and an edit whose row left the page is cancelled.
 */
type Table = HTMLElement & {
  columns: { key: string; label: string; editable?: boolean }[];
  data: Record<string, unknown>[];
  sortCriteria: { key: string; direction: 'asc' | 'desc' }[];
  updateComplete: Promise<unknown>;
};

let table: Table;
const updates: { row: Record<string, unknown>; field: string; value: unknown }[] = [];

beforeEach(() => {
  updates.length = 0;
  document.body.innerHTML = '';
});
afterEach(() => table?.remove());

const settle = async () => {
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 80));
};
const editor = () => table.shadowRoot!.querySelector<HTMLInputElement>('.cell-edit-input');

async function editFirstRow(data: Record<string, unknown>[]) {
  table = document.createElement('u-rich-table') as Table;
  table.columns = [{ key: 'name', label: 'Name', editable: true }];
  table.data = data;
  table.addEventListener('row-update', (e) => updates.push((e as CustomEvent).detail));
  document.body.appendChild(table);
  await table.updateComplete;
  const cell = table.shadowRoot!.querySelectorAll('tbody tr')[0].querySelectorAll('td')[0] as HTMLElement;
  cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
  await settle();
  await userEvent.keyboard('A!');
}

describe('URichTable — the cell editor follows its row', () => {
  it('🔴a refresh that puts a row above: Enter confirms the edited row, not the new one', async () => {
    await editFirstRow([{ _id: 'r0', name: 'a' }, { _id: 'r1', name: 'b' }]);
    table.data = [{ _id: 'new', name: 'new' }, { _id: 'r0', name: 'a' }, { _id: 'r1', name: 'b' }];
    await settle();
    expect(editor(), 'still editing').not.toBeNull();
    expect(editor()!.value).toBe('A!');
    expect(editor()!.closest('tr'), 'drawn in r0’s row').toBe(table.shadowRoot!.querySelectorAll('tbody tr')[1]);
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates.map((u) => [u.row._id, u.value])).toEqual([['r0', 'A!']]);
  });

  // Passes on the old code too — the sort path already confirmed on the right row. Kept so it stays that way.
  it('NEGATIVE a sort while editing: the edit is confirmed on its row', async () => {
    await editFirstRow([{ _id: 'r0', name: 'b' }, { _id: 'r1', name: 'a' }]);
    table.sortCriteria = [{ key: 'name', direction: 'asc' }]; // r0 «b» moves below r1 «a»
    await settle();
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates.map((u) => [u.row._id, u.value])).toEqual([['r0', 'A!']]);
  });

  it('🔴an edit whose row a refresh removed is cancelled — no row-update for another row', async () => {
    await editFirstRow([{ _id: 'r0', name: 'a' }, { _id: 'r1', name: 'b' }]);
    table.data = [{ _id: 'x', name: 'x' }, { _id: 'y', name: 'y' }];
    await settle();
    expect(editor()).toBeNull();
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(updates).toEqual([]);
  });
});
