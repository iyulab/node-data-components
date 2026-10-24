import { describe, it, afterEach, expect } from 'vitest';
import { html } from 'lit';
import '../../src/components/u-rich-table/URichTable';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';

/**
 * `stylesheets` — constructable sheets adopted into the shadow root, so a cell's `render` markup can be styled. Page CSS
 * stops at the shadow root: a house marker or an app class in a cell came out unstyled (a seven-step progress mark drew
 * at size 0). Same name and meaning as flex-table's `stylesheets`. NEGATIVE: page CSS alone does not reach the cell, and
 * the table's own styles stay when sheets are added or replaced.
 */
const ROWS = [{ _id: 'a', status: 'Open' }];
let el: URichTable | undefined;
let pageStyle: HTMLStyleElement | undefined;
afterEach(() => { el?.remove(); pageStyle?.remove(); el = undefined; pageStyle = undefined; });

async function mount(): Promise<URichTable> {
  el = document.createElement('u-rich-table') as URichTable;
  el.columns = [{ key: 'status', label: 'Status', render: (v) => html`<span class="pip">${String(v)}</span>` }];
  el.data = ROWS;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const pip = (t: URichTable) => t.shadowRoot!.querySelector('tbody .pip') as HTMLElement;
const sheet = (css: string) => { const s = new CSSStyleSheet(); s.replaceSync(css); return s; };

describe('u-rich-table — stylesheets', () => {
  it('NEGATIVE page CSS does not reach markup a cell renders', async () => {
    pageStyle = document.createElement('style');
    pageStyle.textContent = '.pip { display: inline-block; width: 40px; }';
    document.head.appendChild(pageStyle);
    const t = await mount();
    expect(Math.round(pip(t).getBoundingClientRect().width)).not.toBe(40);
  });

  it('a sheet passed in styles the cell markup; replacing the set drops it; the table keeps its own styles', async () => {
    const t = await mount();
    const ownSheets = t.shadowRoot!.adoptedStyleSheets.length;
    expect(ownSheets).toBeGreaterThan(0);
    t.stylesheets = [sheet('.pip { display: inline-block; width: 40px; }')];
    await t.updateComplete;
    expect(Math.round(pip(t).getBoundingClientRect().width)).toBe(40);
    expect(t.shadowRoot!.adoptedStyleSheets.length).toBe(ownSheets + 1);
    t.stylesheets = [];
    await t.updateComplete;
    expect(Math.round(pip(t).getBoundingClientRect().width)).not.toBe(40);
    expect(t.shadowRoot!.adoptedStyleSheets.length).toBe(ownSheets);
  });

  it('sheets set before the table is connected apply on the first render', async () => {
    el = document.createElement('u-rich-table') as URichTable;
    el.stylesheets = [sheet('.pip { display: inline-block; width: 40px; }')];
    el.columns = [{ key: 'status', label: 'Status', render: (v) => html`<span class="pip">${String(v)}</span>` }];
    el.data = ROWS;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(Math.round(pip(el).getBoundingClientRect().width)).toBe(40);
  });
});
