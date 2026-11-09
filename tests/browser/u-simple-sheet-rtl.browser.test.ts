import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/simple-sheet/USimpleSheet';
import type { USimpleSheet } from '../../src/components/simple-sheet/USimpleSheet';

/**
 * `u-simple-sheet` 는 `dir="rtl"` 에서 **거울**이 된다(표 · 시트 격자는 방향을 따른다). 열은 오른쪽부터
 * 흐르고, 행 번호 열 · 모서리는 읽는 방향의 시작(오른쪽)에 고정되며, 가로 방향키 · 열 너비 키 · 너비 끌기는 화면을 따른다.
 * 오라클은 «시작 가장자리» 기준이라 방향 없이 같은 단언을 한다(LTR 은 왼쪽 · RTL 은 오른쪽). CSS 만 거울이고 JS 좌표가
 * 물리면 «고정 열은 오른쪽 · 방향키는 물리» 인 반쪽이 된다 — 아래 셋이 그 반쪽을 따로 잡는다.
 */

let sheet: USimpleSheet;
afterEach(() => { sheet?.remove(); document.documentElement.dir = 'ltr'; });

async function mount(dir: 'ltr' | 'rtl', cols = 4): Promise<USimpleSheet> {
  document.documentElement.dir = dir;
  sheet = document.createElement('u-simple-sheet') as USimpleSheet;
  sheet.style.display = 'block';
  sheet.style.width = '360px';
  sheet.style.height = '240px';
  sheet.rows = 3;
  sheet.cols = cols;
  document.body.appendChild(sheet);
  await sheet.updateComplete;
  await new Promise((r) => setTimeout(r, 80));
  return sheet;
}

const $ = <T extends Element>(el: USimpleSheet, sel: string) => el.shadowRoot!.querySelector(sel) as T;
const $$ = <T extends Element>(el: USimpleSheet, sel: string) => [...el.shadowRoot!.querySelectorAll(sel)] as T[];
const startEdge = (r: DOMRect, dir: 'ltr' | 'rtl') => (dir === 'ltr' ? r.left : r.right);

describe.each(['ltr', 'rtl'] as const)('RTL — u-simple-sheet (%s)', (dir) => {
  it('행 번호 열은 읽는 방향의 시작에, 첫 열은 그 다음에 놓인다', async () => {
    const el = await mount(dir);
    const rowNum = $<HTMLElement>(el, 'td.row-num').getBoundingClientRect();
    const first = $$<HTMLElement>(el, 'td.cell')[0].getBoundingClientRect();
    const second = $$<HTMLElement>(el, 'td.cell')[1].getBoundingClientRect();
    if (dir === 'ltr') {
      expect(first.left).toBeGreaterThanOrEqual(rowNum.right - 1);
      expect(second.left).toBeGreaterThan(first.left);
    } else {
      expect(first.right).toBeLessThanOrEqual(rowNum.left + 1);
      expect(second.right).toBeLessThan(first.right);
    }
  });

  it('가로로 끝까지 스크롤해도 행 번호 열은 시작 가장자리에 붙어 있다(고정 열)', async () => {
    const el = await mount(dir, 14);
    const scroller = $<HTMLElement>(el, '.sheet-scroll');
    scroller.scrollLeft = dir === 'ltr' ? 100000 : -100000;
    await new Promise((r) => setTimeout(r, 120));
    expect(Math.abs(scroller.scrollLeft), '스크롤이 실제로 일어났다').toBeGreaterThan(50);
    const S = scroller.getBoundingClientRect();
    const R = $<HTMLElement>(el, 'td.row-num').getBoundingClientRect();
    expect(Math.abs(startEdge(R, dir) - startEdge(S, dir)), `${dir}: 행 번호 ${startEdge(R, dir)} · 스크롤 영역 ${startEdge(S, dir)}`).toBeLessThan(3);
  });

  it('화면의 «다음 열» 방향키가 다음 열로 간다(LTR 오른쪽 · RTL 왼쪽)', async () => {
    const el = await mount(dir);
    await userEvent.click($$<HTMLElement>(el, 'td.cell')[0]);
    const nextKey = dir === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}';
    await userEvent.keyboard(nextKey);
    await el.updateComplete;
    expect($<HTMLElement>(el, '.sheet-container').getAttribute('aria-activedescendant')).toBe('sheet-cell-0-1');
    const prevKey = dir === 'ltr' ? '{ArrowLeft}' : '{ArrowRight}';
    await userEvent.keyboard(prevKey);
    await el.updateComplete;
    expect($<HTMLElement>(el, '.sheet-container').getAttribute('aria-activedescendant')).toBe('sheet-cell-0-0');
  });

  it('Alt+Shift+화면 바깥쪽 화살표는 열을 넓힌다(LTR 오른쪽 · RTL 왼쪽)', async () => {
    const el = await mount(dir);
    await userEvent.click($$<HTMLElement>(el, 'td.cell')[0]);
    const before = $<HTMLElement>(el, 'th.col-header').getBoundingClientRect().width;
    const widen = dir === 'ltr' ? 'ArrowRight' : 'ArrowLeft';
    await userEvent.keyboard(`{Alt>}{Shift>}{${widen}}{/Shift}{/Alt}`);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    const after = $<HTMLElement>(el, 'th.col-header').getBoundingClientRect().width;
    expect(after, `${dir}: 너비 ${before} → ${after}`).toBeGreaterThan(before);
  });

  it('너비 손잡이를 끝 가장자리 쪽으로 끌면 열이 넓어진다(LTR 오른쪽 · RTL 왼쪽)', async () => {
    const el = await mount(dir);
    const th = $<HTMLElement>(el, 'th.col-header');
    const before = th.getBoundingClientRect().width;
    const handle = $<HTMLElement>(el, '.resize-handle');
    // 손잡이는 머리 칸의 끝 가장자리에 있다.
    const H = handle.getBoundingClientRect();
    const T = th.getBoundingClientRect();
    expect(Math.abs(startEdge(H, dir === 'ltr' ? 'rtl' : 'ltr') - startEdge(T, dir === 'ltr' ? 'rtl' : 'ltr')), `${dir}: 손잡이가 칸의 끝 가장자리에 있다`).toBeLessThan(6);
    const x0 = (H.left + H.right) / 2;
    const outward = dir === 'ltr' ? 30 : -30;
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, clientX: x0, button: 0 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x0 + outward }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x0 + outward }));
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    const after = $<HTMLElement>(el, 'th.col-header').getBoundingClientRect().width;
    expect(after - before, `${dir}: 너비 ${before} → ${after}`).toBeGreaterThan(20);
  });
});
