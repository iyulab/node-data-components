// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { USimpleSheet } from '../src/components/simple-sheet/USimpleSheet.js';

/**
 * 행 번호·열 머리·모서리는 포인터로만 눌려 «행/열/전체 선택» 이 키보드로 닿지 않았다(타깃 크기 게이트의 포인터 고아 검사가
 * 지목). 스프레드시트 관례 키로 등가를 준다 — Shift+Space(행) · Ctrl+Space(열) · Ctrl+A(전체, 기존). 셀 후보 목록은
 * 입력에서 ↑↓ 로 고르므로 콤보박스·리스트박스 역할로 그 관계를 드러낸다.
 */
describe('USimpleSheet — 행/열 선택 키보드 등가 · 후보 목록 역할', () => {
  let sheet: USimpleSheet | undefined;

  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
  });

  const mount = async (): Promise<USimpleSheet> => {
    const el = sheet = new USimpleSheet();
    el.rows = 3;
    el.cols = 3;
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  };

  const press = async (el: USimpleSheet, init: KeyboardEventInit) => {
    const container = el.shadowRoot!.querySelector<HTMLElement>('[tabindex="0"]')!;
    container.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, cancelable: true, ...init }));
    await el.updateComplete;
  };

  const selectedRows = (el: USimpleSheet) =>
    [...el.shadowRoot!.querySelectorAll('td.row-num')].map((td) => td.classList.contains('row-selected'));
  const selectedCols = (el: USimpleSheet) =>
    [...el.shadowRoot!.querySelectorAll('th.col-header')].map((th) => th.classList.contains('col-selected'));

  it('Shift+Space 는 현재 행 전체를 선택하고 편집을 시작하지 않는다', async () => {
    const el = await mount();
    await press(el, { key: 'ArrowDown' });
    await press(el, { key: ' ', shiftKey: true });
    expect(selectedRows(el)).toEqual([false, true, false]);
    expect(selectedCols(el)).toEqual([true, true, true]);
    expect(el.shadowRoot!.querySelector('.cell-input')).toBeNull();
  });

  it('Ctrl+Space 는 현재 열 전체를 선택한다', async () => {
    const el = await mount();
    await press(el, { key: 'ArrowRight' });
    await press(el, { key: ' ', ctrlKey: true });
    expect(selectedCols(el)).toEqual([false, true, false]);
    expect(selectedRows(el)).toEqual([true, true, true]);
  });

  it('후보 목록은 listbox/option 이고 입력은 강조된 후보를 가리키는 combobox 다', async () => {
    const el = sheet = new USimpleSheet();
    el.columns = [{ options: ['Apple', 'Apricot', 'Banana'] }];
    el.rows = 1;
    document.body.appendChild(el);
    await el.updateComplete;

    await press(el, { key: 'A' });
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-input')!;
    expect(input).toBeTruthy();
    const listbox = el.shadowRoot!.querySelector('.cell-dropdown')!;
    expect(listbox.getAttribute('role')).toBe('listbox');
    const options = [...listbox.querySelectorAll('.dropdown-item')];
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.getAttribute('role') === 'option')).toBe(true);
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    const active = input.getAttribute('aria-activedescendant');
    expect(active && el.shadowRoot!.getElementById(active)?.getAttribute('aria-selected')).toBe('true');
  });
});
