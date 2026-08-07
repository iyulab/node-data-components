// @vitest-environment happy-dom
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import '../src/components/u-rich-table/URichTable';

/**
 * `row-activate` — 「목록 클릭 → 상세」를 표현할 이벤트가 없었다(소비앱 초안,
 * `ISSUE-data-components-20260807-no-row-activation-event`). `selection-change` 는 체크박스
 * 상호작용 전용이라 대신할 수 없고, `row-expand` 는 그릴 자리(슬롯)가 없다.
 *
 * ## 편집 모드와의 경계가 이 파일의 핵심
 *
 * 셀 **단일 클릭**은 `editable` 열에서도 편집에 들어가지 않는다(진입은 `dblclick` 전용) —
 * 그래서 클릭 경로는 항상 안전하게 활성화를 낼 수 있다. 반면 **`Enter`** 는 `editable` 열에서
 * 이미 "편집 시작"이라는 다른 의미로 선점돼 있으므로, 그 경우에는 `row-activate` 를 내지
 * 않는다 — 초안이 요구한 "편집 모드와 충돌하지 않을 것"을 이 컴포넌트의 실제 클릭/편집
 * 진입 경로에 맞춰 반영한 것이다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string; editable?: boolean }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
};

const mount = async (columns: Table['columns']) => {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = columns;
  el.data = [{ _id: 'r0', name: 'first' }, { _id: 'r1', name: 'second' }];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const cell = (el: Table, rowIdx: number, colIdx = 0) =>
  el.shadowRoot!.querySelectorAll('tbody tr')[rowIdx].querySelectorAll('td')[colIdx] as HTMLElement;

let table: Table | null = null;
beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { table?.remove(); table = null; document.body.innerHTML = ''; });

describe('URichTable — row-activate', () => {
  it('셀 클릭이 row-activate(via: click)를 낸다', async () => {
    const el = table = await mount([{ key: 'name', label: 'Name' }]);
    const handler = vi.fn();
    el.addEventListener('row-activate', handler);

    cell(el, 1).click();
    await el.updateComplete;

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = handler.mock.calls[0][0].detail;
    expect(detail.id).toBe('r1');
    expect(detail.row.name).toBe('second');
    expect(detail.via).toBe('click');
  });

  it('포커스된 비-editable 셀에서 Enter 가 row-activate(via: keyboard)를 낸다', async () => {
    const el = table = await mount([{ key: 'name', label: 'Name' }]);
    const handler = vi.fn();
    el.addEventListener('row-activate', handler);

    cell(el, 0).click(); // 포커스만 — click 경로의 row-activate 1건 발생
    await el.updateComplete;
    handler.mockClear();

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.via).toBe('keyboard');
  });

  it('editable 열에서 Enter 는 편집 진입이지 row-activate 가 아니다 — 충돌하지 않는다', async () => {
    const el = table = await mount([{ key: 'name', label: 'Name', editable: true }]);
    const handler = vi.fn();
    el.addEventListener('row-activate', handler);

    cell(el, 0).click();
    await el.updateComplete;
    handler.mockClear();

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(handler).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector('.cell-edit-input')).toBeTruthy();
  });

  it('editable 열이어도 단일 클릭은 편집에 들어가지 않으므로 row-activate 를 낸다', async () => {
    const el = table = await mount([{ key: 'name', label: 'Name', editable: true }]);
    const handler = vi.fn();
    el.addEventListener('row-activate', handler);

    cell(el, 0).click();
    await el.updateComplete;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(el.shadowRoot!.querySelector('.cell-edit-input')).toBeFalsy();
  });

  it('selectable 과 독립이다 — 체크박스 클릭은 row-activate 를 내지 않는다', async () => {
    const el = table = await mount([{ key: 'name', label: 'Name' }]);
    el.setAttribute('selectable', '');
    await el.updateComplete;
    const handler = vi.fn();
    el.addEventListener('row-activate', handler);

    const box = el.shadowRoot!.querySelector('tbody .checkbox-cell input[type=checkbox]') as HTMLInputElement;
    box.click();
    await el.updateComplete;

    expect(handler).not.toHaveBeenCalled();
  });

  it('bubbles·composed 로 섀도 경계를 넘는다', async () => {
    const el = table = await mount([{ key: 'name', label: 'Name' }]);
    let seenOutsideShadow = false;
    document.addEventListener('row-activate', () => { seenOutsideShadow = true; });

    cell(el, 0).click();
    await el.updateComplete;

    expect(seenOutsideShadow).toBe(true);
  });
});
