import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import { html } from 'lit';
import '../../src/components/data-view/UDataView';
import type { UDataView } from '../../src/components/data-view/UDataView';

/**
 * `u-data-view` 가 «레코드 열기» 를 두 표와 같은 이벤트로 낸다 — `row-activate {row, id, via}`.
 *
 * 계기: 목록 키트는 표와 카드를 속성 하나로 바꾼다(설계안 수용 기준 ⑵). 표는 클릭·Enter 로 행을 열었는데 카드는 클릭이
 * 아무 이벤트도 내지 않았고 키보드로는 카드에 닿지도 않았다 — `view="card"` 로 바꾸는 순간 «열기» 가 사라졌다.
 *
 * 실제 입력: 앞 버튼에 포커스 → Tab · 화살표 · Enter(`userEvent`), 진짜 클릭. 세 모드 모두.
 */

let before: HTMLButtonElement;
let view: UDataView;
afterEach(() => { view?.remove(); before?.remove(); });

async function mount(mode: 'grid' | 'list' | 'table', extra: Partial<UDataView> = {}) {
  before = document.createElement('button');
  before.textContent = 'Before';
  document.body.appendChild(before);
  view = document.createElement('u-data-view') as UDataView;
  view.style.width = '600px';
  view.mode = mode;
  view.data = [{ _id: 'a', name: 'Alpha' }, { _id: 'b', name: 'Bravo' }, { _id: 'c', name: 'Charlie' }];
  Object.assign(view, extra);
  document.body.appendChild(view);
  await view.updateComplete;
  return view;
}

const items = () => [...view.shadowRoot!.querySelectorAll<HTMLElement>('[data-index]')];

function record() {
  const got: Array<{ id: string; via: string }> = [];
  view.addEventListener('row-activate', (e) => got.push({ id: e.detail.id, via: e.detail.via }));
  return got;
}

describe('u-data-view row-activate — the same "open this record" as the tables', () => {
  for (const mode of ['grid', 'list', 'table'] as const) {
    it(`${mode}: a click opens the record under the pointer`, async () => {
      await mount(mode);
      const got = record();
      await userEvent.click(items()[1]);
      expect(got).toEqual([{ id: 'b', via: 'click' }]);
    });

    it(`${mode}: one Tab stop — Tab lands on the first record, arrows move, Enter opens`, async () => {
      await mount(mode);
      const got = record();
      before.focus();
      // 툴바(보기 전환 단추)를 지나 첫 항목에 선다 — 항목은 몇 개든 정지점 하나.
      let guard = 0;
      do { await userEvent.tab(); } while (!items().includes(view.shadowRoot!.activeElement as HTMLElement) && guard++ < 6);
      expect(view.shadowRoot!.activeElement).toBe(items()[0]);
      expect(got).toEqual([]);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await view.updateComplete;
      expect(view.shadowRoot!.activeElement).toBe(items()[2]);
      await userEvent.keyboard('{Enter}');
      expect(got).toEqual([{ id: 'c', via: 'keyboard' }]);
      expect(items().filter((el) => el.tabIndex === 0)).toHaveLength(1);
    });
  }

  it('NEGATIVE: a button a card renders owns its click', async () => {
    await mount('grid', { renderCard: (item) => html`<span>${item.name}</span><button class="del">Delete</button>` });
    const got = record();
    await userEvent.click(view.shadowRoot!.querySelectorAll<HTMLElement>('.del')[0]);
    expect(got).toEqual([]);
  });

  it('a record with no _id is named by its place', async () => {
    await mount('list', { data: [{ name: 'x' }, { name: 'y' }] });
    const got = record();
    await userEvent.click(items()[1]);
    expect(got).toEqual([{ id: '#1', via: 'click' }]);
  });

  it('NEGATIVE: Tab leaves the view after the one stop — the next control is reached', async () => {
    await mount('grid');
    const after = document.createElement('button');
    after.textContent = 'After';
    document.body.appendChild(after);
    before.focus();
    await userEvent.tab();
    await userEvent.tab();
    // 툴바 단추들을 지나 «After» 에 닿아야 한다 — 항목마다 멈추지 않는다.
    let guard = 0;
    while (document.activeElement !== after && guard++ < 6) await userEvent.tab();
    expect(document.activeElement).toBe(after);
    expect(guard).toBeLessThanOrEqual(4);
    after.remove();
  });
});
