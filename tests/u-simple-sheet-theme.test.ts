// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { USimpleSheet } from '../src/components/simple-sheet/USimpleSheet.js';
import { styles } from '../src/components/simple-sheet/USimpleSheet.styles.js';

/**
 * USimpleSheet 테마 1급 지원 검증.
 *
 * 배경(ISSUE-20260610-usimplesheet-darkmode-inconsistent):
 * 다크 스타일이 :host-context([theme="dark"])에만 걸려 있어
 * (1) data-theme만 설정하는 앱에서는 다크가 적용되지 않고,
 * (2) :host-context 미지원 브라우저(Firefox/Safari)에서는 항상 미적용이며,
 * (3) 소비자가 per-element로 테마를 지정할 공식 수단이 없다.
 */

function cssText(group: unknown): string {
  if (Array.isArray(group)) return group.map(cssText).join('\n');
  return String(group);
}

const DARK_PREFIXES = [
  ':host([theme="dark"])',
  ':host-context([theme="dark"])',
  ':host-context([data-theme="dark"])',
];

function countOccurrences(text: string, token: string): number {
  return text.split(token).length - 1;
}

describe('USimpleSheet 테마 지원', () => {
  it('theme 속성이 attribute로 리플렉트된다', async () => {
    const el = new USimpleSheet();
    document.body.appendChild(el);

    el.theme = 'dark';
    await el.updateComplete;

    expect(el.getAttribute('theme')).toBe('dark');
    el.remove();
  });

  describe('다크 모드 CSS 계약', () => {
    const text = cssText(styles);

    // ⚠이 테스트가 확인하는 것은 **생성 메커니즘**이지, 어떤 규칙이 다크 블록에 있어야
    // 하는지가 아니다. 종전에는 .sheet-container / .cell / .dropdown-empty 의 존재를
    // 요구했는데, 그 규칙들은 base 와 **같은 토큰**을 가리켜 계산값을 전혀 바꾸지 못하는
    // 죽은 규칙이었다(브라우저 스냅샷으로 실증 — tests/browser/simple-sheet-colors).
    // 문자열 검사는 그것을 구분하지 못한다. 그래서 "무엇이 들어 있는가"가 아니라
    // "세 컨텍스트가 한 소스에서 동일하게 생성되는가"만 확인한다.
    it.each(DARK_PREFIXES)('%s 프리픽스로 다크 규칙이 생성된다', (prefix) => {
      // 남은 규칙은 유채색 표면뿐이다 — 역할 층에 유채색 표면 토큰이 없어서 손으로 메운 것.
      expect(text).toContain(`${prefix} .cell.cell-computed`);
    });

    it('세 프리픽스의 규칙 수가 동일하다 (단일 소스에서 생성)', () => {
      const counts = DARK_PREFIXES.map(p => countOccurrences(text, `${p} `));
      expect(counts[0]).toBeGreaterThan(0);
      expect(counts[1]).toBe(counts[0]);
      expect(counts[2]).toBe(counts[0]);
    });

    it('프리픽스들이 셀렉터 리스트로 결합되지 않는다 (:host-context 미지원 브라우저에서 리스트 전체 무효화 방지)', () => {
      // 같은 규칙 안에서 "prefix A ..., prefix B ..." 형태로 콤마 결합되면 안 된다.
      expect(text).not.toMatch(/:host\(\[theme="dark"\]\)[^{}]*,[^{}]*:host-context/);
      expect(text).not.toMatch(/:host-context\([^)]*\)[^{}]*,[^{}]*:host\(\[theme="dark"\]\)/);
    });
  });
});
