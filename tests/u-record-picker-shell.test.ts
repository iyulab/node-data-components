// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import '../src/components/u-record-picker/URecordPicker';

describe('URecordPicker — shell', () => {
  it('registers as u-record-picker and renders without a value', async () => {
    const el = document.createElement('u-record-picker') as HTMLElement & {
      search: (q: string) => Promise<unknown[]>;
      selectedItem: unknown;
      value?: string;
    };
    el.search = async () => [];
    document.body.appendChild(el);
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    expect(el.shadowRoot?.querySelector('input.main-input')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('u-dialog')).toBeTruthy();
    expect(el.selectedItem).toBeNull();
    expect(el.value).toBeUndefined();

    el.remove();
  });
});
