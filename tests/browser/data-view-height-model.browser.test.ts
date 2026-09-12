import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import '../../src/components/data-view/UDataView';

/**
 * 높이 제약 하의 **세로 레이아웃 계약** — 세 모드가 같아야 한다.
 *
 * ## 왜 이 파일이 생겼는가
 *
 * 고정 높이를 준 소비자에게 **모드에 따라 다른 결과**가 나왔다(실측 · 호스트 300px · 40건):
 * `table` 은 올바르게 스크롤(넘침 0)인데 **`grid` 는 2002px · `list` 는 2909px 가 호스트 밖으로 흘렀다.**
 * 호스트에 `overflow` 선언이 없어 잘리지도 않으므로, 카드가 뒤따르는 페이지 콘텐츠 위로 그대로 겹쳤다.
 *
 * ⚠**그리고 `grid` 는 기본 모드다** — 즉 기본 사용이 깨진 쪽이었다.
 *
 * 기전: 세 컨테이너의 `flex`(`0 1 auto`)와 `min-height`(`auto`)가 **전부 동일**했고 **계산된 `overflow`**
 * 하나로 갈렸다 — flex 아이템의 자동 최소 크기는 스크롤 컨테이너일 때만 0 으로 풀린다. `table` 이
 * 맞았던 것은 가로 스크롤용 `overflow-x: auto` 가 계산상 세로까지 `auto` 로 만든 **우연**이었다.
 *
 * ⇒ 계약: **툴바 고정 · 콘텐츠 영역만 스크롤 · 어느 모드에서도 호스트 상자를 넘지 않는다.**
 * 형제 `u-rich-table` 이 같은 계약을 갖고 같은 형태로 고정한다(`rich-table-height-model`).
 *
 * ## 왜 브라우저인가
 *
 * 재는 것이 레이아웃 계산값이다 — 어느 요소가 호스트 상자 «안»에 있는지, 스크롤 컨테이너가 실제로
 * 스크롤되는지. jsdom 은 박스도 overflow 도 계산하지 않아 원리적으로 답을 줄 수 없다.
 */

type View = HTMLElement & {
  items: Record<string, unknown>[];
  mode: 'grid' | 'list' | 'table';
  updateComplete: Promise<unknown>;
};

const MODES: View['mode'][] = ['grid', 'list', 'table'];

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: `item ${i}`, owner: `o${i}` }));

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

async function mount(height: string | null, mode: View['mode'], n = 40): Promise<View> {
  const el = document.createElement('u-data-view') as View;
  el.mode = mode;
  el.items = items(n);
  if (height) el.style.height = height;
  host.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return el;
}

/** 그 모드의 콘텐츠 컨테이너 — 모드마다 다른 요소다. */
const content = (el: View): HTMLElement => {
  const root = el.shadowRoot!;
  return (root.querySelector('.table-wrapper') ?? root.querySelector('.grid') ?? root.querySelector('.list')) as HTMLElement;
};

describe('u-data-view — 높이 제약 하의 세로 레이아웃(세 모드 공통)', () => {
  for (const mode of MODES) {
    it(`🔴[${mode}] 고정 높이를 줘도 콘텐츠가 호스트 상자 «안»에 있다 — 이 결함의 본체`, async () => {
      const el = await mount('300px', mode);
      const hostBox = el.getBoundingClientRect();
      expect(Math.round(hostBox.height)).toBe(300);
      const c = content(el);
      expect(c, '콘텐츠 컨테이너가 있어야 한다').not.toBeNull();
      expect(Math.round(c.getBoundingClientRect().bottom - hostBox.bottom), '콘텐츠가 호스트 밖으로 흘렀다').toBeLessThanOrEqual(1);
    });

    it(`🔴[${mode}] 스크롤되는 것은 «콘텐츠 영역»이다 — 호스트가 아니라`, async () => {
      const el = await mount('300px', mode);
      const c = content(el);
      expect(c.scrollHeight - c.clientHeight, '이 사례는 내용이 넘쳐야 의미가 있다').toBeGreaterThan(0);
      c.scrollTop = 100;
      expect(c.scrollTop).toBeGreaterThan(0);
    });

    it(`[${mode}] 툴바는 자리를 지킨다 — 콘텐츠를 스크롤해도 움직이지 않는다`, async () => {
      const el = await mount('300px', mode);
      const toolbar = el.shadowRoot!.querySelector('.toolbar') as HTMLElement;
      const before = toolbar.getBoundingClientRect().top;
      content(el).scrollTop = 200;
      await new Promise((r) => requestAnimationFrame(r));
      expect(Math.abs(toolbar.getBoundingClientRect().top - before)).toBeLessThan(1);
      expect(toolbar.getBoundingClientRect().top).toBeGreaterThanOrEqual(el.getBoundingClientRect().top - 1);
    });

    it(`NEGATIVE [${mode}] 높이를 «주지 않으면» 종전대로 자연 높이다 — 스크롤바를 만들지 않는다`, async () => {
      const el = await mount(null, mode, 8);
      const c = content(el);
      expect(c.scrollHeight - c.clientHeight, '제약이 없으면 넘치지 않는다').toBeLessThanOrEqual(1);
      expect(el.getBoundingClientRect().height, '호스트는 내용을 담을 만큼 커진다').toBeGreaterThan(100);
    });
  }
});
