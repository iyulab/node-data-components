import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * The editor of a number column is the browser's number input, and in a right-to-left page it took the page as its paragraph
 * direction — the weak «-» went to the line end and read «1234.5-». The input is left-to-right; the text still sits at the
 * start edge of the page (the right).
 *
 * The text lives in a native input, so no Range can measure it — the oracle is pixels: the first run of ink at the left of the
 * text is the sign (a thin bar a few pixels tall) when the sign stands first, and a digit (tall) when it jumped to the end.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let wrap: HTMLElement;
afterEach(() => wrap?.remove());

async function shot() {
  const raw = (await page.screenshot({ save: false, base64: true } as never)) as unknown as { base64: string } | string;
  const base64 = typeof raw === 'string' ? raw : raw.base64;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('screenshot did not decode'));
    img.src = `data:image/png;base64,${base64}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return { data: ctx.getImageData(0, 0, img.width, img.height).data, width: img.width, scale: img.width / window.innerWidth };
}

async function editor(dir: 'ltr' | 'rtl'): Promise<HTMLInputElement> {
  wrap = document.createElement('div');
  wrap.setAttribute('dir', dir);
  document.body.appendChild(wrap);
  const table = document.createElement('u-rich-table') as HTMLElement & { columns: unknown; data: unknown; editable: boolean; updateComplete: Promise<unknown> };
  table.setAttribute('layout', 'table'); // the test window is phone-wide, so layout="auto" would be cards
  table.editable = true;
  table.style.cssText = 'display:block;width:380px';
  table.columns = [{ key: 'qty', label: 'Qty', type: 'number', editable: true }];
  table.data = [{ _id: 'a', qty: -1234.5 }];
  wrap.appendChild(table);
  await table.updateComplete;
  await sleep(150);
  table.shadowRoot!.querySelector('tbody td')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
  await table.updateComplete;
  await sleep(150);
  // the editor opens with its text selected — the highlight would read as ink
  const style = document.createElement('style');
  style.textContent = 'input::selection { background: transparent; color: #000; }';
  table.shadowRoot!.appendChild(style);
  return table.shadowRoot!.querySelector('.cell-edit-input') as HTMLInputElement;
}

async function ink(input: HTMLInputElement) {
  input.style.caretColor = 'transparent';
  await sleep(60);
  const box = input.getBoundingClientRect();
  const a = await shot();
  const s = a.scale;
  const x0 = Math.ceil(box.left * s) + 4;
  const x1 = Math.floor(box.right * s) - 4;
  const y0 = Math.ceil(box.top * s) + 3;
  const y1 = Math.floor(box.bottom * s) - 3;
  const dark = (x: number, y: number) => {
    const i = (y * a.width + x) * 4;
    return a.data[i] + a.data[i + 1] + a.data[i + 2] < 3 * 140;
  };
  const colHeight = (x: number) => {
    let n = 0;
    for (let y = y0; y < y1; y++) if (dark(x, y)) n++;
    return n;
  };
  let left = -1;
  let right = -1;
  let runEnd = -1;
  for (let x = x0; x < x1; x++) {
    if (colHeight(x) > 0) {
      if (left < 0) left = x;
      right = x;
    } else if (left >= 0 && runEnd < 0) {
      runEnd = x;
    }
  }
  if (runEnd < 0) runEnd = right + 1;
  let top = y1;
  let bottom = y0;
  if (left >= 0) {
    for (let x = left; x < runEnd; x++) for (let y = y0; y < y1; y++) if (dark(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  return { left, right, firstRunHeight: left < 0 ? 0 : bottom - top + 1, boxLeft: x0, boxRight: x1, scale: s };
}

describe('data-components — u-rich-table number editor keeps the sign in front', () => {
  it('right-to-left page: sign first, and the text stays at the page start edge (right)', async () => {
    const input = await editor('rtl');
    expect(input.type).toBe('number');
    const m = await ink(input);
    expect(m.left).toBeGreaterThan(0);
    expect(m.firstRunHeight, `the first ink run is ${m.firstRunHeight}px tall (a digit, so the sign moved to the end)`).toBeLessThanOrEqual(3 * m.scale);
    expect(m.left, 'the text sits at the right of the middle').toBeGreaterThan((m.boxLeft + m.boxRight) / 2);
  });

  it('left-to-right page: unchanged — sign first, text at the left', async () => {
    const input = await editor('ltr');
    const m = await ink(input);
    expect(m.firstRunHeight).toBeLessThanOrEqual(3 * m.scale);
    // the text begins at the left (the native spin buttons draw ink at the right, so the right edge is not the text's)
    expect(m.left, 'the text begins left of the middle').toBeLessThan((m.boxLeft + m.boxRight) / 2);
  });
});
