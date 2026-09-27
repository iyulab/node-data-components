// @vitest-environment happy-dom
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import '../src/components/u-rich-table/URichTable';
import type { RowAction } from '../src/components/u-rich-table/types';

/**
 * `rowActions` — docket `#155` ADAPT.
 * 원 요청("row-menu 공개 API 부재")은 재진단하니 실체가 달랐다 — `_onRowMenu` 는
 * 구성 가능한 메뉴가 아니라 `⋯` 버튼 하나가 항상 `row-delete` 만 쏘는 단일 액션이었다
 * (`RowMenuConfig` 같은 내부 개념 자체가 없음). 실제 필요는 "메뉴 노출"이 아니라
 * **액션 셀에 삭제 외 액션을 추가 구성**하는 것이라 판단해 `rowActions` 로 조정했다.
 *
 * 🔴`0.25.0` 부터 동작 칸은 **소비자가 동작을 선언했을 때만** 있다 — `deletable`
 * (내장 삭제 버튼 `⋯`) 또는 `rowActions`(커스텀). 종전에는 `rowActions` 가 없으면 무조건
 * `⋯`(접근 이름 「행 삭제」)를 그려, 삭제를 다루지 않는 읽기 전용 표가 행마다 동작하지 않는
 * 삭제 버튼을 탭 순서에 넣고 있었다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  deletable?: boolean;
  selectable?: boolean;
  data: Record<string, unknown>[];
  rowActions?: RowAction[];
  updateComplete: Promise<unknown>;
};

const mount = async (data: Record<string, unknown>[] = [{ _id: 'r0', name: 'first' }]) => {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = [{ key: 'name', label: 'Name' }];
  el.data = data;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const actionsCell = (el: Table, rowIdx = 0) =>
  el.shadowRoot!.querySelectorAll('tbody tr')[rowIdx].querySelector('.actions-cell') as HTMLElement;
const actionHeaders = (el: Table) => el.shadowRoot!.querySelectorAll('thead th.actions-cell').length;

let table: Table | null = null;
beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { table?.remove(); table = null; document.body.innerHTML = ''; });

describe('URichTable — rowActions', () => {
  it('🔴아무 동작도 선언하지 않으면 동작 칸 자체가 없다 — 머리글·행 모두', async () => {
    const el = table = await mount();
    expect(actionsCell(el)).toBeNull();
    expect(actionHeaders(el)).toBe(0);
    expect(el.shadowRoot!.querySelector('.row-menu'), '「행 삭제」 버튼이 없다').toBeNull();
    // 칸 수가 머리글과 행에서 같다 — colspan 이 없는 칸을 세지 않는다.
    expect(el.shadowRoot!.querySelectorAll('thead th').length)
      .toBe(el.shadowRoot!.querySelectorAll('tbody tr')[0].querySelectorAll('td').length);
  });

  it('빈 데이터 행의 colspan 도 동작 칸을 세지 않는다', async () => {
    const el = table = await mount([]);
    const td = el.shadowRoot!.querySelector('tbody td') as HTMLTableCellElement;
    expect(td.colSpan).toBe(1);
    el.deletable = true;
    await el.updateComplete;
    expect((el.shadowRoot!.querySelector('tbody td') as HTMLTableCellElement).colSpan).toBe(2);
  });

  it('deletable 을 켜면 "⋯" 삭제 버튼이 행 끝에 그려진다', async () => {
    const el = table = await mount();
    el.deletable = true;
    await el.updateComplete;
    const cell = actionsCell(el);
    expect(cell.querySelector('.row-menu')).toBeTruthy();
    expect(cell.querySelector('.row-action')).toBeFalsy();
    expect(actionHeaders(el)).toBe(1);
  });

  it('deletable 속성(attribute)으로도 켜진다', async () => {
    document.body.innerHTML = '<u-rich-table deletable></u-rich-table>';
    const el = table = document.querySelector('u-rich-table') as Table;
    el.columns = [{ key: 'name', label: 'Name' }];
    el.data = [{ _id: 'r0', name: 'first' }];
    await el.updateComplete;
    expect(actionsCell(el).querySelector('.row-menu')).toBeTruthy();
  });

  it('deletable 의 "⋯" 클릭은 row-delete 를 쏜다', async () => {
    const el = table = await mount();
    el.deletable = true;
    await el.updateComplete;
    const handler = vi.fn();
    el.addEventListener('row-delete', handler);

    (actionsCell(el).querySelector('.row-menu') as HTMLElement).click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.row._id).toBe('r0');
  });

  it('rowActions 를 주면 "⋯" 대신 그 목록으로 대체된다', async () => {
    const el = table = await mount();
    el.rowActions = [{ event: 'row-edit', label: 'Edit', icon: '✎' }];
    await el.updateComplete;

    const cell = actionsCell(el);
    expect(cell.querySelector('.row-menu')).toBeFalsy();
    const action = cell.querySelector('.row-action') as HTMLElement;
    expect(action).toBeTruthy();
    expect(action.textContent).toBe('✎');
  });

  it('icon 을 생략하면 label 첫 글자를 쓴다', async () => {
    const el = table = await mount();
    el.rowActions = [{ event: 'row-edit', label: 'Edit' }];
    await el.updateComplete;

    const action = actionsCell(el).querySelector('.row-action') as HTMLElement;
    expect(action.textContent).toBe('E');
  });

  it('각 액션 클릭은 자기 event 이름으로 커스텀 이벤트를 쏜다 — row-delete 로 새지 않는다', async () => {
    const el = table = await mount();
    el.rowActions = [
      { event: 'row-edit', label: 'Edit' },
      { event: 'row-archive', label: 'Archive' },
    ];
    await el.updateComplete;

    const editHandler = vi.fn();
    const archiveHandler = vi.fn();
    const deleteHandler = vi.fn();
    el.addEventListener('row-edit', editHandler);
    el.addEventListener('row-archive', archiveHandler);
    el.addEventListener('row-delete', deleteHandler);

    const actions = actionsCell(el).querySelectorAll('.row-action');
    expect(actions.length).toBe(2);
    (actions[1] as HTMLElement).click();

    expect(archiveHandler).toHaveBeenCalledTimes(1);
    expect(archiveHandler.mock.calls[0][0].detail.row._id).toBe('r0');
    expect(editHandler).not.toHaveBeenCalled();
    expect(deleteHandler).not.toHaveBeenCalled();
  });

  it('bubbles·composed 로 섀도 경계를 넘는다', async () => {
    const el = table = await mount();
    el.rowActions = [{ event: 'row-edit', label: 'Edit' }];
    await el.updateComplete;

    let seenOutsideShadow = false;
    document.addEventListener('row-edit', () => { seenOutsideShadow = true; });
    (actionsCell(el).querySelector('.row-action') as HTMLElement).click();

    expect(seenOutsideShadow).toBe(true);
  });

  it('빈 배열은 «액션 없음» 이다 — 동작 칸이 없다', async () => {
    const el = table = await mount();
    el.rowActions = [];
    await el.updateComplete;

    expect(actionsCell(el)).toBeNull();
  });

  it('rowActions 와 deletable 을 함께 주면 커스텀 액션 뒤에 삭제 버튼이 붙는다', async () => {
    const el = table = await mount();
    el.rowActions = [{ event: 'row-edit', label: 'Edit' }];
    el.deletable = true;
    await el.updateComplete;

    const buttons = [...actionsCell(el).querySelectorAll('button')];
    expect(buttons.map((b) => b.className)).toEqual(['row-action', 'row-menu']);
  });

  it('🔴선택 행의 Delete 키는 deletable 일 때만 row-delete 를 쏜다', async () => {
    const el = table = await mount([{ _id: 'r0', name: 'a' }, { _id: 'r1', name: 'b' }]);
    el.selectable = true;
    await el.updateComplete;
    const handler = vi.fn();
    el.addEventListener('row-delete', handler);

    const press = async () => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
      await el.updateComplete;
      (el.shadowRoot!.querySelectorAll('tbody tr')[0].querySelectorAll('td')[1] as HTMLElement).click();
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    };

    await press();
    expect(handler, '삭제를 선언하지 않은 표').not.toHaveBeenCalled();

    el.deletable = true;
    await el.updateComplete;
    await press();
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
