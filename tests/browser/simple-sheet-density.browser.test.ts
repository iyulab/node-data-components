import { describe, it, beforeAll, afterEach, expect } from 'vitest';
import lightCss from '@iyulab/components/styles/light.css?raw';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * `USimpleSheet` 밀도·타이포 조절점이 **효력을 갖는가**.
 *
 * ## 왜 유닛(문자열 대조)이 아니라 브라우저인가
 *
 * 소스 대조는 `height: var(--dc-row-height)` 가 **적혀 있음**만 증명한다. 소비자가 실제로
 * 겨누는 경로 — 문서 스코프의 **요소 선택자**가 섀도의 `:host` 리터럴을 이기는가 — 는
 * 캐스케이드 문제라 계산값으로만 갈린다. 이 리포가 다섯 번 기록한 *"존재 ≠ 도달"* 이
 * 정확히 이 자리다.
 *
 * ## 판정 기준의 출처
 *
 * 소비앱 초안(`sheet-density-tokens`)의 수용 기준 ⑴~⑷ 를 그대로 옮겼다:
 * ⑴선언하면 이동한다 ⑵선언하지 않으면 종전과 같다 ⑶여백을 키워도 세로 중앙에 남는다
 * ⑷본문 글자와 머리행 글자가 서로 독립이다.
 *
 * ## ⚠ 첫 판이 여기서 걸렸다 — **선언값과 읽히는 높이는 같지 않다**
 *
 * `getComputedStyle(td).height` 는 «사용값»이라 border-collapse 로 접힌 테두리가 더해진다.
 * 실측: 선언 `24px` → 읽히는 값 **25.5px**. 소비앱이 보고한 그 25.5 가 바로 이 값이다.
 * ⇒ 토큰은 **셀 content 높이**를 정하고, 소비앱이 «32px 로 맞추고 싶다»면 선언값은
 * `30.5px` 다. 이 상수를 테스트가 직접 재서 쓴다 — 손으로 적으면 테두리 규칙이 바뀔 때
 * 조용히 낡는다.
 */

/** 선언값 → 읽히는 사용값의 차. 하드코딩하지 않고 기본 렌더에서 잰다. */
const borderDelta = async () => {
  const cs = getComputedStyle(cellOf(await mount()));
  const d = parseFloat(cs.height) - parseFloat(cs.lineHeight);
  document.body.replaceChildren();
  return d;
};

const DATA = [['a', 'b', 'c'], ['d', 'e', 'f']];

let override: HTMLStyleElement | null = null;

/** 소비자가 실제로 쓰는 형태 — 문서 스코프 + 요소 선택자. */
const declare = (decls: string) => {
  override = document.createElement('style');
  override.textContent = `u-simple-sheet { ${decls} }`;
  document.head.appendChild(override);
};

type Sheet = HTMLElement & { data: string[][]; rows: number; cols: number; updateComplete: Promise<unknown> };

