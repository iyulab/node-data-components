import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import lightCss from '@iyulab/components/styles/light.css?raw';
import darkCss from '@iyulab/components/styles/dark.css?raw';
import '../../src/components/data-view/UDataView';

/**
 * 이 패키지의 다크 모드가 **실제로 무엇을 하는지** 측정한다.
 *
 * 기존 유닛 테스트(`u-simple-sheet-theme.test.ts`)는 스타일 문자열에서 셀렉터를 센다.
 * 그것은 규칙이 *적혀 있음* 을 증명할 뿐, 그 규칙이 *무언가를 바꾼다* 는 것은 증명하지
 * 못한다 — 실제로 UDataView 의 다크 블록 24개 선언은 전부 base 와 같은 토큰을
 * 가리키고 있어서 계산값을 하나도 바꾸지 못하고 있었고, 문자열 테스트는 전부 통과했다.
 *
 * 여기서 확정하는 사실 셋:
 *   ⑴ 역할 토큰은 두 테마에서 다른 팔레트 단에 매핑된다 → base 규칙만으로 다크가 된다.
 *   ⑵ 팔레트 토큰은 그렇지 않다 → 계열마다 틴트 세기가 어긋난다.
 *   ⑶ 그래서 색은 역할 토큰으로 읽어야 하고, 다크 전용 블록은 필요 없다.
 */

const tokenOf = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

beforeAll(() => {
  const s = document.createElement('style');
  // 실제 소비자와 같은 구성 — 두 시트가 공존하고 다크는 :root[theme="dark"] 로 스코프된다.
  s.textContent = `${lightCss}\n${darkCss}`;
  document.head.appendChild(s);
});

afterEach(() => {
  document.documentElement.removeAttribute('theme');
  document.body.replaceChildren();
});

async function mount(tag: string) {
  const el = document.createElement(tag) as HTMLElement & { updateComplete: Promise<unknown> };
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const bgOf = async (sel: string) => {
  const el = await mount('u-data-view');
  return getComputedStyle(el.shadowRoot!.querySelector(sel)!).backgroundColor;
};

describe('★ 역할 토큰은 테마별로 다른 팔레트 단에 매핑된다', () => {
  it('--u-bg-color 는 단순 반전이 아니라 테마-튜닝된 값이다', () => {
    // 라이트: neutral-0(#FFFFFF).  다크: neutral-0(#000000)이 아니라 neutral-100(#121212).
    // 다크 표면을 순검정으로 두지 않는 것은 의도된 선택이며, 이 튜닝이 토큰 층에 있기
    // 때문에 컴포넌트가 다크 규칙을 따로 쓸 필요가 없다.
    expect(tokenOf('--u-bg-color')).toBe('#FFFFFF');
    document.documentElement.setAttribute('theme', 'dark');
    expect(tokenOf('--u-bg-color')).toBe('#121212');
    expect(tokenOf('--u-neutral-0')).toBe('#000000'); // 팔레트는 순검정 — 역할 토큰과 다르다
  });

  it('[회귀] 다크 전용 규칙 없이도 .toolbar 배경이 테마를 따른다', async () => {
    expect(await bgOf('.toolbar')).toBe('rgb(255, 255, 255)');
    document.body.replaceChildren();
    document.documentElement.setAttribute('theme', 'dark');
    expect(await bgOf('.toolbar')).toBe('rgb(18, 18, 18)');
  });
});

describe('★ 팔레트 토큰은 테마 보정을 해 주지 않는다', () => {
  const lum = (rgb: string) => {
    const [r, g, b] = rgb.match(/\d+/g)!.map(n => Number(n) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const asRgb = (hex: string) => {
    const d = document.createElement('div');
    d.style.color = hex;
    document.body.appendChild(d);
    const v = getComputedStyle(d).color;
    d.remove();
    return v;
  };
  /** 그 테마의 바탕에서 얼마나 떨어져 있는가 = 틴트 세기 */
  const tint = (token: string) => {
    const [x, y] = [lum(asRgb(tokenOf(token))), lum(asRgb(tokenOf('--u-neutral-0')))]
      .sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05) - 1;
  };

  it('중립은 다크에서 더 세고, 청색은 절반 이하로 짓눌린다', () => {
    const light = { neutral: tint('--u-neutral-200'), blue: tint('--u-blue-100') };
    document.documentElement.setAttribute('theme', 'dark');
    const dark = { neutral: tint('--u-neutral-200'), blue: tint('--u-blue-100') };

    // 팔레트는 명도 방향으로는 반전하지만 **세기를 보존하지 않는다.**
    // 같은 단을 두 테마에서 그대로 쓰면 한쪽에서 의도보다 세거나 약하게 읽힌다.
    // 역할 토큰이 흡수해 주는 것이 바로 이 어긋남이다 — 단, 중립 계열에 한해서다.
    expect(dark.neutral / light.neutral).toBeGreaterThan(1.4);
    expect(dark.blue / light.blue).toBeLessThan(0.5);
  });

  it('★유채색 역할 토큰도 이제 테마별로 다른 단을 고른다 (전경 한정)', () => {
    // ★이 테스트는 원래 정반대를 단언했다 — *"유채색에는 이 어긋남을 흡수할 역할 토큰이
    //   없다"*. 그것이 참인 동안 이 패키지는 유채색 자리마다 다크를 손으로 보정했다.
    //   components 1.16.0 이 역할 단을 **대비로** 다시 고르면서 전제가 바뀌었다:
    //     라이트 blue-700(#1976D2) · 다크 blue-600(#2A659D) — **단 선택이 다르다.**
    //   중립이 진작부터 하던 일(위 테스트)을 유채색 전경도 하게 된 것이다.
    //
    // ⚠**표면은 아직 아니다.** --u-*-bg-color 4종이 라이트 shade-0 ↔ 다크 shade-100 으로
    //   짝지어져 있지만 warning 은 빠져 있고, --u-*-color-weakest 를 면으로 쓰는 자리
    //   (u-alert)는 여전히 대비가 부족하다. 그래서 이 패키지의 다크 규칙이 0 이 아니다.
    const l = tokenOf('--u-primary-color');
    document.documentElement.setAttribute('theme', 'dark');
    const d = tokenOf('--u-primary-color');
    expect(l).toBe('#1976D2'); // blue-700 — 흰 글자 4.60 ✓ (blue-600 은 3.68 ✗)
    expect(d).toBe('#2A659D'); // blue-600 — 흰 글자 6.09 ✓ (다크는 원래 통과)
  });
});
