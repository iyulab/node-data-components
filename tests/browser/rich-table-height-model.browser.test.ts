import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * 높이 제약 하의 **세로 레이아웃 계약**.
 *
 * ## 왜 이 파일이 생겼는가
 *
 * 호스트에 높이를 주면 내용이 자연 높이 그대로 넘쳤고, `:host` 가 `overflow: hidden` 이라
 * **넘친 부분에 도달할 방법이 없었다.** 페이지네이션은 마지막 자식이므로 **가장 먼저 사라진다**
 * ⇒ *표는 그려지는데 2페이지로 갈 수 없었다.* 페이지네이션은 DOM 에 있었다 — 보이지도, 닿지도
 * 않았을 뿐이다.
 *
 * 소비자에게 남는 선택이 둘뿐이었고 **둘 다 그리드의 값을 깎았다**:
 * 높이를 주면 페이지 이동 불가, 주지 않으면 50행이 2,000px 문서가 되어 헤더가 스크롤 밖으로
 * 나가고 페이지를 넘기려면 매번 끝까지 내려야 한다.
 *
 * ⇒ 계약은 셋이다: **툴바 고정 · 행 영역만 스크롤 · 페이지네이션 고정**, 그리고 스크롤하는
 * 동안 **열 이름이 남는다**(헤더 sticky).
 *
 * ## 왜 브라우저인가
 *
 * 재는 것이 **레이아웃 계산값**이다 — 어느 요소가 호스트 상자 «안»에 있는지, 스크롤 컨테이너가
 * 실제로 스크롤되는지. jsdom 은 overflow 클리핑도 박스 크기도 계산하지 않으므로 여기서는
 * 원리적으로 답을 줄 수 없고, 소스 대조로 확인하면 *우리가 다시 구현한 규칙*을 스스로에게
 * 물어보는 셈이 된다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  updateComplete: Promise<boolean>;
};

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `R${i}`, name: `row ${i}` }));

let host: HTMLDivElement;

async function mount(height: string | null, rowCount = 50): Promise<Table> {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = COLUMNS;
  el.data = rows(rowCount);
  el.totalCount = 1000; // 페이지네이션이 실제로 그려지도록
  el.pageSize = rowCount;
  el.currentPage = 1;
  if (height) el.style.height = height;
  host.appendChild(el);
  await el.updateComplete;
  // 레이아웃이 확정된 뒤에 잰다.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return el;
}

const part = (el: Table, sel: string) => el.shadowRoot!.querySelector(sel) as HTMLElement | null;

describe('u-rich-table — 높이 제약 하의 세로 레이아웃', () => {
  beforeEach(() => {
    window.scrollTo(0, 0);
    host = document.createElement('div');
    document.body.appendChild(host);
  });
  afterEach(() => host.remove());

  it('🔴높이를 줘도 페이지네이션이 호스트 상자 «안»에 있다 — 이 결함의 본체', async () => {
    const el = await mount('300px');
    const pagination = part(el, '.pagination');
    expect(pagination, '페이지네이션이 그려져야 한다').not.toBeNull();

    const hostBox = el.getBoundingClientRect();
    const pgBox = pagination!.getBoundingClientRect();

    // 종전에는 pagination 이 host 밖(아래)에 있었고 overflow:hidden 이라 닿을 수 없었다.
    expect(pgBox.bottom).toBeLessThanOrEqual(hostBox.bottom + 1);
    expect(pgBox.height).toBeGreaterThan(0);
  });

  it('🔴툴바도 상자 안에 남는다 (위쪽 경계)', async () => {
    const el = await mount('300px');
    const toolbar = part(el, '.toolbar');
    if (!toolbar) return; // 툴바가 조건부라면 이 단언은 해당 없음
    const hostBox = el.getBoundingClientRect();
    expect(toolbar.getBoundingClientRect().top).toBeGreaterThanOrEqual(hostBox.top - 1);
  });

  it('🔴스크롤되는 것은 «행 영역»이다 — 호스트가 아니라', async () => {
    const el = await mount('300px');
    const wrap = part(el, '.table-wrap')!;
    expect(wrap, '스크롤 컨테이너가 있어야 한다').not.toBeNull();
    expect(wrap.scrollHeight).toBeGreaterThan(wrap.clientHeight);

    wrap.scrollTop = 100;
    expect(wrap.scrollTop).toBeGreaterThan(0);
  });

  it('🔴행 영역을 스크롤해도 열 이름이 남는다 (헤더 sticky)', async () => {
    const el = await mount('300px');
    const wrap = part(el, '.table-wrap')!;
    const th = el.shadowRoot!.querySelector('thead th') as HTMLElement;

    const before = th.getBoundingClientRect().top;
    wrap.scrollTop = 200;
    await new Promise((r) => requestAnimationFrame(r));
    const after = th.getBoundingClientRect().top;

    // sticky 가 아니면 스크롤한 만큼 위로 밀려 올라간다.
    expect(Math.abs(after - before)).toBeLessThan(4);
    expect(after).toBeGreaterThanOrEqual(wrap.getBoundingClientRect().top - 1);
  });

  it('NEGATIVE: 높이를 «주지 않으면» 종전대로 자연 높이다 (하위 호환)', async () => {
    const el = await mount(null, 30);
    const wrap = part(el, '.table-wrap')!;

    // 제약이 없으면 flex:1 1 auto 는 내용 높이를 따르고 스크롤바가 생기지 않는다.
    expect(wrap.scrollHeight - wrap.clientHeight).toBeLessThanOrEqual(1);
    // 그리고 호스트는 내용을 담을 만큼 커진다 — 잘리지 않는다.
    expect(el.getBoundingClientRect().height).toBeGreaterThan(200);
  });

  it('NEGATIVE: 높이를 주지 않아도 페이지네이션은 상자 안이다', async () => {
    const el = await mount(null, 30);
    const hostBox = el.getBoundingClientRect();
    const pgBox = part(el, '.pagination')!.getBoundingClientRect();
    expect(pgBox.bottom).toBeLessThanOrEqual(hostBox.bottom + 1);
  });
});
