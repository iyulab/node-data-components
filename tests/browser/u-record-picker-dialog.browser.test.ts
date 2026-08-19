import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-record-picker/URecordPicker';
import type { PickerItem } from '../../src/components/u-record-picker/types';

// ⚠Locale 핀 — rich-table-selection.browser.test.ts 가 세운 관행. 이 파일의 한 테스트가
// `messages.text('pickerSearchError')` 의 영문 문자열을 단언하므로, 핀 없이 두면 개발 머신의
// 기본 감지 로케일(`navigator.language`)에 따라 그 단언이 갈린다.
type Picker = HTMLElement & {
  search: (q: string) => Promise<PickerItem[]>;
  columns: { key: string; label: string }[];
  value?: string;
  selectedItem: PickerItem | null;
  updateComplete: Promise<unknown>;
};

const ITEMS: PickerItem[] = [
  { id: '1', label: 'Acme Corp' },
  { id: '2', label: 'Beta Inc' },
];

let el: Picker | null = null;
beforeEach(() => { Locale.set('en'); document.body.innerHTML = ''; });
afterEach(() => { el?.remove(); el = null; document.body.innerHTML = ''; Locale.set('en'); });

const mount = async () => {
  const picker = document.createElement('u-record-picker') as Picker;
  picker.search = async () => ITEMS;
  picker.columns = [{ key: 'label', label: 'Name' }];
  document.body.appendChild(picker);
  await picker.updateComplete;
  return picker;
};

const findButton = (picker: Picker) =>
  picker.shadowRoot!.querySelector('.find-btn') as HTMLElement;
const dialog = (picker: Picker) => picker.shadowRoot!.querySelector('u-dialog') as HTMLElement;
const table = (picker: Picker) => picker.shadowRoot!.querySelector('u-rich-table') as HTMLElement;
const row = (picker: Picker, i: number) =>
  table(picker).shadowRoot!.querySelectorAll('tbody tr')[i] as HTMLElement;
const cell = (picker: Picker, i: number) =>
  row(picker, i).querySelectorAll('td')[0] as HTMLElement;

describe('URecordPicker — lookup dialog', () => {
  it('the find button opens the dialog and runs an initial search', async () => {
    el = await mount();
    findButton(el).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    expect(dialog(el).hasAttribute('open')).toBe(true);
    expect(table(el).shadowRoot!.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('a single click on a row previews it (Confirm enables) WITHOUT closing the dialog', async () => {
    el = await mount();
    findButton(el).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    cell(el, 0).click();
    await el.updateComplete;

    // Negative control — this is the exact regression the corrected design guards against.
    expect(dialog(el).hasAttribute('open')).toBe(true);
    expect(el.value).toBeUndefined();
    const confirmBtn = el.shadowRoot!.querySelector('.dialog-footer u-button[color="primary"]');
    expect(confirmBtn?.hasAttribute('disabled')).toBe(false);
  });

  it('Confirm commits the previewed row and closes the dialog', async () => {
    el = await mount();
    findButton(el).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    cell(el, 1).click();
    await el.updateComplete;
    (el.shadowRoot!.querySelector('.dialog-footer u-button[color="primary"]') as HTMLElement)
      .click();
    await el.updateComplete;

    expect(el.value).toBe('2');
    expect(el.selectedItem).toEqual(ITEMS[1]);
    expect(dialog(el).hasAttribute('open')).toBe(false);
  });

  it('double-clicking a row commits it immediately (one step)', async () => {
    el = await mount();
    const handler = vi.fn();
    el.addEventListener('change', handler);
    findButton(el).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    row(el, 0).dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.value).toBe('1');
    expect(dialog(el).hasAttribute('open')).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('Cancel closes without committing', async () => {
    el = await mount();
    findButton(el).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    cell(el, 0).click();
    await el.updateComplete;
    (el.shadowRoot!.querySelector('.dialog-footer u-button[variant="ghost"]') as HTMLElement)
      .click();
    await el.updateComplete;

    expect(dialog(el).hasAttribute('open')).toBe(false);
    expect(el.value).toBeUndefined();
  });

  it('a rejected dialog search surfaces an error message and an empty table', async () => {
    el = document.createElement('u-record-picker') as Picker;
    el.search = async () => { throw new Error('network down'); };
    el.columns = [{ key: 'label', label: 'Name' }];
    document.body.appendChild(el);
    await el.updateComplete;

    findButton(el).click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    expect(dialog(el).hasAttribute('open')).toBe(true);
    expect(el.shadowRoot!.querySelector('.dialog-error')?.textContent).toContain('Search failed');
    // u-rich-table renders one placeholder <tr> (its own "empty" message) for zero data rows
    // rather than zero <tr> elements — confirm no *record* rows via that placeholder instead.
    expect(table(el).shadowRoot!.querySelector('tbody .empty-message')).toBeTruthy();
  });
});
