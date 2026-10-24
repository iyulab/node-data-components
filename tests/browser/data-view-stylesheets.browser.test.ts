import { describe, it, afterEach, expect } from 'vitest';
import { html } from 'lit';
import '../../src/components/data-view/UDataView';
import '../../src/components/u-record-picker/URecordPicker';
import type { UDataView } from '../../src/components/data-view/UDataView';
import type { URecordPicker } from '../../src/components/u-record-picker/URecordPicker';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';

/**
 * `stylesheets` on the two other elements that draw consumer markup in a shadow root — `u-data-view` (`renderCard` ·
 * `renderCell`) and `u-record-picker` (its lookup table's column `render`). Same name and meaning as `u-rich-table`'s and
 * `flex-table`'s. NEGATIVE: page CSS alone does not reach a card; the view keeps its own styles when sheets change.
 */
const ROWS = [{ _id: 'a', name: 'Open' }];
let el: HTMLElement | undefined;
let pageStyle: HTMLStyleElement | undefined;
afterEach(() => { el?.remove(); pageStyle?.remove(); el = undefined; pageStyle = undefined; });

const sheet = (css: string) => { const s = new CSSStyleSheet(); s.replaceSync(css); return s; };
const PIP = '.pip { display: inline-block; width: 40px; }';

async function mountView(sheets?: CSSStyleSheet[]): Promise<UDataView> {
  const v = document.createElement('u-data-view') as UDataView;
  if (sheets) v.stylesheets = sheets;
  v.data = ROWS;
  v.renderCard = (item) => html`<span class="pip">${String(item.name)}</span>`;
  el = v;
  document.body.appendChild(v);
  await v.updateComplete;
  return v;
}
const pip = (v: UDataView) => v.shadowRoot!.querySelector('.pip') as HTMLElement;
const width = (e: HTMLElement) => Math.round(e.getBoundingClientRect().width);

describe('u-data-view — stylesheets', () => {
  it('NEGATIVE page CSS does not reach markup a card renders', async () => {
    pageStyle = document.createElement('style');
    pageStyle.textContent = PIP;
    document.head.appendChild(pageStyle);
    const v = await mountView();
    expect(width(pip(v))).not.toBe(40);
  });

  it('a sheet passed in styles the card markup; replacing the set drops it; the view keeps its own styles', async () => {
    const v = await mountView();
    const own = v.shadowRoot!.adoptedStyleSheets.length;
    expect(own).toBeGreaterThan(0);
    v.stylesheets = [sheet(PIP)];
    await v.updateComplete;
    expect(width(pip(v))).toBe(40);
    expect(v.shadowRoot!.adoptedStyleSheets.length).toBe(own + 1);
    v.stylesheets = [];
    await v.updateComplete;
    expect(width(pip(v))).not.toBe(40);
    expect(v.shadowRoot!.adoptedStyleSheets.length).toBe(own);
  });

  it('sheets set before the view is connected apply on the first render', async () => {
    const v = await mountView([sheet(PIP)]);
    expect(width(pip(v))).toBe(40);
  });
});

describe('u-record-picker — stylesheets', () => {
  it('hands its sheets to the lookup table', async () => {
    const p = document.createElement('u-record-picker') as URecordPicker;
    p.search = async () => [];
    p.columns = [{ key: 'label', label: 'Name' }];
    const s = sheet(PIP);
    p.stylesheets = [s];
    el = p;
    document.body.appendChild(p);
    await p.updateComplete;
    const table = p.shadowRoot!.querySelector('u-rich-table') as URichTable;
    expect(table.stylesheets).toEqual([s]);
  });
});
