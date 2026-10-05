import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * `u-simple-sheet` 열 너비 — **드래그 없이** 바꾸는 두 길.
 *
 * 머리 칸 끝의 5px 핸들은 드래그 전용이었다. 키보드로는 너비를 바꿀 수 없었고(SC 2.1.1), 포인터로도 끌기 외의 길이
 * 없었다(SC 2.5.7). ⇒ ⑴ `Alt+Shift+←/→` 가 선택이 걸친 열을 한 단계씩 넓히고 좁힌다 ⑵ 핸들 더블클릭이 그 열을 내용에
 * 맞춘다.
 *
 * ## 왜 브라우저인가
 *
 * 너비는 계산된 상자로만 확인된다 — 그리고 ⑵의 «내용 폭» 은 글자 배치가 있어야 잴 수 있다.
 */

type Sheet = HTMLElement & { data: string[][]; rows: number; cols: number; updateComplete: Promise<unknown> };

const mount = async (data: string[][]) => {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = 3;
  el.cols = 3;
  el.data = data;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

afterEach(() => document.body.replaceChildren());

const header = (el: Sheet, col: number) =>
  el.shadowRoot!.querySelector<HTMLElement>(`th.col-header:nth-child(${col + 2})`)!;
const width = (el: Sheet, col: number) => Math.round(header(el, col).getBoundingClientRect().width);
const cell = (el: Sheet, row: number, col: number) =>
  el.shadowRoot!.querySelector<HTMLElement>(`td.cell[data-row="${row}"][data-col="${col}"]`)!;

/** 셀을 사용자 경로로 눌러 선택하고 시트에 포커스를 둔다. */
const select = async (el: Sheet, row: number, col: number) => {
  const td = cell(el, row, col);
  td.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
  document.dispatchEvent(new MouseEvent('mouseup'));
  await el.updateComplete;
};

describe('u-simple-sheet 열 너비 — 드래그 없는 길', () => {
  it('🔴Alt+Shift+→ 가 활성 셀의 열을 넓히고 Alt+Shift+← 가 좁힌다 — 다른 열은 그대로', async () => {
    const el = await mount([['a', 'b', 'c']]);
    await select(el, 0, 1);
    const before = [width(el, 0), width(el, 1), width(el, 2)];

    await userEvent.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
    await el.updateComplete;
    expect(width(el, 1)).toBe(before[1] + 16);
    expect([width(el, 0), width(el, 2)]).toEqual([before[0], before[2]]);

    await userEvent.keyboard('{Alt>}{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}{/Alt}');
    await el.updateComplete;
    expect(width(el, 1)).toBe(before[1] - 16);
  });

  it('🔴선택이 여러 열에 걸치면 그 열들이 함께 바뀐다', async () => {
    const el = await mount([['a', 'b', 'c']]);
    await select(el, 0, 0);
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    const before = [width(el, 0), width(el, 1), width(el, 2)];
    await userEvent.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
    await el.updateComplete;
    expect([width(el, 0), width(el, 1), width(el, 2)]).toEqual([before[0] + 16, before[1] + 16, before[2]]);
  });

  it('NEGATIVE Alt+Shift 없이 누른 → 는 너비가 아니라 활성 셀을 옮긴다', async () => {
    const el = await mount([['a', 'b', 'c']]);
    await select(el, 0, 0);
    const before = width(el, 0);
    await userEvent.keyboard('{ArrowRight}');
    await el.updateComplete;
    expect(width(el, 0)).toBe(before);
    expect(cell(el, 0, 1).classList.contains('anchor')).toBe(true);
  });

  it('너비는 하한(30px) 아래로 내려가지 않는다', async () => {
    const el = await mount([['a']]);
    await select(el, 0, 0);
    for (let i = 0; i < 10; i++) await userEvent.keyboard('{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}');
    await el.updateComplete;
    expect(width(el, 0)).toBe(30);
  });

  it('🔴핸들 더블클릭이 그 열을 가장 넓은 값에 맞춘다 — 잘리던 값이 다 보인다', async () => {
    const long = 'A considerably longer value than the column';
    const el = await mount([['x', long], ['y', 'z']]);
    const td = cell(el, 0, 1);
    expect(td.scrollWidth, '픽스처 전제: 기본 너비에서 값이 잘린다').toBeGreaterThan(td.clientWidth);

    const handle = header(el, 1).querySelector<HTMLElement>('.resize-handle')!;
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(td.scrollWidth, '맞춘 뒤에는 잘리지 않는다').toBeLessThanOrEqual(td.clientWidth);
    expect(width(el, 0), '다른 열은 그대로').toBe(80);
  });

  it('NEGATIVE 짧은 값만 있는 열은 더블클릭으로 좁아진다 — 넓히기만 하는 것이 아니다', async () => {
    const el = await mount([['a', 'b']]);
    const before = width(el, 0);
    header(el, 0).querySelector<HTMLElement>('.resize-handle')!
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(width(el, 0)).toBeLessThan(before);
    expect(width(el, 0)).toBeGreaterThanOrEqual(30);
  });
});
