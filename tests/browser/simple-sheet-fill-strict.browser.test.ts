import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * `strict` 열은 옵션에 없는 값을 받지 않는다 — 직접 입력(커밋 거부)과 붙여넣기(그 셀만 건너뜀)가 이미 지킨다.
 * Ctrl+D / Ctrl+R 채우기도 같은 규칙을 지켜야 한다: 옵션이 **행마다 다르면**(`options(row, col)`) 윗 행에서 유효한 값이
 * 아랫 행에서는 유효하지 않을 수 있다. 실제 키 입력으로 재고, 결과는 공개 `getData()` 로 읽는다.
 */

type Sheet = HTMLElement & {
  data: string[][]; rows: number; cols: number; columns: unknown[]; updateComplete: Promise<unknown>;
  getData(): string[][];
};

const mount = async () => {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = 4;
  el.cols = 2;
  // 열 0 은 행마다 다른 옵션을 가진 strict 열: 짝수 행은 A/B, 홀수 행은 X/Y.
  el.columns = [
    { header: 'Kind', strict: true, options: (row: number) => (row % 2 === 0 ? ['A', 'B'] : ['X', 'Y']) },
    { header: 'Note' },
  ];
  el.data = [['A', 'n0'], ['X', 'n1'], ['', 'n2'], ['', 'n3']];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

afterEach(() => document.body.replaceChildren());

const cell = (el: Sheet, row: number, col: number) =>
  el.shadowRoot!.querySelector<HTMLElement>(`td.cell[data-row="${row}"][data-col="${col}"]`)!;

describe('u-simple-sheet 채우기는 strict 열의 규칙을 지킨다', () => {
  it('Ctrl+D 는 그 행에서 옵션에 없는 값은 채우지 않고 그 셀을 그대로 둔다', async () => {
    const el = await mount();
    await userEvent.click(cell(el, 0, 0));
    await el.updateComplete;
    // 0..3 행을 선택해 아래로 채운다: 'A' 는 짝수 행(2)에서만 유효하고 홀수 행(1,3)에서는 아니다.
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}');
    await el.updateComplete;
    const col0 = el.getData().map((r) => r[0]);
    expect(col0).toEqual(['A', 'X', 'A', '']);
  });
});
