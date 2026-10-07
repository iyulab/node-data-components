import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/data-view/UDataView';
import type { UDataView } from '../../src/components/data-view/UDataView';

/**
 * 보기 전환 툴바 — Tab 정지점 하나, ←/→ · Home/End 로 단추 사이를 옮긴다(APG Toolbar).
 *
 * 종전에는 단추 셋이 각자 정지점이라 레코드에 닿기 전에 Tab 을 세 번 눌러야 했고, 레코드(정지점 하나)와 규칙이
 * 갈렸다. 실제 입력(`userEvent`)으로 잰다 — 정지점 판정은 호스트의 음수 tabindex 가 섀도를 순차 탐색에서 빼는 브라우저
 * 동작에 서 있으므로, 합성 이벤트로는 원리적으로 못 잰다.
 */

let before: HTMLButtonElement;
let view: UDataView;
afterEach(() => { view?.remove(); before?.remove(); });

async function mount() {
  before = document.createElement('button');
  before.textContent = 'Before';
  document.body.appendChild(before);
  view = document.createElement('u-data-view') as UDataView;
  view.style.width = '600px';
  view.data = [{ _id: 'a', name: 'Alpha' }, { _id: 'b', name: 'Bravo' }];
  document.body.appendChild(view);
  await view.updateComplete;
}

const tools = () => [...view.shadowRoot!.querySelectorAll<HTMLElement>('.view-toggles u-button')];
const active = () => view.shadowRoot!.activeElement;

describe('u-data-view toolbar — one Tab stop, arrow keys between the layouts', () => {
  it('🔴Tab lands on the selected layout once, the next Tab goes to the records', async () => {
    await mount();
    before.focus();
    await userEvent.tab();
    expect(active()).toBe(tools()[0]); // grid 가 선택돼 있다
    await userEvent.tab();
    expect((active() as HTMLElement | null)?.dataset.index).toBe('0'); // 툴바 단추 둘을 건너 첫 레코드로
  });

  it('arrows move focus between the layouts (wrapping), Enter switches, the stop follows', async () => {
    await mount();
    before.focus();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(active()).toBe(tools()[1]);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(active()).toBe(tools()[2]); // 처음에서 왼쪽은 끝으로
    await userEvent.keyboard('{Enter}');
    await view.updateComplete;
    expect(view.mode).toBe('table');
    expect(tools().filter((t) => !t.hasAttribute('tabindex')).length).toBe(1);
    expect(tools()[2].hasAttribute('tabindex')).toBe(false);
  });

  it('the toolbar is named', async () => {
    await mount();
    const bar = view.shadowRoot!.querySelector('.view-toggles')!;
    expect(bar.getAttribute('role')).toBe('toolbar');
    expect(bar.getAttribute('aria-label')).toBeTruthy();
  });
});
