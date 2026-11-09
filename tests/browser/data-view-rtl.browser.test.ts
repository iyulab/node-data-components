import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/data-view/UDataView';
import type { UDataView } from '../../src/components/data-view/UDataView';

/**
 * `u-data-view` 의 표 모드는 `dir="rtl"` 에서 머리글이 **읽는 방향의 시작**에 정렬된다 — 오라클은 «칸 시작 가장자리에서 글자까지의 거리»라
 * 방향 없이 같은 값을 단언한다(LTR 은 왼쪽 · RTL 은 오른쪽). 머리글 정렬이 `left` 로 고정이면 RTL 에서 글자가 칸의 끝에 붙는다.
 * (스프레드시트 격자 `u-simple-sheet` 는 화면 좌표 표면이라 이 시험의 시야 밖이다 — 계획: RTL 논리 속성 전환 «아직 아님».)
 */

let view: UDataView;
afterEach(() => { view?.remove(); document.documentElement.dir = 'ltr'; });

async function mount(dir: 'ltr' | 'rtl'): Promise<UDataView> {
  document.documentElement.dir = dir;
  view = document.createElement('u-data-view') as UDataView;
  view.style.width = '600px';
  view.mode = 'table';
  view.columns = [{ key: 'name', label: 'Name', width: 300 }, { key: 'city', label: 'City', width: 300 }] as never;
  view.data = [{ _id: 'a', name: 'Alpha', city: 'Seoul' }];
  document.body.appendChild(view);
  await view.updateComplete;
  await new Promise((r) => setTimeout(r, 120));
  return view;
}

describe('RTL — u-data-view 표의 머리글 정렬', () => {
  it.each(['ltr', 'rtl'] as const)('%s: 머리글 글자는 칸의 시작 가장자리에서 안쪽 여백만큼 떨어져 있다', async (dir) => {
    const el = await mount(dir);
    const th = el.shadowRoot!.querySelector('th')!;
    const T = th.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(th);
    const R = range.getBoundingClientRect();
    const gap = dir === 'ltr' ? R.left - T.left : T.right - R.right;
    // padding-inline 1rem(16px) — 글자가 칸의 끝으로 밀렸다면 gap 이 칸 폭에 가깝다.
    expect(gap, `${dir}: 시작 가장자리에서 글자까지 ${gap}`).toBeLessThan(40);
    expect(gap).toBeGreaterThan(8);
  });
});
