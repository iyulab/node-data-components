import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * `u-simple-sheet` 키보드 계약 — 게시 문서(`docs/USimpleSheet.md` · 스킬 `simple-sheet.md`)의 키 표.
 *
 * ## 왜 이 파일이 생겼는가
 *
 * 문서의 키 표 대부분을 **아무 시험도 재지 않았다**(2026-10-06 감사 — 행 26개 중 시험 있는 것 7개). 그 사이 두 문서는
 * 소스와 갈라져 있었다: 둘 다 «`Enter` 가 편집을 시작한다» 고 적었는데 소스는 스프레드시트 관례대로 **아래로 옮긴다**
 * (편집은 `F2` 또는 글자 입력), 스킬은 `PageUp`/`PageDown` 을 «한 화면» 이라 적었는데 소스는 **10행**이다.
 * 형제 `u-rich-table` 도 같은 부류로, 문서가 약속한 이동이 한 번도 그대로 동작한 적이 없었다.
 *
 * ⇒ 키는 **실제 키 입력**(`userEvent.keyboard`)으로 누르고, 결과는 화면(활성 셀 표식 · 편집기)과 `data` 로 잰다 —
 * 비공개 `_startEdit` 를 부르지 않는다.
 */

type Sheet = HTMLElement & {
  data: string[][]; rows: number; cols: number; updateComplete: Promise<unknown>;
  /** 공개 읽기 경로 — `data` 는 입력이고 편집은 내부 사본에 쌓인다. */
  getData(): string[][];
};

const mount = async (rows = 20, cols = 4) => {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = rows;
  el.cols = cols;
  el.data = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => `r${r}c${c}`));
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

afterEach(() => document.body.replaceChildren());

const cell = (el: Sheet, row: number, col: number) =>
  el.shadowRoot!.querySelector<HTMLElement>(`td.cell[data-row="${row}"][data-col="${col}"]`)!;

/** 활성 셀(앵커)의 좌표. */
const active = (el: Sheet): [number, number] => {
  const td = el.shadowRoot!.querySelector<HTMLElement>('td.cell.anchor')!;
  return [Number(td.dataset.row), Number(td.dataset.col)];
};

const editor = (el: Sheet) => el.shadowRoot!.querySelector<HTMLInputElement>('td.cell input');

const press = async (el: Sheet, keys: string) => {
  await userEvent.keyboard(keys);
  await el.updateComplete;
};

const start = async (row: number, col: number) => {
  const el = await mount();
  await userEvent.click(cell(el, row, col));
  await el.updateComplete;
  return el;
};

describe('u-simple-sheet 키보드 — 이동', () => {
  it('화살표 넷이 활성 셀을 옮긴다', async () => {
    const el = await start(5, 1);
    await press(el, '{ArrowUp}');
    expect(active(el)).toEqual([4, 1]);
    await press(el, '{ArrowLeft}');
    expect(active(el)).toEqual([4, 0]);
    await press(el, '{ArrowDown}{ArrowRight}');
    expect(active(el)).toEqual([5, 1]);
  });

  it('🔴Enter 는 편집하지 않고 아래로 옮긴다 · Shift+Enter 는 위로', async () => {
    const el = await start(5, 1);
    await press(el, '{Enter}');
    expect(active(el)).toEqual([6, 1]);
    expect(editor(el), 'Enter 가 편집을 시작하지 않는다').toBeNull();
    await press(el, '{Shift>}{Enter}{/Shift}');
    expect(active(el)).toEqual([5, 1]);
  });

  it('Tab 은 오른쪽 · 마지막 열에서 다음 행 첫 열로 · Shift+Tab 은 그 반대', async () => {
    const el = await start(2, 3);
    await press(el, '{Tab}');
    expect(active(el)).toEqual([3, 0]);
    await press(el, '{Shift>}{Tab}{/Shift}');
    expect(active(el)).toEqual([2, 3]);
  });

  it('Home/End 는 행의 처음/끝 · Ctrl+Home/End 는 시트의 처음/끝', async () => {
    const el = await start(4, 2);
    await press(el, '{End}');
    expect(active(el)).toEqual([4, 3]);
    await press(el, '{Home}');
    expect(active(el)).toEqual([4, 0]);
    await press(el, '{Control>}{End}{/Control}');
    expect(active(el)).toEqual([19, 3]);
    await press(el, '{Control>}{Home}{/Control}');
    expect(active(el)).toEqual([0, 0]);
  });

  it('🔴PageDown/PageUp 은 10행씩', async () => {
    const el = await start(2, 1);
    await press(el, '{PageDown}');
    expect(active(el)).toEqual([12, 1]);
    await press(el, '{PageUp}');
    expect(active(el)).toEqual([2, 1]);
  });
});

describe('u-simple-sheet 키보드 — 편집', () => {
  it('F2 가 편집을 시작하고 Escape 가 값을 바꾸지 않고 취소한다', async () => {
    const el = await start(1, 1);
    await press(el, '{F2}');
    expect(editor(el)).not.toBeNull();
    await userEvent.keyboard('zzz');
    await press(el, '{Escape}');
    expect(editor(el)).toBeNull();
    expect(el.getData()[1][1]).toBe('r1c1');
  });

  it('🔴글자를 치면 편집이 시작되고 기존 값을 대체한다 · Enter 가 확정하고 아래로', async () => {
    const el = await start(1, 1);
    await userEvent.keyboard('new');
    await el.updateComplete;
    expect(editor(el)?.value).toBe('new');
    await press(el, '{Enter}');
    expect(el.getData()[1][1]).toBe('new');
    expect(active(el)).toEqual([2, 1]);
  });

  it('Ctrl+Enter 는 확정하고 그 셀에 남는다', async () => {
    const el = await start(1, 1);
    await press(el, '{F2}');
    await userEvent.keyboard('{Control>}a{/Control}x');
    await press(el, '{Control>}{Enter}{/Control}');
    expect(el.getData()[1][1]).toBe('x');
    expect(active(el)).toEqual([1, 1]);
  });

  it('Delete 가 선택을 비우고 Ctrl+Z 가 되돌리고 Ctrl+Y 가 다시 한다', async () => {
    const el = await start(1, 1);
    await press(el, '{Shift>}{ArrowRight}{/Shift}{Delete}');
    expect([el.getData()[1][1], el.getData()[1][2]]).toEqual(['', '']);
    await press(el, '{Control>}z{/Control}');
    expect([el.getData()[1][1], el.getData()[1][2]]).toEqual(['r1c1', 'r1c2']);
    await press(el, '{Control>}y{/Control}');
    expect([el.getData()[1][1], el.getData()[1][2]]).toEqual(['', '']);
  });

  it('Ctrl+D 는 선택의 첫 행을 아래로 채운다 · Ctrl+R 은 첫 열을 오른쪽으로', async () => {
    const el = await start(1, 1);
    await press(el, '{Shift>}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}');
    expect([el.getData()[2][1], el.getData()[3][1]]).toEqual(['r1c1', 'r1c1']);
    await userEvent.click(cell(el, 5, 0));
    await press(el, '{Shift>}{ArrowRight}{ArrowRight}{/Shift}{Control>}r{/Control}');
    expect([el.getData()[5][1], el.getData()[5][2]]).toEqual(['r5c0', 'r5c0']);
  });
});
