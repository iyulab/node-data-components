// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../src/components/u-record-picker/URecordPicker';
import type { PickerItem } from '../src/components/u-record-picker/types';

type Picker = HTMLElement & {
  search: (q: string) => Promise<PickerItem[]>;
  debounce: number;
  value?: string;
  selectedItem: PickerItem | null;
  updateComplete: Promise<unknown>;
};

let el: Picker | null = null;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { el?.remove(); el = null; vi.useRealTimers(); });

const mount = async (search: Picker['search']) => {
  const picker = document.createElement('u-record-picker') as Picker;
  picker.search = search;
  document.body.appendChild(picker);
  await picker.updateComplete;
  return picker;
};

const input = (picker: Picker) =>
  picker.shadowRoot!.querySelector('input.main-input') as HTMLInputElement;

const type = async (picker: Picker, text: string) => {
  const inputEl = input(picker);
  inputEl.value = text;
  inputEl.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await picker.updateComplete;
};

describe('URecordPicker — inline typeahead', () => {
  it('debounces search and renders results as u-option', async () => {
    const search = vi.fn(async (q: string): Promise<PickerItem[]> =>
      q === 'ac' ? [{ id: '1', label: 'Acme Corp' }] : []);
    el = await mount(search);

    await type(el, 'ac');
    expect(search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);
    await el.updateComplete;

    expect(search).toHaveBeenCalledWith('ac');
    const options = el.shadowRoot!.querySelectorAll('u-option');
    expect(options.length).toBe(1);
    expect(options[0].textContent?.trim()).toBe('Acme Corp');
  });

  it('a later keystroke supersedes a slower in-flight search (no stale overwrite)', async () => {
    let resolveFirst!: (items: PickerItem[]) => void;
    const search = vi.fn((q: string) => {
      if (q === 'a') return new Promise<PickerItem[]>((resolve) => { resolveFirst = resolve; });
      return Promise.resolve<PickerItem[]>([{ id: '2', label: 'Beta Inc' }]);
    });
    el = await mount(search);

    await type(el, 'a');
    await vi.advanceTimersByTimeAsync(250);
    await type(el, 'ab');
    await vi.advanceTimersByTimeAsync(250);
    await el.updateComplete;

    resolveFirst([{ id: '1', label: 'Stale Corp' }]);
    await el.updateComplete;

    const options = el.shadowRoot!.querySelectorAll('u-option');
    expect(options.length).toBe(1);
    expect(options[0].textContent?.trim()).toBe('Beta Inc');
  });

  it('clicking a result commits value/selectedItem and fires change', async () => {
    const item: PickerItem = { id: '7', label: 'Zenith Ltd' };
    el = await mount(async () => [item]);
    const handler = vi.fn();
    el.addEventListener('change', handler);

    await type(el, 'z');
    await vi.advanceTimersByTimeAsync(250);
    await el.updateComplete;

    (el.shadowRoot!.querySelector('u-option') as HTMLElement).click();
    await el.updateComplete;

    expect(el.value).toBe('7');
    expect(el.selectedItem).toEqual(item);
    expect(input(el).value).toBe('Zenith Ltd');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ArrowDown then Enter commits the highlighted result', async () => {
    const items: PickerItem[] = [{ id: '1', label: 'One' }, { id: '2', label: 'Two' }];
    el = await mount(async () => items);

    await type(el, 'o');
    await vi.advanceTimersByTimeAsync(250);
    await el.updateComplete;

    input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(el.value).toBe('1');
  });

  it('a rejected search surfaces an error message instead of stale/empty results', async () => {
    const search = vi.fn(async (): Promise<PickerItem[]> => { throw new Error('network down'); });
    el = await mount(search);

    await type(el, 'x');
    await vi.advanceTimersByTimeAsync(250);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelectorAll('u-option').length).toBe(0);
    expect(el.shadowRoot!.querySelector('.no-results')?.textContent).toContain('Search failed');
    expect(el.value).toBeUndefined();
  });
});
