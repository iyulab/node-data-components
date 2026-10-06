import { describe, it, expect, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-rich-table/URichTable';

/**
 * 런타임 로캘 전환 — 표는 `LitElement` 를 직접 잇기에 `@iyulab/components` 의 `UElement` 구독을 받지 못한다. 스스로 구독해,
 * 이미 그려진 문장(머리 줄 · 편집 칸의 검증 오류)을 새 언어로 다시 그린다. 검증 오류는 «그릴 때 찾는» 문장이다.
 */
type Table = HTMLElement & {
  columns: { key: string; label: string; editable?: boolean; required?: boolean }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
};
let table: Table;
afterEach(() => { table?.remove(); Locale.set('en'); });

const settle = async () => { await table.updateComplete; await new Promise((r) => setTimeout(r, 50)); };

describe('URichTable — 런타임 로캘 전환', () => {
  it('편집 칸의 «필수» 검증 오류가 새 언어로 다시 그려진다', async () => {
    Locale.set('en');
    table = document.createElement('u-rich-table') as Table;
    table.columns = [{ key: 'n', label: 'Name', editable: true, required: true }];
    table.data = [{ _id: 'r0', n: 'Ann' }];
    document.body.appendChild(table);
    await settle();
    const cell = table.shadowRoot!.querySelector('tbody tr td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    await settle();
    const input = table.shadowRoot!.querySelector<HTMLInputElement>('input.cell-edit-input')!;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await settle();
    const error = () => table.shadowRoot!.querySelector('.validation-error')?.textContent?.trim();
    expect(error()).toBe(Locale.getValue('valueMissing'));
    const en = error();

    Locale.set('ko');
    await settle();
    expect(error()).toBe(Locale.getValue('valueMissing'));
    expect(error()).not.toBe(en);
  });

  it('떨어져 있던 동안의 전환을 다시 붙을 때 따라간다', async () => {
    Locale.set('en');
    table = document.createElement('u-rich-table') as Table;
    table.columns = [{ key: 'n', label: 'Name' }];
    table.data = [];
    document.body.appendChild(table);
    await settle();
    const before = table.shadowRoot!.textContent;
    table.remove();
    Locale.set('ko');
    document.body.appendChild(table);
    await settle();
    expect(table.shadowRoot!.textContent).not.toBe(before);
  });
});
