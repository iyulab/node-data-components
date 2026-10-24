import { describe, it, expect, beforeEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-record-picker/URecordPicker';
import { axActive } from './ax.js';

/**
 * The inline search field of `u-record-picker` is a combobox (APG editable combobox with list autocomplete): it says it
 * has a listbox, whether it is open, and which suggestion ↑/↓ has reached — the suggestion was only highlighted, so a
 * screen reader heard nothing while moving. After choosing, the field's value is the record's label.
 */
type Picker = HTMLElement & {
  search: (q: string) => Promise<{ id: string; label: string }[]>;
  columns: { key: string; label: string }[];
  value?: string;
  updateComplete: Promise<unknown>;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mount() {
  const p = document.createElement('u-record-picker') as Picker;
  p.setAttribute('label', 'Customer');
  p.style.width = '260px';
  p.search = async (q) => [{ id: '1', label: `Acme ${q}` }, { id: '2', label: `Beta ${q}` }];
  p.columns = [{ key: 'label', label: 'Name' }];
  document.body.appendChild(p);
  await p.updateComplete;
  await sleep(60);
  return p;
}
const field = (p: Picker) => p.shadowRoot!.querySelector<HTMLInputElement>('input.main-input')!;

describe('u-record-picker — inline combobox', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('the field is a combobox controlling the suggestion list, closed at first', async () => {
    const p = await mount();
    const f = field(p);
    expect(f.getAttribute('role')).toBe('combobox');
    expect(f.getAttribute('aria-expanded')).toBe('false');
    const list = p.shadowRoot!.getElementById(f.getAttribute('aria-controls')!);
    expect(list?.getAttribute('role')).toBe('listbox');
  });

  it('typing opens the list; ↓ announces the suggestion it reached', async () => {
    const p = await mount();
    await userEvent.click(field(p));
    await userEvent.keyboard('ac');
    await sleep(600);
    expect(field(p).getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard('{ArrowDown}');
    await p.updateComplete;
    const current = await axActive();
    expect(current?.role).toBe('option');
    expect(current?.name).toContain('Acme');
  });

  it('choosing leaves the record label as the field value and closes the list', async () => {
    const p = await mount();
    await userEvent.click(field(p));
    await userEvent.keyboard('ac');
    await sleep(600);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await sleep(100);
    expect(p.value).toBe('2');
    expect(field(p).value).toBe('Beta ac');
    expect(field(p).getAttribute('aria-expanded')).toBe('false');
  });
});
