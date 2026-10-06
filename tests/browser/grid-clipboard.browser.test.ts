import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/simple-sheet/USimpleSheet';
import '../../src/components/u-rich-table/URichTable';

/**
 * Ctrl+C / Ctrl+V on `u-simple-sheet` and `u-rich-table`, pressed with real keys.
 *
 * Both grids called the async Clipboard API alone, so a refused write (no permission, an insecure
 * page) lost the copy and Firefox-style missing `readText` lost the paste. They now take the
 * browser's clipboard event where it fires and the Clipboard API where it does not — Safari fires no
 * copy event without a text selection, stood in for here by swallowing the event before the grid.
 */

type Writable = Clipboard & { writeText: Clipboard['writeText']; readText: Clipboard['readText'] };
const clipboard = navigator.clipboard as Writable;
const original = { writeText: clipboard.writeText, readText: clipboard.readText };
const refuse = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
const cleanups: (() => void)[] = [];

afterEach(() => {
  clipboard.writeText = original.writeText;
  clipboard.readText = original.readText;
  cleanups.splice(0).forEach((f) => f());
  document.body.replaceChildren();
});

function recordCopies() {
  const seen: { text: string; prevented: boolean }[] = [];
  const listen = (e: ClipboardEvent) => seen.push({ text: e.clipboardData?.getData('text/plain') ?? '', prevented: e.defaultPrevented });
  document.addEventListener('copy', listen);
  cleanups.push(() => document.removeEventListener('copy', listen));
  return seen;
}

function withoutCopyEvent() {
  const swallow = (e: Event) => e.stopImmediatePropagation();
  window.addEventListener('copy', swallow, true);
  cleanups.push(() => window.removeEventListener('copy', swallow, true));
}

const tick = () => new Promise((r) => setTimeout(r, 30));

type Sheet = HTMLElement & { data: string[][]; rows: number; cols: number; updateComplete: Promise<unknown>; getData(): string[][] };

async function sheet() {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = 4;
  el.cols = 2;
  el.data = [['a', 'b'], ['c', 'd'], ['', ''], ['', '']];
  document.body.appendChild(el);
  await el.updateComplete;
  const cell = (r: number, c: number) => el.shadowRoot!.querySelector<HTMLElement>(`td.cell[data-row="${r}"][data-col="${c}"]`)!;
  await userEvent.click(cell(0, 0));
  await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowDown}{/Shift}');
  await el.updateComplete;
  return { el, cell };
}

describe('u-simple-sheet clipboard', () => {
  it('Ctrl+C fills the browser copy event — a refused Clipboard API does not matter', async () => {
    clipboard.writeText = refuse;
    const copies = recordCopies();
    await sheet();
    await userEvent.keyboard('{Control>}c{/Control}');
    await tick();
    expect(copies).toEqual([{ text: 'a\tb\nc\td', prevented: true }]);
  });

  it('Ctrl+V pastes what Ctrl+C copied, from the paste event', async () => {
    clipboard.writeText = refuse;
    clipboard.readText = refuse;
    const { el, cell } = await sheet();
    await userEvent.keyboard('{Control>}c{/Control}');
    await userEvent.click(cell(2, 0));
    await userEvent.keyboard('{Control>}v{/Control}');
    await tick();
    await el.updateComplete;
    expect(el.getData().slice(2)).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('where no copy event comes (Safari), Ctrl+C writes through the Clipboard API', async () => {
    const written: string[] = [];
    clipboard.writeText = async (text: string) => { written.push(text); };
    withoutCopyEvent();
    await sheet();
    await userEvent.keyboard('{Control>}c{/Control}');
    await tick();
    expect(written).toEqual(['a\tb\nc\td']);
  });

  it('when neither path takes the text, clipboard-error reports the copy', async () => {
    clipboard.writeText = refuse;
    withoutCopyEvent();
    const { el } = await sheet();
    const errors: string[] = [];
    el.addEventListener('clipboard-error', (e) => errors.push((e as CustomEvent).detail.action));
    await userEvent.keyboard('{Control>}c{/Control}');
    await tick();
    expect(errors).toEqual(['copy']);
  });
});

type Table = HTMLElement & {
  columns: { key: string; label: string; editable?: boolean }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
  setSelection(ids: Iterable<string>): void;
};

const rowCheckbox = (el: HTMLElement, r: number) =>
  el.shadowRoot!.querySelectorAll<HTMLInputElement>('td.checkbox-cell input[type="checkbox"]')[r];

async function table() {
  const el = document.createElement('u-rich-table') as Table;
  el.setAttribute('selectable', '');
  el.columns = [{ key: 'name', label: 'Name', editable: true }, { key: 'note', label: 'Note' }];
  el.data = [{ _id: 'r0', name: 'first', note: 'one' }, { _id: 'r1', name: 'second', note: 'two' }];
  document.body.appendChild(el);
  await el.updateComplete;
  const cell = (r: number, c: number) =>
    el.shadowRoot!.querySelectorAll('tbody tr')[r].querySelectorAll<HTMLElement>('td:not(.checkbox-cell)')[c];
  return { el, cell };
}

describe('u-rich-table clipboard', () => {
  it('Ctrl+C fills the browser copy event with the selected rows', async () => {
    clipboard.writeText = refuse;
    const copies = recordCopies();
    const { el } = await table();
    el.setSelection(['r0']);
    await el.updateComplete;
    // Keys reach the table through a focused control inside it — today the row checkbox.
    rowCheckbox(el, 0).focus();
    await userEvent.keyboard('{Control>}c{/Control}');
    await tick();
    expect(copies).toEqual([{ text: 'Name\tNote\nfirst\tone', prevented: true }]);
  });

  it('Ctrl+V reports the pasted rows as clipboard-paste — not as a native-looking `paste`', async () => {
    clipboard.writeText = refuse;
    const { el } = await table();
    const pasted: unknown[] = [];
    el.addEventListener('clipboard-paste', (e) => pasted.push((e as CustomEvent).detail.rows));
    el.setSelection(['r0']);
    await el.updateComplete;
    // Keys reach the table through a focused control inside it — today the row checkbox.
    rowCheckbox(el, 0).focus();
    await userEvent.keyboard('{Control>}c{/Control}{Control>}v{/Control}');
    await tick();
    expect(pasted).toEqual([[{ name: 'first', note: 'one' }]]);
  });

  it('Ctrl+C in a cell editor copies the editor text and leaves the clipboard to it', async () => {
    const written: string[] = [];
    clipboard.writeText = async (text: string) => { written.push(text); };
    const copies = recordCopies();
    const { el, cell } = await table();
    el.setSelection(['r0']);
    await el.updateComplete;
    cell(1, 0).dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    await el.updateComplete;
    await tick();
    await userEvent.keyboard('{Control>}a{/Control}{Control>}c{/Control}');
    await tick();
    expect(copies.map((c) => c.prevented)).toEqual([false]);
    expect(written, 'the selected rows must not overwrite what the editor copied').toEqual([]);
  });
});
