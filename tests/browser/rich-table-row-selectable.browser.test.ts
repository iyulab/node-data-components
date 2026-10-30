import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';
import type { URichTable } from '../../src/components/u-rich-table/URichTable';

/**
 * `selectable` 이 행의 함수 — 고를 수 없는 행(이미 출고된 건, 잠긴 건)을 표가 안다. 열의 `editable` 과 같은 모양.
 *
 * 계기: «검색 결과에서 담기 → 요청서» 흐름. 키(`rowKey`)를 준 선택은 검색을 바꿔도 유지돼 담기의 바탕이 되는데,
 * 출고 중인 건철을 못 고르게 할 수단이 없어 앱이 `selection-change` 를 받아 되돌리고 알려야 했다(체크가 켜졌다 꺼진다).
 *
 * 함께 고친 결함: 행 체크박스의 Shift 클릭이 범위를 담은 직후 체크박스 기본 토글(`change`)이 끝 행을 다시 해제해, 범위의
 * 끝 행이 늘 빠졌다. 그리고 범위의 기준점은 칸 클릭으로만 잡혔다(체크박스로 고른 행은 기준점이 되지 않았다).
 */
const ROWS = [
  { _id: 'a', name: 'Alpha', status: 'stored' },
  { _id: 'b', name: 'Bravo', status: 'shipped' },
  { _id: 'c', name: 'Charlie', status: 'stored' },
];

let el: URichTable;
afterEach(() => el?.remove());

async function mount() {
  el = document.createElement('u-rich-table') as URichTable;
  el.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
  el.columns = [{ key: 'name', label: 'Name' }];
  el.selectable = (row) => row.status !== 'shipped';
  el.data = ROWS;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const rowBoxes = () => [...el.shadowRoot!.querySelectorAll('tbody .checkbox-cell input[type=checkbox]')] as HTMLInputElement[];
const headBox = () => el.shadowRoot!.querySelector('thead .checkbox-cell input[type=checkbox]') as HTMLInputElement;

describe('u-rich-table — selectable per row', () => {
  it('고를 수 없는 행의 체크박스는 꺼져 있고 눌러도 고르지 않는다', async () => {
    await mount();
    expect(rowBoxes().map((b) => b.disabled)).toEqual([false, true, false]);
    await userEvent.click(rowBoxes()[1], { force: true });
    expect([...el.selectedRowIds]).toEqual([]);
  });

  it('페이지 전체 선택은 고를 수 있는 행만 담고, 그 행들이 다 골라지면 머리 체크가 켜진다', async () => {
    await mount();
    await userEvent.click(headBox());
    await el.updateComplete;
    expect([...el.selectedRowIds].sort()).toEqual(['a', 'c']);
    expect(headBox().checked).toBe(true);
    expect(headBox().indeterminate).toBe(false);
  });

  it('Shift 범위 선택은 사이의 고를 수 없는 행을 건너뛴다', async () => {
    await mount();
    // 범위의 기준점은 칸 클릭이 정한다(첫 행) — 그다음 Shift 를 실은 체크박스 클릭으로 셋째 행까지(사이의 둘째 행은 고를 수 없다).
    await userEvent.click(el.shadowRoot!.querySelector('tbody tr td:not(.checkbox-cell)') as HTMLElement);
    rowBoxes()[2].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, shiftKey: true }));
    await el.updateComplete;
    expect([...el.selectedRowIds].sort()).toEqual(['a', 'c']);
    expect(el.selectedRowIds.has('b')).toBe(false);
  });

  it('Shift 범위의 끝 행도 담긴다 — 체크박스 기준점에서 시작해도', async () => {
    el = document.createElement('u-rich-table') as URichTable;
    el.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
    el.columns = [{ key: 'name', label: 'Name' }];
    el.selectable = true;
    el.data = ROWS;
    document.body.appendChild(el);
    await el.updateComplete;
    await userEvent.click(rowBoxes()[0]);
    rowBoxes()[2].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, shiftKey: true }));
    await el.updateComplete;
    expect([...el.selectedRowIds].sort()).toEqual(['a', 'b', 'c']);
  });

  it('NEGATIVE: 불리언 selectable 은 종전대로 모든 행을 고른다', async () => {
    await mount();
    el.selectable = true;
    await el.updateComplete;
    expect(rowBoxes().every((b) => !b.disabled)).toBe(true);
    await userEvent.click(headBox());
    expect([...el.selectedRowIds].sort()).toEqual(['a', 'b', 'c']);
  });
});
