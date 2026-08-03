import { describe, it, beforeAll, expect } from 'vitest';
import lightCss from '@iyulab/components/styles/light.css?raw';
import darkCss from '@iyulab/components/styles/dark.css?raw';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * USimpleSheet 의 두 테마 계산색을 스냅샷으로 고정한다.
 *
 * UDataView 와 같은 목적이지만(→ data-view-colors.browser.test.ts) 결론이 다르다.
 * UDataView 는 다크 블록을 통째로 지울 수 있었고, 이쪽은 **일부만** 지울 수 있다 —
 * 이 컴포넌트는 유채색 표면(계산 셀·선택 셀·강조된 드롭다운 항목)을 쓰는데, 역할 층에는
 * 유채색 표면 토큰이 없고 팔레트의 유채색 틴트는 다크에서 절반 이하로 짓눌리기 때문이다.
 *
 * ⚠따라서 여기 남는 다크 규칙은 "죽은 규칙"이 아니라 **역할 층에 자리가 없어서 손으로
 * 쓴 보정**이다. 지우면 실제로 색이 달라진다 — 이 스냅샷이 그것을 지킨다.
 */

beforeAll(() => {
  const s = document.createElement('style');
  s.textContent = `${lightCss}\n${darkCss}`;
  document.head.appendChild(s);
});

const SELECTORS = [
  '.sheet-container', '.corner', '.col-header', '.row-num',
  '.cell', '.cell.selected', '.cell.cell-readonly', '.cell.cell-computed',
  // ⚠남긴 다크 규칙 6개를 **실제로 그리게** 해야 "지우면 색이 달라진다"는 주장이
  // 측정이 된다. 렌더되지 않는 선택자는 규칙이 적용되는지조차 말해 주지 못한다.
  '.col-header.col-selected', '.cell.cell-readonly.selected', '.cell.cell-computed.selected',
  // 커버 못 하는 것: .cell-computed.anchor(앵커 위치 의존) ·
  // .dropdown-item.highlighted(드롭다운 열림 필요). 그 둘은 미측정이다.
];
const PROPS = ['background-color', 'color', 'border-right-color', 'border-bottom-color'];

describe('USimpleSheet 계산색 회귀망', () => {
  it('두 테마의 계산색이 고정 스냅샷과 일치한다', async () => {
    const out: Record<string, Record<string, string>> = {};
    for (const theme of ['light', 'dark']) {
      document.body.replaceChildren();
      if (theme === 'dark') document.documentElement.setAttribute('theme', 'dark');
      else document.documentElement.removeAttribute('theme');

      const el = document.createElement('u-simple-sheet') as HTMLElement & {
        data: string[][]; rows: number; cols: number;
        columns?: unknown[]; updateComplete: Promise<unknown>;
      };
      el.rows = 3;
      el.cols = 3;
      el.data = [['a', 'b', 'c'], ['d', 'e', 'f']];
      el.columns = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B', readonly: true },
        { key: 'c', label: 'C', compute: () => '1' },
      ];
      document.body.appendChild(el);
      await el.updateComplete;

      // 코너를 눌러 전체 선택 — 남긴 다크 규칙이 걸리는 상태(열 선택 · 읽기전용 선택 ·
      // 계산 셀 선택)를 한 번에 그린다. 열 선택은 click 이 아니라 mousedown 경로다.
      (el.shadowRoot!.querySelector('.corner') as HTMLElement | undefined)?.click();
      await el.updateComplete;

      for (const sel of SELECTORS) {
        const node = el.shadowRoot!.querySelector(sel);
        if (!node) continue;
        const cs = getComputedStyle(node);
        out[`${theme} ${sel}`] = Object.fromEntries(
          PROPS.map(p => [p, cs.getPropertyValue(p).trim()]),
        );
      }
    }
    expect(out).toMatchSnapshot();
  });
});
