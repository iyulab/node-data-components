// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { USimpleSheet } from '../src/components/simple-sheet/USimpleSheet.js';

/**
 * `enter-move` — where Enter (Shift+Enter the other way) moves the selection, editing or not. Down by default (a spreadsheet's
 * habit, unchanged); `next` goes the way Tab does; `none` stays. At the last cell the selection stays.
 */
describe('USimpleSheet — enter-move', () => {
  let sheet: USimpleSheet | undefined;
  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
  });

  const mount = async (enterMove?: string): Promise<USimpleSheet> => {
    const el = (sheet = new USimpleSheet());
    el.rows = 3;
    el.cols = 3;
    if (enterMove !== undefined) el.setAttribute('enter-move', enterMove);
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  };

  const press = async (el: USimpleSheet, init: KeyboardEventInit, target?: Element) => {
    const node = target ?? el.shadowRoot!.querySelector<HTMLElement>('[tabindex="0"]')!;
    node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, cancelable: true, ...init }));
    await el.updateComplete;
  };

  /** The selected cell as `row,col` — the cell that carries the selection class. */
  const active = (el: USimpleSheet): string => {
    const rows = [...el.shadowRoot!.querySelectorAll('tbody tr')];
    for (let r = 0; r < rows.length; r++) {
      const cells = [...rows[r].querySelectorAll('td:not(.row-num)')];
      for (let c = 0; c < cells.length; c++) if (cells[c].classList.contains('anchor') || cells[c].classList.contains('selected')) return `${r},${c}`;
    }
    return 'none';
  };

  it('moves down by default; an unknown value reads as down', async () => {
    const el = await mount();
    await press(el, { key: 'Enter' });
    expect(active(el)).toBe('1,0');
    sheet!.remove();
    const other = await mount('sideways');
    await press(other, { key: 'Enter' });
    expect(active(other)).toBe('1,0');
  });

  it('`next` goes along the row and onto the next row at the end; Shift+Enter goes back', async () => {
    const el = await mount('next');
    await press(el, { key: 'Enter' });
    expect(active(el)).toBe('0,1');
    await press(el, { key: 'Enter' });
    await press(el, { key: 'Enter' });
    expect(active(el)).toBe('1,0');
    await press(el, { key: 'Enter', shiftKey: true });
    expect(active(el)).toBe('0,2');
  });

  it('`none` keeps the selection', async () => {
    const el = await mount('none');
    await press(el, { key: 'Enter' });
    expect(active(el)).toBe('0,0');
  });

  it('stays on the last cell under `next` and on the last row under `down`', async () => {
    const el = await mount('next');
    for (let i = 0; i < 12; i++) await press(el, { key: 'Enter' });
    expect(active(el)).toBe('2,2');
    sheet!.remove();
    const down = await mount('down');
    for (let i = 0; i < 6; i++) await press(down, { key: 'Enter' });
    expect(active(down)).toBe('2,0');
  });

  it('while editing, Enter commits the value and then moves the same way; Ctrl+Enter stays', async () => {
    const el = await mount('next');
    await press(el, { key: 'F2' });
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-input')!;
    input.value = 'hello';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await press(el, { key: 'Enter' }, input);
    expect(active(el)).toBe('0,1');
    expect(el.shadowRoot!.querySelector('.cell-input')).toBeNull();
    await press(el, { key: 'F2' });
    const again = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-input')!;
    await press(el, { key: 'Enter', ctrlKey: true }, again);
    expect(active(el)).toBe('0,1');
  });
});
