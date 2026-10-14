import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * 툴바·선택 영역의 바깥 손잡이 — `::part` 와 `:state(selected)`.
 *
 * 표가 자기 툴바(건수 · 일괄 동작)를 그리므로, 그것을 칠하는 길은 part 와 «선택이 있다» 는 상태뿐이다. 종전에는
 * 섀도 클래스(`.toolbar` · `.selection-bar`)만 있어 바깥 시트가 선택 상태의 툴바(일괄 동작 막대)를 구별해 칠할 수 없었다.
 *
 * 브라우저인 이유: 재는 것이 «바깥 시트의 `::part` · `:state()` 규칙이 실제로 그 상자에 닿는가» 다 — 선택자 일치는
 * 브라우저만 답한다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
  setSelection(ids: Iterable<string>): void;
  clearSelection(): void;
};

const TINT = 'rgb(1, 2, 3)';
const sheet = document.createElement('style');
sheet.textContent = `
  u-rich-table:state(selected)::part(toolbar),
  u-rich-table:state(selected)::part(selection-bar) { background-color: ${TINT}; }
  u-rich-table::part(selection-info) { font-weight: 700; }
`;

const mount = async (withToolbarContent: boolean) => {
  document.head.appendChild(sheet);
  const el = document.createElement('u-rich-table') as Table;
  el.setAttribute('selectable', '');
  el.columns = [{ key: 'name', label: 'Name' }];
  el.data = [{ _id: 'a', name: 'A' }, { _id: 'b', name: 'B' }];
  if (withToolbarContent) {
    const end = document.createElement('button');
    end.slot = 'toolbar-end';
    end.textContent = 'Export';
    el.appendChild(end);
  }
  document.body.appendChild(el);
  await el.updateComplete;
  await el.updateComplete;
  return el;
};

const part = (el: Table, name: string) => el.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`);

afterEach(() => {
  document.body.innerHTML = '';
  sheet.remove();
});

describe('u-rich-table — toolbar parts and the selected state', () => {
  it('a toolbar with other content: part="toolbar" carries the selected state from the host', async () => {
    const el = await mount(true);
    const toolbar = part(el, 'toolbar');
    expect(toolbar).not.toBeNull();
    expect(el.matches(':state(selected)')).toBe(false);
    expect(getComputedStyle(toolbar!).backgroundColor).not.toBe(TINT);

    el.setSelection(['a']);
    await el.updateComplete;
    expect(el.matches(':state(selected)')).toBe(true);
    expect(getComputedStyle(toolbar!).backgroundColor).toBe(TINT);

    el.clearSelection();
    await el.updateComplete;
    expect(el.matches(':state(selected)')).toBe(false);
    expect(getComputedStyle(toolbar!).backgroundColor).not.toBe(TINT);
  });

  it('the count and the bulk actions are parts of their own', async () => {
    const el = await mount(true);
    el.setSelection(['a', 'b']);
    await el.updateComplete;
    const info = part(el, 'selection-info');
    expect(info).not.toBeNull();
    expect(getComputedStyle(info!).fontWeight).toBe('700');
    expect(part(el, 'bulk-actions')).not.toBeNull();
  });

  it('hide-toolbar: neither the toolbar nor the selection bar is drawn — the host shows the selection', async () => {
    const el = await mount(true);
    el.setAttribute('hide-toolbar', '');
    el.setSelection(['a']);
    await el.updateComplete;
    expect(part(el, 'toolbar')).toBeNull();
    expect(part(el, 'selection-bar')).toBeNull();
    expect(el.matches(':state(selected)')).toBe(true);

    const bare = await mount(false);
    bare.setAttribute('hide-toolbar', '');
    bare.setSelection(['b']);
    await bare.updateComplete;
    expect(part(bare, 'selection-bar')).toBeNull();
  });

  it('a table with nothing else in the toolbar: the bar below the rows is part="selection-bar"', async () => {
    const el = await mount(false);
    expect(part(el, 'selection-bar')).toBeNull();
    el.setSelection(['b']);
    await el.updateComplete;
    const bar = part(el, 'selection-bar');
    expect(bar).not.toBeNull();
    expect(getComputedStyle(bar!).backgroundColor).toBe(TINT);
  });
});
