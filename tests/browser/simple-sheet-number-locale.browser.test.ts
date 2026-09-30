import { describe, it, expect, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * 숫자 열의 `format`(Intl.NumberFormatOptions)은 앱 로케일을 따른다.
 * 결함: `Intl.NumberFormat('ko-KR', …)` 고정 — 문구는 `Locale` 을 따르는데 구분자만 한국식이었다.
 * 한국식과 구분자가 반대인 로케일(`de`)로 재야 보인다.
 */
type Sheet = HTMLElement & { data: string[][]; columns: unknown[]; updateComplete: Promise<unknown> };

afterEach(() => {
  Locale.set('en');
  document.body.innerHTML = '';
});

describe('USimpleSheet 숫자 포맷', () => {
  it('앱 로케일(de)의 구분자로 적는다', async () => {
    Locale.set('de');
    const sheet = document.createElement('u-simple-sheet') as Sheet;
    sheet.columns = [{ label: 'n', format: { minimumFractionDigits: 2 } }];
    sheet.data = [['1234.5']];
    document.body.appendChild(sheet);
    await sheet.updateComplete;
    expect(sheet.shadowRoot!.textContent).toContain('1.234,50');
  });
});
