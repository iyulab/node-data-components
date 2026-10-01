import { describe, it, expect, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * 숫자 열의 `format`(Intl.NumberFormatOptions)은 앱 로케일을 따른다.
 * 결함: `Intl.NumberFormat('ko-KR', …)` 고정 — 문구는 `Locale` 을 따르는데 구분자만 한국식이었다.
 * 한국식과 구분자가 반대인 로케일(`de`)로 재야 보인다.
 */
type Sheet = HTMLElement & { data: string[][]; columns: unknown[]; updateComplete: Promise<unknown>; getNumbers(): (number | null)[][] };

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

  it('🔴소수 쉼표를 묶음으로 읽지 않는다 — de 화면의 1,5 는 1,50 이지 15,00 이 아니다', async () => {
    Locale.set('de');
    const sheet = document.createElement('u-simple-sheet') as Sheet;
    sheet.columns = [{ label: 'n', format: { minimumFractionDigits: 2 } }];
    sheet.data = [['1,5'], ['1.234,5']];
    document.body.appendChild(sheet);
    await sheet.updateComplete;
    const text = sheet.shadowRoot!.textContent!;
    expect(text).toContain('1,50');
    expect(text).toContain('1.234,50');
    expect(text).not.toContain('15,00');
  });

  it('숫자 셀 표시(cell-numeric)도 같은 규칙 — 수가 아닌 글자는 숫자로 세지 않는다', async () => {
    Locale.set('de');
    const sheet = document.createElement('u-simple-sheet') as Sheet;
    sheet.data = [['1,5', '1,23,4', 'abc']];
    document.body.appendChild(sheet);
    await sheet.updateComplete;
    const cells = Array.from(sheet.shadowRoot!.querySelectorAll('.cell')).filter(c => /1,5|1,23,4|abc/.test(c.textContent ?? ''));
    expect(cells.map(c => c.classList.contains('cell-numeric'))).toEqual([true, false, false]);
  });

  it('getNumbers() — 로케일로 읽은 수, 빈 칸·수가 아닌 칸은 null (부분 숫자 없음)', async () => {
    Locale.set('de');
    const sheet = document.createElement('u-simple-sheet') as Sheet;
    sheet.data = [['10,5', '11.5', ''], ['1.234,5', '1,5x', '-0,25']];
    document.body.appendChild(sheet);
    await sheet.updateComplete;
    expect(sheet.getNumbers().slice(0, 2).map(r => r.slice(0, 3))).toEqual([[10.5, 11.5, null], [1234.5, null, -0.25]]);
  });

  it('영어 화면에서는 1,234 가 천이다(점-소수 로케일의 세 자리 규칙)', async () => {
    Locale.set('en');
    const sheet = document.createElement('u-simple-sheet') as Sheet;
    sheet.data = [['1,234', '1,5']];
    document.body.appendChild(sheet);
    await sheet.updateComplete;
    expect(sheet.getNumbers()[0].slice(0, 2)).toEqual([1234, 1.5]);
  });
});
