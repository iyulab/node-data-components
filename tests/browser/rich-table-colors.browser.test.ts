import { describe, it, beforeAll, expect } from 'vitest';
import lightCss from '@iyulab/components/styles/light.css?raw';
import darkCss from '@iyulab/components/styles/dark.css?raw';
import '../../src/components/u-rich-table/URichTable';

/**
 * URichTable 의 두 테마 계산색을 스냅샷으로 고정한다.
 *
 * ★이 컴포넌트는 앞의 둘과 출발점이 다르다. base 레이어가 **토큰을 하나도 쓰지 않고**
 * Tailwind 계열 hex 를 직접 박아 두었다 — 즉 라이트에서 디자인 시스템에 전혀 반응하지
 * 않았고, 다크는 그 위에 얹은 별도 재구현이었다. 그래서 여기서 일어나는 변화는
 * "정리"가 아니라 **재도색**이며, 이 스냅샷이 무엇이 어떻게 바뀌었는지의 기록이다.
 */

beforeAll(() => {
  const s = document.createElement('style');
  s.textContent = `${lightCss}\n${darkCss}`;
  document.head.appendChild(s);
});

const SELECTORS = [
  ':host', '.toolbar', '.toolbar .selection-info', '.toolbar .search-input',
  '.toolbar .btn-primary', '.toolbar .btn-success', 'thead th', '.sort-indicator',
  'tbody tr', 'tbody td', '.pagination', '.pagination button', '.empty-message',
  // ⚠상태 틴트 — 이것들을 렌더하지 않으면 "색이 이렇게 바뀐다"는 주장이 소스 대조에
  // 머문다. 오늘 잡힌 회귀 둘(.pagination button 색 소실, :host 가 color 를 소유한 적
  // 없음)이 전부 **규칙이 적용되는가** 의 문제였지 hex 값의 문제가 아니었다.
  '.filter-row td', '.filter-row input', '.new-row td', '.new-row input',
  'tbody tr.selected', 'tbody tr.editing', 'tbody td .cell-edit-input',
];
const PROPS = ['background-color', 'color', 'border-color', 'border-bottom-color'];

describe('URichTable 계산색 회귀망', () => {
  it('두 테마의 계산색이 고정 스냅샷과 일치한다', async () => {
    const out: Record<string, Record<string, string>> = {};
    for (const theme of ['light', 'dark']) {
      document.body.replaceChildren();
      if (theme === 'dark') document.documentElement.setAttribute('theme', 'dark');
      else document.documentElement.removeAttribute('theme');

      const el = document.createElement('u-rich-table') as HTMLElement & {
        columns: unknown[]; data: unknown[]; totalCount: number;
        selectable: boolean; addable: boolean; filterable: boolean; editable: boolean;
        updateComplete: Promise<unknown>;
      };
      el.columns = [
        { key: 'a', label: 'A', sortable: true, filterable: true },
        { key: 'b', label: 'B', editable: true },
      ];
      el.data = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
      el.totalCount = 2;
      el.selectable = true;
      el.addable = true;
      el.filterable = true;      // .filter-row 를 렌더시킨다
      el.editable = true;        // 셀 편집 경로를 연다
      document.body.appendChild(el);
      await el.updateComplete;

      // 상태 틴트를 실제로 그리게 한다 — 선택 1행 + 편집 중 셀 1개.
      const box = el.shadowRoot!.querySelector<HTMLInputElement>('tbody .checkbox-cell input');
      box?.click();
      await el.updateComplete;
      const cell = el.shadowRoot!.querySelectorAll('tbody td')[1] as HTMLElement | undefined;
      cell?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await el.updateComplete;

      for (const sel of SELECTORS) {
        const node = sel === ':host' ? el : el.shadowRoot!.querySelector(sel);
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