const mount = async () => {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = 3;
  el.cols = 3;
  el.data = DATA;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const cellOf = (el: Sheet) => el.shadowRoot!.querySelector('.cell') as HTMLElement;
const headerOf = (el: Sheet) => el.shadowRoot!.querySelector('.col-header') as HTMLElement;

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

describe('USimpleSheet 밀도·타이포 조절점', () => {
  it('⑵ 선언하지 않으면 종전 값이다 (기본 렌더 무변화)', async () => {
    const cs = getComputedStyle(cellOf(await mount()));
    expect({
      lineHeight: cs.lineHeight,
      fontSize: cs.fontSize,
      paddingTop: cs.paddingTop,
      paddingLeft: cs.paddingLeft,
    }).toEqual({
      lineHeight: '24px', fontSize: '13px', paddingTop: '0px', paddingLeft: '6px',
    });
    // 소비앱이 보고한 25.5 를 이 자리에서 그대로 재현해 둔다 — 저쪽 하니스와 우리가
    // «같은 것»을 재고 있음을 고정하는 값이다.
    expect(cs.height).toBe('25.5px');
  });

  it('⑴ 문서 스코프 요소 선택자로 --dc-row-height 를 선언하면 행이 이동한다', async () => {
    const delta = await borderDelta();
    declare('--dc-row-height: 32px;');
    const cs = getComputedStyle(cellOf(await mount()));
    expect(cs.lineHeight).toBe('32px');
    expect(parseFloat(cs.height)).toBeCloseTo(32 + delta, 2);
  });

  it('🔴묶임 — 한 토큰이 height 와 line-height 를 «둘 다» 정한다', async () => {
    // 이 단언이 이 파일의 존재 이유다. 둘을 따로 열면 소비자가 한쪽만 바꿔
    // 글자가 세로로 어긋나고, 그것은 조절점이 아니라 새 결함이다.
    const delta = await borderDelta();
    declare('--dc-row-height: 40px;');
    const cs = getComputedStyle(cellOf(await mount()));
    expect(cs.lineHeight).toBe('40px');
    expect(parseFloat(cs.height) - parseFloat(cs.lineHeight)).toBeCloseTo(delta, 2);
  });

  it('🔴빈 셀도 같은 높이다 — 데이터 행과 빈 행이 갈리지 않는다', async () => {
    // ★네거티브 컨트롤이 만든 단언이다. `height` 만 되돌려도 위 단언들은 «전건 통과»했다 —
    // 내용이 있는 셀의 높이는 line-height 가 만들기 때문이다. 두 선언이 갈리는 자리는
    // **빈 셀**뿐이고(시트에서 흔한 상태다), 거기서만 이 배선이 관측된다.
    declare('--dc-row-height: 40px;');
    const el = await mount();                       // rows=3 · data 2행 ⇒ 마지막 행은 빈 행
    const cells = [...el.shadowRoot!.querySelectorAll('.cell')] as HTMLElement[];
    const empty = cells.filter(c => !c.textContent?.trim());
    expect(empty.length, '빈 셀이 없으면 이 단언은 아무것도 재지 않는다').toBeGreaterThan(0);
    for (const c of empty) expect(parseFloat(getComputedStyle(c).height)).toBeCloseTo(40, 1);

    // ⚠**측정하다 드러난 것**: 빈 셀 40 · 채워진 셀 41.5 로 «접힌 테두리 한 겹»만큼 갈린다
    // (기본값에서도 24 vs 25.5 로 종전부터 그랬다). box-sizing: border-box 아래에서
    // height 는 테두리를 포함하는데 line-height 가 만든 높이는 그 위에 얹히기 때문이다.
    // 여기서 고치지 않는다 — 그 교정(box-sizing 변경)은 «기본 렌더 무변화»(수용 기준 ⑵)를
    // 깬다. 이 릴리스는 조절점만 연다. 초안 회신에 관측으로 남긴다.
    const filled = parseFloat(getComputedStyle(cells[0]).height);
    expect(filled - parseFloat(getComputedStyle(empty[0]).height)).toBeLessThanOrEqual(2);
  });

  it('⑶ 여백을 키워도 세로 중앙에 남는다 (가산 · 대칭)', async () => {
    const base = cellOf(await mount()).getBoundingClientRect().height;
    document.body.replaceChildren();

    declare('--dc-cell-padding-block: 4px;');
    const cell = cellOf(await mount());
    const cs = getComputedStyle(cell);
    expect(cs.paddingTop).toBe('4px');
    expect(cs.paddingBottom).toBe(cs.paddingTop); // 대칭이 곧 세로 중앙이다
    expect(cell.getBoundingClientRect().height - base).toBeCloseTo(8, 1);
  });

  it('⑶-b 가로 여백도 셀과 편집 입력이 «같은 값»을 읽는다', async () => {
    declare('--dc-cell-padding-inline: 12px;');
    const el = await mount();
    expect(getComputedStyle(cellOf(el)).paddingLeft).toBe('12px');
    // 편집 입력은 셀 위에 겹쳐 그려진다 — 값이 어긋나면 편집 진입 순간 글자가 튄다.
    // 입력은 편집 상태에서만 존재하므로 규칙 자체를 시트에서 확인한다.
    const sheetText = [...el.shadowRoot!.adoptedStyleSheets]
      .flatMap(s => [...s.cssRules].map(r => r.cssText)).join('\n');
    const inputRule = sheetText.match(/\.cell-input[^{]*\{[^}]*\}/)?.[0] ?? '';
    expect(inputRule).toContain('var(--dc-cell-padding-inline)');
    expect(inputRule).toContain('var(--dc-font-size)');
  });

  it('⑷ 본문 글자와 머리행 글자는 서로 독립이다', async () => {
    declare('--dc-font-size: 15px;');
    const el = await mount();
    expect(getComputedStyle(cellOf(el)).fontSize).toBe('15px');
    expect(getComputedStyle(headerOf(el)).fontSize).toBe('12px'); // 머리행은 따라오지 않는다
  });

  it('⑷-b 머리행 글자 크기·무게가 따로 열려 있다', async () => {
    declare('--dc-header-font-size: 14px; --dc-header-font-weight: 400;');
    const el = await mount();
    const h = getComputedStyle(headerOf(el));
    expect([h.fontSize, h.fontWeight]).toEqual(['14px', '400']);
    expect(getComputedStyle(cellOf(el)).fontSize).toBe('13px'); // 본문은 따라오지 않는다
  });

  it('⚠:root 선언은 닿지 않는다 — 요소 선택자여야 하는 이유', async () => {
    // 상속값은 섀도의 :host 선언에 진다. 소비앱이 색 축에서 이미 실증한 제약이고,
    // README 가 요소 선택자를 쓰라고 적는 근거다. 여기서 한 번 기계로 못박는다.
    override = document.createElement('style');
    override.textContent = ':root { --dc-row-height: 48px; }';
    document.head.appendChild(override);
    expect(getComputedStyle(cellOf(await mount())).lineHeight).toBe('24px');
  });
});
