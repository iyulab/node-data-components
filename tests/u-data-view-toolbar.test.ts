// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import '../src/components/data-view/UDataView.js';
import type { UDataView } from '../src/components/data-view/UDataView.js';

/**
 * 툴바 레이아웃 전환이 **동작하는가**.
 *
 * 🔴이 테스트가 생긴 이유: 그 버튼 셋은 렌더되고 있었지만 파일 전체에 `@click` 이 0개였다 —
 * 즉 **한 번도 눌린 적이 없다.** 선택 표시도 `?active` 로 하려 했는데 `u-button` 에는
 * `active` 프로퍼티가 없고 `[active]` 스타일 규칙도 없어서 아무 표시가 나지 않았다.
 * *«속성 존재 ≠ 동작»* 의 변주이고, 여기서 죽은 것은 프로퍼티가 아니라 **어포던스**다.
 */
async function mount(): Promise<UDataView> {
  const el = document.createElement('u-data-view') as UDataView;
  el.data = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function toolbarButtons(el: UDataView): HTMLElement[] {
  return [...el.shadowRoot!.querySelectorAll('.view-toggles u-button')] as HTMLElement[];
}

describe('u-data-view 툴바', () => {
  beforeAll(() => {
    document.body.innerHTML = '';
  });

  it('레이아웃 버튼 셋을 그린다', async () => {
    const el = await mount();
    expect(toolbarButtons(el)).toHaveLength(3);
  });

  it('버튼을 누르면 mode 가 바뀐다', async () => {
    const el = await mount();
    expect(el.mode).toBe('grid');

    toolbarButtons(el)[1].click();
    await el.updateComplete;
    expect(el.mode).toBe('list');

    toolbarButtons(el)[2].click();
    await el.updateComplete;
    expect(el.mode).toBe('table');
  });

  it('누른 버튼만 선택 표기를 갖는다 — 색만이 아니라 aria-pressed 로도', async () => {
    const el = await mount();
    el.mode = 'list';
    await el.updateComplete;

    const [grid, list, table] = toolbarButtons(el);
    expect(list.getAttribute('aria-pressed')).toBe('true');
    expect(grid.getAttribute('aria-pressed')).toBe('false');
    expect(table.getAttribute('aria-pressed')).toBe('false');
    expect(list.getAttribute('appearance')).toBe('solid');
    expect(grid.getAttribute('appearance')).toBe('plain');
  });

  // 공용 인터넷에 닿지 않는 망에서도 버튼이 비지 않는다 — 아이콘은 컴포넌트가 직접 그린다.
  it('보기 전환 아이콘은 직접 그린 SVG 다 — 아이콘 라이브러리(CDN)를 요청하지 않는다', async () => {
    const el = await mount();
    for (const button of toolbarButtons(el)) {
      expect(button.querySelector('u-icon')).toBeNull();
      expect(button.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('🔴NEGATIVE — 죽은 표기(`active` 속성)는 더 이상 쓰이지 않는다', async () => {
    // `u-button` 에 `active` 프로퍼티가 없다는 사실이 이 단언의 근거다.
    // 되살아나면 «표시되지 않는 선택 상태»가 조용히 돌아온다.
    const el = await mount();
    for (const b of toolbarButtons(el)) {
      expect(b.hasAttribute('active')).toBe(false);
    }
  });
});
