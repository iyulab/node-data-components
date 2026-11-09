import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';

/**
 * `u-rich-table` 은 `dir="rtl"` 에서 머리글 글자 · 정렬 표지 · 동작 단추 사이 간격이 **읽는 방향**을 따른다.
 * 계기: `sweep` 의 «물리 방향 선언» 게이트가 첫 실행에서 세 곳을 찾았다 — 머리 칸 `text-align: left`(RTL 에서 머리글이 칸의
 * 왼쪽 끝에 붙는다) · `.sort-indicator` 의 `margin-left` · `.row-action + .row-action` 의 `margin-left`(RTL 에서 간격이
 * 글자의 «앞» 이 아니라 «뒤» 에 생긴다). 오라클은 방향 없이 같은 값을 단언한다 — 칸 시작 가장자리에서 글자까지의 거리 · 계산된
 * `margin-inline-start`(LTR 은 왼쪽 · RTL 은 오른쪽 여백으로 풀린다).
 */

let table: URichTable;
afterEach(() => { table?.remove(); document.documentElement.dir = 'ltr'; });

async function mount(dir: 'ltr' | 'rtl'): Promise<URichTable> {
  document.documentElement.dir = dir;
  table = document.createElement('u-rich-table') as URichTable;
  table.style.width = '600px';
  // 시험 창(414px)은 카드 폭 기준 아래라 `auto` 면 표가 카드로 그려진다 — 표를 재는 시험은 `table` 을 명시한다.
  table.layout = 'table';
  table.columns = [
    { key: 'name', label: 'Name', width: 300 },
    { key: 'city', label: 'City', sortable: true, width: 300 },
  ] as never;
  table.sortCriteria = [{ key: 'city', direction: 'asc' }];
  table.rowActions = [
    { event: 'row-edit', label: 'Edit', icon: 'E' },
    { event: 'row-archive', label: 'Archive', icon: 'A' },
  ];
  table.data = [{ _id: 'a', name: 'Alpha', city: 'Seoul' }];
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 120));
  return table;
}

describe('RTL — u-rich-table 머리글 · 표지 · 동작 간격', () => {
  it.each(['ltr', 'rtl'] as const)('%s: 머리글 글자는 칸의 시작 가장자리에서 안쪽 여백만큼 떨어져 있다', async (dir) => {
    const el = await mount(dir);
    const th = el.shadowRoot!.querySelector('thead th:not(.sortable):not(.actions-cell)') as HTMLElement;
    const T = th.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(th);
    const R = range.getBoundingClientRect();
    const gap = dir === 'ltr' ? R.left - T.left : T.right - R.right;
    expect(gap, `${dir}: 시작 가장자리에서 글자까지 ${gap}`).toBeLessThan(40);
    expect(gap).toBeGreaterThan(4);
  });

  it.each(['ltr', 'rtl'] as const)('%s: 정렬 표지의 간격은 글자 «뒤»(읽는 방향의 시작 쪽) 여백이다', async (dir) => {
    const el = await mount(dir);
    const mark = el.shadowRoot!.querySelector('.sort-indicator') as HTMLElement;
    expect(mark).not.toBeNull();
    expect(getComputedStyle(mark).marginInlineStart).toBe('4px');
  });

  it.each(['ltr', 'rtl'] as const)('%s: 인접한 동작 단추 사이 간격은 읽는 방향의 시작 쪽 여백이다', async (dir) => {
    const el = await mount(dir);
    const second = el.shadowRoot!.querySelectorAll('.row-action')[1] as HTMLElement;
    expect(second).toBeDefined();
    expect(getComputedStyle(second).marginInlineStart).toBe('4px');
  });
});
