import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * **열 폭 계약**(cycle-573).
 *
 * ## 왜 이 파일이 생겼는가
 *
 * 🔴`ColumnDef.width` 를 모든 열에 줘도 **지켜지지 않았다.** 폭은 `<th>` 의 인라인 style 로만
 * 들어가고 표는 `width: 100%` + 기본 `table-layout: auto` 였다 — 그 모드에서 열 폭은 *모든 행의
 * 내용*이 함께 정하므로 선언값은 힌트로 강등된다. 그리고 이 컴포넌트의 `<td>` 안에는 필터 행의
 * `<input>`/`<select>`(둘 다 `width: 100%`)와 새 행의 `<input>` 이 함께 들어가 그 경쟁에 참여한다.
 *
 * 실측(600px 컨테이너 · 17열 · 각 `120px`): 열이 **59px** 로 눌렸다 — 선언의 **절반 이하**다.
 * 가로 스크롤은 그때도 있었다. ⇒ ***결함은 «스크롤이 없다» 가 아니라 «선언한 폭이 무시된다» 다.***
 *
 * ## 계약
 *
 * **모든 열이 절대 길이(`px`·`rem` 등)로 폭을 선언했을 때만** `table-layout: fixed` 로 전환한다.
 * 그러면 선언값이 그대로 열 폭이 되고(측정: `120px` → **120**, `8rem` → **128**), 합이 컨테이너를
 * 넘으면 행 영역이 가로로 스크롤한다.
 *
 * ⚠**게이트가 필수다 — 느슨하게 할 수 없다.** `fixed` 는 폭이 없는 열을 **0 으로 만든다**:
 * 17열 중 8열만 선언한 표에서 나머지 **8열이 폭 0 으로 사라졌다**(실측). `%` 도 제외한다 —
 * 퍼센트는 컨테이너 기준이라 "합이 넘친다"가 성립하지 않아 `fixed` 에서 표가 오히려 599px 로
 * 갇힌다(실측). 그래서 게이트는 «전 열 · 절대 길이»다.
 *
 * ⚠**`box-sizing: border-box` 가 함께 필요하다.** `fixed` 만 켜면 `th{padding:8px}` 두 쪽이
 * 더해져 `120px` 선언이 **136px** 로 렌더된다 — «선언한 폭을 지킨다» 가 거짓이 된다.
 *
 * ## 왜 브라우저인가
 *
 * 재는 것이 **열 폭 배분의 결과**다. jsdom 은 레이아웃을 계산하지 않아 `getBoundingClientRect()`
 * 가 전부 0 이고, 소스 대조로는 *우리가 다시 구현한 규칙*을 스스로에게 물어보는 셈이 된다.
 */

type Table = HTMLElement & {
  columns: unknown[];
  data: Record<string, unknown>[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  updateComplete: Promise<boolean>;
};

let host: HTMLDivElement;
beforeEach(() => {
  window.scrollTo(0, 0);
  host = document.createElement('div');
  host.style.width = '600px';
  document.body.appendChild(host);
});
afterEach(() => {
  host.remove();
  document.body.replaceChildren();
});

type Unit = 'px' | 'rem' | 'pct' | 'partial' | 'none';

const COLS = (n: number, unit: Unit) =>
  Array.from({ length: n }, (_, i) => {
    const c: Record<string, unknown> = { key: 'k' + i, label: 'Column' + i };
    if (unit === 'px') c.width = '120px';
    else if (unit === 'rem') c.width = '8rem';
    else if (unit === 'pct') c.width = '10%';
    else if (unit === 'partial' && i % 2 === 0) c.width = '120px';
    return c;
  });

const ROWS = (n: number, cols: number) =>
  Array.from({ length: n }, (_, r) => {
    const o: Record<string, unknown> = { _id: 'r' + r };
    for (let i = 0; i < cols; i++) o['k' + i] = '300000';
    return o;
  });

async function mount(colCount: number, unit: Unit): Promise<Table> {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = COLS(colCount, unit) as unknown[];
  el.data = ROWS(5, colCount);
  el.totalCount = 100;
  el.pageSize = 5;
  el.currentPage = 1;
  host.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return el;
}

/** 데이터 열의 `<th>` 폭들(마지막 actions 열 제외). */
const thWidths = (el: Table) =>
  ([...el.shadowRoot!.querySelectorAll('thead th')] as HTMLElement[])
    .slice(0, -1)
    .map((e) => Math.round(e.getBoundingClientRect().width));

const wrap = (el: Table) => el.shadowRoot!.querySelector('.table-wrap') as HTMLElement;

describe('u-rich-table — 열 폭', () => {
  it('🔴전 열을 px 로 선언하면 그 폭이 지켜진다', async () => {
    const el = await mount(17, 'px');
    // 선행 단언 — 선언 합이 컨테이너를 넘지 않으면 이 측정은 공허하다.
    expect(17 * 120, '선언 합이 컨테이너(600)를 넘어야 의미가 있다').toBeGreaterThan(600);

    const ws = thWidths(el);
    expect(Math.min(...ws), '선언값보다 좁아지지 않는다').toBeGreaterThanOrEqual(119);
    expect(Math.max(...ws), '선언값보다 넓어지지도 않는다').toBeLessThanOrEqual(121);
  });

  it('🔴rem 선언도 같다', async () => {
    const el = await mount(17, 'rem');
    const ws = thWidths(el);
    expect(Math.min(...ws)).toBeGreaterThanOrEqual(127);
    expect(Math.max(...ws)).toBeLessThanOrEqual(129);
  });

  it('🔴넘치면 행 영역이 가로로 스크롤한다 — 잘리지 않는다', async () => {
    const el = await mount(17, 'px');
    const w = wrap(el);
    expect(w.scrollWidth).toBeGreaterThan(w.clientWidth);
    w.scrollLeft = 200;
    expect(w.scrollLeft, '실제로 스크롤된다').toBeGreaterThan(0);
  });

  it('NEGATIVE: 일부 열만 선언하면 종전 동작이다 — 폭 0 인 열이 생기지 않는다', async () => {
    const el = await mount(17, 'partial');
    const ws = thWidths(el);
    expect(ws.filter((x) => x <= 1).length, '사라진 열이 없어야 한다').toBe(0);
  });

  it('NEGATIVE: 퍼센트 선언은 종전 동작이다 — 컨테이너에 갇히지 않는다', async () => {
    const el = await mount(17, 'pct');
    const ws = thWidths(el);
    expect(ws.filter((x) => x <= 1).length).toBe(0);
    // fixed 로 전환하면 표가 599 로 갇혀 가로 스크롤이 사라진다 — 그러지 않아야 한다.
    const w = wrap(el);
    expect(w.scrollWidth).toBeGreaterThan(w.clientWidth);
  });

  it('NEGATIVE: 아무도 선언하지 않으면 종전대로 컨테이너에 맞춘다', async () => {
    const el = await mount(6, 'none');
    const w = wrap(el);
    expect(w.scrollWidth - w.clientWidth, '가로 스크롤이 생기지 않는다').toBeLessThanOrEqual(1);
  });

  it('NEGATIVE: 선언 합이 컨테이너보다 작으면 남는 폭을 나눠 갖는다', async () => {
    const el = await mount(3, 'px');
    const w = wrap(el);
    expect(w.scrollWidth - w.clientWidth).toBeLessThanOrEqual(1);
    expect(Math.min(...thWidths(el)), '좁은 표는 선언값보다 넓어진다').toBeGreaterThan(120);
  });
});
