import { describe, it, beforeAll, expect } from 'vitest';
import lightCss from '../../../components/src/assets/styles/light.css?raw';
import darkCss from '../../../components/src/assets/styles/dark.css?raw';
import '../../src/components/data-view/UDataView';

/**
 * UDataView 의 두 테마 계산색 전체를 스냅샷으로 고정한다.
 *
 * ★이 파일이 생긴 이유: 다크 전용 블록 92줄을 지우기 전, "정말 아무것도 안 바뀌는가"를
 * 판정할 도구가 필요했다. 소스 대조로는 답할 수 없다 — 다크 규칙과 base 규칙이 같은
 * 토큰을 가리키면 텍스트는 다르지만 계산값은 같기 때문이다. 스냅샷을 뜨고, 블록을
 * 지우고, 다시 떠서 **동일함**을 확인한 뒤에야 삭제했다.
 *
 * ⚠스냅샷이 무언가를 잡는다는 것도 따로 확인했다: .toolbar 배경을 rebeccapurple 로
 * 훼손하니 실패했다. 통과 사실만으로는 감도의 증거가 되지 못한다.
 *
 * ⚠**이 스냅샷이 덮지 못하는 것** — 여기서는 토큰 시트가 **로드된** 경로만 잰다.
 * 삭제가 실제로 동작을 바꾸는 단 하나의 경우, 즉 **시트 미공급 + 요소에 theme="dark"**
 * 조합은 이 측정 밖에 있다. 그쪽은 의도된 동작 변경이며 CHANGELOG 의 `Removed` 에
 * 적어 두었다. "스냅샷이 일치했다"를 그보다 넓은 증명으로 읽지 말 것 — 죽은 선언
 * 24개가 살아남은 것이 정확히 그런 과잉 독해 때문이었다.
 *
 * 이후로는 회귀망으로 남는다 — 토큰 이름을 바꾸거나 역할 토큰 매핑이 움직이면 여기서
 * 먼저 걸린다. 의도된 색 변경이라면 `-u` 로 갱신하고 그 근거를 CHANGELOG 에 남길 것.
 */

beforeAll(() => {
  const s = document.createElement('style');
  s.textContent = `${lightCss}\n${darkCss}`;
  document.head.appendChild(s);
});

const SELECTORS = [
  '.toolbar', '.info', '.card', '.card.selected', '.card-field .label',
  '.card-field .value', '.table-wrapper', 'table', 'thead', 'th',
  'tbody tr', '.view-toggles u-button[active]',
];
const PROPS = ['background-color', 'color', 'border-color', 'border-bottom-color'];

describe('UDataView 계산색 회귀망', () => {
  it('두 테마의 계산색이 고정 스냅샷과 일치한다', async () => {
    const out: Record<string, Record<string, string>> = {};
    for (const theme of ['light', 'dark']) {
      document.body.replaceChildren();
      if (theme === 'dark') document.documentElement.setAttribute('theme', 'dark');
      else document.documentElement.removeAttribute('theme');

      const el = document.createElement('u-data-view') as HTMLElement & {
        items: unknown[]; mode: string; updateComplete: Promise<unknown>;
      };
      el.items = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
      el.mode = 'table';
      document.body.appendChild(el);
      await el.updateComplete;

      for (const sel of SELECTORS) {
        const node = el.shadowRoot!.querySelector(sel);
        if (!node) continue;
        const cs = getComputedStyle(node);
        out[`${theme} ${sel}`] = Object.fromEntries(
          PROPS.map(p => [p, cs.getPropertyValue(p).trim()]),
        );
      }
      // 카드 모드도 뜬다
      el.mode = 'grid';
      await el.updateComplete;
      for (const sel of ['.card', '.card-field .label', '.card-field .value']) {
        const node = el.shadowRoot!.querySelector(sel);
        if (!node) continue;
        const cs = getComputedStyle(node);
        out[`${theme} grid ${sel}`] = Object.fromEntries(
          PROPS.map(p => [p, cs.getPropertyValue(p).trim()]),
        );
      }
    }
    expect(out).toMatchSnapshot();
  });
});
