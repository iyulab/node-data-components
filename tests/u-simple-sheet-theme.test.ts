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

    it.each(DARK_PREFIXES)('%s 프리픽스로 다크 규칙이 존재한다', (prefix) => {
      expect(text).toContain(`${prefix} .sheet-container`);
      expect(text).toContain(`${prefix} .cell`);
      expect(text).toContain(`${prefix} .dropdown-empty`);
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
