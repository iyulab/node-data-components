// @vitest-environment happy-dom
import { describe, it, afterEach, expect } from 'vitest';
import { Locale } from '@iyulab/components';
import '../src/components/u-rich-table/URichTable';

/**
 * 표 안의 폼 컨트롤 이름.
 *
 * 필터 입력은 placeholder(«Filter…») 뿐이라 열마다 같은 말로 들렸고(어느 열의 필터인지 모른다), 셀 편집기
 * (input · select · 날짜)와 새 행 입력은 이름이 없었다. 이름은 열 머리글에서 온다 — 그리드 셀의 이름이 그것이듯.
 */

type Table = HTMLElement & {
  columns: unknown[]; data: Record<string, unknown>[]; filterable: boolean; addable: boolean; editable: boolean;
  updateComplete: Promise<unknown>;
};

let table: Table | null = null;
afterEach(() => { table?.remove(); table = null; Locale.set('en'); });

const mount = async () => {
  table = document.createElement('u-rich-table') as Table;
  table.filterable = true;
  table.addable = true;
  table.editable = true;
  table.columns = [
    { key: 'name', label: 'Name', filterable: true, editable: true },
    { key: 'state', label: 'State', filterable: true, filterType: 'select', type: 'select', editable: true,
      options: [{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }] },
    { key: 'due', label: 'Due', type: 'date', editable: true },
  ];
  table.data = [{ _id: 1, name: 'a', state: 'open', due: '2026-10-06' }];
  document.body.appendChild(table);
  await table.updateComplete;
  return table.shadowRoot!;
};

const edit = async (root: ShadowRoot, col: number) => {
  root.querySelector<HTMLElement>(`td[data-cell][data-row="0"][data-col="${col}"]`)!
    .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
  await table!.updateComplete;
  return root.querySelector<HTMLElement>('.cell-edit-input')!;
};

describe('u-rich-table form-control names', () => {
  it('each filter control names its column', async () => {
    const root = await mount();
    const filters = [...root.querySelectorAll('tr.filter-row :is(input, select)')];
    expect(filters.map(f => f.getAttribute('aria-label'))).toEqual(['Filter Name', 'Filter State']);
  });

  it('cell editors are named by the column header', async () => {
    const root = await mount();
    expect((await edit(root, 0)).getAttribute('aria-label')).toBe('Name');
    expect((await edit(root, 1)).getAttribute('aria-label')).toBe('State');
    const picker = await edit(root, 2) as HTMLElement & { updateComplete: Promise<unknown> };
    expect(picker.localName).toBe('u-date-picker');
    await picker.updateComplete;
    // 날짜 편집기는 호스트의 이름을 안쪽 텍스트 상자로 옮긴다(components 의 폼 컨트롤 규약).
    expect(picker.shadowRoot!.querySelector('input')!.getAttribute('aria-label')).toBe('Due');
  });

  it('new-row inputs say which column they fill, and follow the locale', async () => {
    Locale.set('ko');
    const root = await mount();
    const inputs = [...root.querySelectorAll('tr.new-row input')];
    expect(inputs.map(i => i.getAttribute('aria-label'))).toEqual(['새 행: Name', '새 행: State', '새 행: Due']);
    expect(root.querySelector('tr.filter-row input')!.getAttribute('aria-label')).toBe('Name 필터');
  });
});
