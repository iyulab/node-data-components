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
 * `rowActions` 를 주지 않으면 종전 단일 "⋯" → `row-delete` 동작 그대로다(하위호환) —
 * 그 계약은 이 파일이 아니라 `rich-table-clipboard-error.test.ts` 등 기존 스위트가
 * 이미 감시하지 않으므로, 첫 두 테스트가 그 회귀 방지 역할까지 겸한다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string }[];
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

let table: Table | null = null;
beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { table?.remove(); table = null; document.body.innerHTML = ''; });

describe('URichTable — rowActions', () => {
  it('하위호환 — rowActions 를 주지 않으면 종전대로 단일 "⋯" 버튼이 렌더된다', async () => {
    const el = table = await mount();
    const cell = actionsCell(el);
    expect(cell.querySelector('.row-menu')).toBeTruthy();
    expect(cell.querySelector('.row-action')).toBeFalsy();
  });

  it('하위호환 — rowActions 없이 "⋯" 클릭은 여전히 row-delete 를 쏜다', async () => {
    const el = table = await mount();
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

  it('빈 배열은 "액션 없음"이 아니라 기본 동작(row-menu)으로 폴백한다', async () => {
    const el = table = await mount();
    el.rowActions = [];
    await el.updateComplete;

    expect(actionsCell(el).querySelector('.row-menu')).toBeTruthy();
  });
});
