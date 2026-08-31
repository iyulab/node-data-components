// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { USimpleSheet, type SheetColumn } from '../src/components/simple-sheet/USimpleSheet.js';

/**
 * docket #161 — compute/readonly가 열 전체 단위로만 동작해, "항목/값" 2열 시트에서
 * 값 열 안에 원천 입력 행과 자동계산 행이 섞인 레이아웃(회계·예산 시뮬레이션류)을
 * 표현할 수 없던 결함의 회귀 테스트.
 *
 * `compute`가 `undefined`를 반환한 행은 계산 대상이 아니라는 뜻으로, 사용자 입력이
 * 그대로 유지된다. `readonly`도 `(rowIndex) => boolean` 콜백을 받아 행 단위로 지정할
 * 수 있다.
 */

function cell(el: USimpleSheet, r: number, c: number): HTMLElement {
  return el.shadowRoot!.querySelector(`td[data-row="${r}"][data-col="${c}"]`) as HTMLElement;
}

describe('USimpleSheet 행 단위 compute/readonly (docket #161)', () => {
  let sheet: USimpleSheet | undefined;

  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
  });

  it('compute가 undefined를 반환한 행은 입력 그대로 유지되고 readonly로 표시되지 않는다', async () => {
    const columns: SheetColumn[] = [
      { key: 'label' },
      {
        key: 'value',
        // 2행(합계)만 계산 대상 — 나머지 행은 사용자 입력
        compute: (r, data) => r === 2 ? String(Number(data[0][1] || 0) + Number(data[1][1] || 0)) : undefined,
      },
    ];
    const el = sheet = new USimpleSheet();
    el.columns = columns;
    el.data = [
      ['총지출', '100'],
      ['가정수', '20'],
      ['합계', ''],
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    // 계산 행: 자동 계산값이 채워지고 readonly/computed 표시
    expect(el.getData()[2][1]).toBe('120');
    expect(cell(el, 2, 1).className).toContain('cell-readonly');
    expect(cell(el, 2, 1).className).toContain('cell-computed');

    // 입력 행: 사용자 값이 그대로 남고 readonly/computed 표시가 없다
    expect(el.getData()[0][1]).toBe('100');
    expect(cell(el, 0, 1).className).not.toContain('cell-readonly');
    expect(cell(el, 0, 1).className).not.toContain('cell-computed');
  });

  it('readonly 콜백으로 특정 행만 읽기 전용으로 지정할 수 있다', async () => {
    const columns: SheetColumn[] = [
      { key: 'label' },
      { key: 'value', readonly: (r) => r === 0 },
    ];
    const el = sheet = new USimpleSheet();
    el.columns = columns;
    el.data = [['헤더', '고정값'], ['항목', '편집가능']];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(cell(el, 0, 1).className).toContain('cell-readonly');
    expect(cell(el, 1, 1).className).not.toContain('cell-readonly');
  });

  it('Ctrl+D로 계산 행 아래로 채워도 계산 행은 덮어써지지 않는다', async () => {
    const columns: SheetColumn[] = [
      { compute: (r) => r === 1 ? 'computed' : undefined },
    ];
    const el = sheet = new USimpleSheet();
    el.columns = columns;
    el.data = [['seed'], ['']];
    document.body.appendChild(el);
    await el.updateComplete;

    const container = el.shadowRoot!.querySelector('.sheet-container') as HTMLElement;
    container.dispatchEvent(new FocusEvent('focus'));
    await el.updateComplete;
    container.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', shiftKey: true, bubbles: true,
    }));
    await el.updateComplete;
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true }));
    await el.updateComplete;

    // fill-down이 시도돼도 1행은 compute가 소유 — 여전히 'computed'
    expect(el.getData()[1][0]).toBe('computed');
  });
});
