import { describe, it, expect, afterEach, vi } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * 열 `format` 은 표 · 위젯과 같은 숫자 서식 어휘를 받는다 — 서식 코드 또는 `Intl` 옵션(components `applyNumberFormat`).
 * 섹션 색은 테마 상태 색(톤)으로 칠한다. 셀 글자는 앱 로케일로 읽는다.
 */
type Sheet = HTMLElement & { data: string[][]; columns: unknown[]; updateComplete: Promise<unknown> };

async function mount(columns: unknown[], data: string[][]): Promise<Sheet> {
  const sheet = document.createElement('u-simple-sheet') as Sheet;
  sheet.columns = columns;
  sheet.data = data;
  document.body.appendChild(sheet);
  await sheet.updateComplete;
  return sheet;
}

afterEach(() => {
  Locale.set('en');
  document.body.innerHTML = '';
});

describe('USimpleSheet — number format codes', () => {
  it('formats a column with a spreadsheet code, in the app locale', async () => {
    Locale.set('de');
    const sheet = await mount([{ label: 'amt', format: '#,##0.00" €"' }], [['1234,5']]);
    expect(sheet.shadowRoot!.textContent).toContain('1.234,50 €');
  });

  it('paints a negative section color as the theme danger tone', async () => {
    const sheet = await mount([{ label: 'amt', format: '#,##0;[Red](#,##0)' }], [['-1234'], ['1234']]);
    const tone = sheet.shadowRoot!.querySelector('.format-tone[data-tone="danger"]') as HTMLElement;
    expect(tone.textContent).toBe('(1,234)');
    expect(getComputedStyle(tone).color).not.toBe(getComputedStyle(tone.parentElement!).color);
    expect(sheet.shadowRoot!.querySelectorAll('.format-tone')).toHaveLength(1);
  });

  it('uses the text section for a non-numeric cell and keeps a plain one as is', async () => {
    const sheet = await mount([{ label: 'a', format: '#,##0;-#,##0;0;"["@"]"' }, { label: 'b', format: '#,##0' }], [['n/a', 'n/a']]);
    const text = sheet.shadowRoot!.textContent!;
    expect(text).toContain('[n/a]');
  });

  it('options never write a signed zero', async () => {
    const sheet = await mount([{ label: 'n', format: { maximumFractionDigits: 2 } }], [['-0.0001']]);
    const cell = Array.from(sheet.shadowRoot!.querySelectorAll('.cell')).find((c) => /^\s*-?0\s*$/.test(c.textContent ?? ''));
    expect(cell?.textContent?.trim()).toBe('0');
  });

  it('shows an unsupported code unformatted and says so once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sheet = await mount([{ label: 'n', format: '0.00E+00' }], [['5'], ['6']]);
    expect(sheet.shadowRoot!.textContent).toContain('5');
    expect(warn.mock.calls.filter((c) => String(c[0]).startsWith('[@iyulab/data-components] number format'))).toHaveLength(1);
    warn.mockRestore();
  });
});
