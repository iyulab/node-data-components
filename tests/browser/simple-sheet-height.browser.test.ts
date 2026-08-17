import { describe, it, beforeAll, afterEach, expect } from 'vitest';
import lightCss from '@iyulab/components/styles/light.css?raw';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * `USimpleSheet` 호스트 높이 조절점(`--dc-sheet-height`)이 **효력을 갖는가**.
 *
 * ## 왜 브라우저인가
 *
 * `simple-sheet-density.browser.test.ts` 와 같은 이유다 — 소스 대조는
 * `height: var(--dc-sheet-height)` 가 적혀 있음만 증명하고, 문서 스코프 요소 선택자가
 * 섀도의 `:host` 기본값을 실제로 이기는지는 계산값으로만 갈린다.
 *
 * ## 재현 대상
 *
 * `ISSUE-data-components-20260811-simple-sheet-fixed-height.md`(소비앱 `online-tools`) —
 * `<u-simple-sheet rows="15">` 와 `rows="5">` 가 rows 값과 무관하게 똘같이 400px 로
 * 렌더됐고, 소비자가 높이를 조정할 정식 수단이 없었다.
 *
 * ⚠**이 토큰은 "자연 높이로 줄어든다"를 열지 않는다 — 의도적으로.** rows 는 데이터
 * 격자의 최소 용량이지 표시 개수가 아니라서, 자연 높이 옵트인은 별도 설계가 필요하다
 * (`TRIAGE-data-components-20260817-simple-sheet-fixed-height.md` §착상 검토 참조).
 * 여기서 여는 것은 "소비자가 상한을 명시할 수 있다"뿐이고, 아래 마지막 테스트가
 * 정확히 그 경계를 고정한다.
 */

const DATA = [['a', 'b', 'c'], ['d', 'e', 'f']];

let override: HTMLStyleElement | null = null;

/** 소비자가 실제로 쓰는 형태 — 문서 스코프 + 요소 선택자. */
const declare = (decls: string) => {
  override = document.createElement('style');
  override.textContent = `u-simple-sheet { ${decls} }`;
  document.head.appendChild(override);
};

type Sheet = HTMLElement & { data: string[][]; rows: number; cols: number; updateComplete: Promise<unknown> };

const mount = async (rows = 3) => {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = rows;
  el.cols = 3;
  el.data = DATA;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

beforeAll(() => {
  const s = document.createElement('style');
  s.textContent = lightCss;
  document.head.appendChild(s);
});

afterEach(() => {
  override?.remove();
  override = null;
  document.body.replaceChildren();
});

describe('USimpleSheet 호스트 높이 조절점', () => {
  it('선언하지 않으면 종전 값(400px)과 바이트 단위로 동일하다', async () => {
    const el = await mount();
    expect(el.getBoundingClientRect().height).toBe(400);
  });

  it('문서 스코프 요소 선택자로 --dc-sheet-height 를 선언하면 호스트 높이가 이동한다', async () => {
    declare('--dc-sheet-height: 220px;');
    const el = await mount();
    expect(el.getBoundingClientRect().height).toBe(220);
  });

  it(':root 선언은 닿지 않는다 — 다른 다섯 조절점과 같은 제약', async () => {
    override = document.createElement('style');
    override.textContent = ':root { --dc-sheet-height: 220px; }';
    document.head.appendChild(override);
    const el = await mount();
    expect(el.getBoundingClientRect().height).toBe(400);
  });

  it('🔴재현 확인 — rows 를 낮춰도 (토큰 없이는) 높이가 줄지 않는다', async () => {
    // 원 이슈의 재현 그대로: rows=15 든 rows=5 든 400px. 이 테스트는 «고쳐야 할 결함»이
    // 아니라 «이 릴리스가 건드리지 않는 경계»를 고정한다 — 자연 높이 축소는 별도 스코프다.
    const wide = await mount(15);
    expect(wide.getBoundingClientRect().height).toBe(400);
    document.body.replaceChildren();

    const narrow = await mount(5);
    expect(narrow.getBoundingClientRect().height).toBe(400);
  });

  it('🔴토큰 선언 후에도 rows 는 여전히 용량이지 표시 개수가 아니다', async () => {
    // 소비자가 상한을 낮게 잡아도(overflow 로 스크롤 접근) rows 가 만드는 빈 행 수는
    // 변하지 않는다 — 토큰은 호스트 상자 크기만 정하고, 격자 자체의 의미는 바꾸지 않는다.
    declare('--dc-sheet-height: 100px;');
    const el = await mount(15);
    expect(el.getBoundingClientRect().height).toBe(100);
    const rowEls = el.shadowRoot!.querySelectorAll('tbody tr');
    expect(rowEls.length).toBe(15); // data 2행 + 빈 행 13행 — 여전히 용량만큼 렌더
  });
});
