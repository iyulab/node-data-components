import { describe, it, afterEach, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/simple-sheet/USimpleSheet';
import { axActive, axFirst } from './ax';

/**
 * `u-simple-sheet` — 보조기기가 «받는» 것. 키보드 시험은 `aria-activedescendant` 가 활성 셀의 id 를 가리키는지(우리가
 * 쓴 것)를 재고, 이 파일은 Chromium 접근성 트리(`./ax.ts`)가 그 참조를 풀어 **활성 셀을 현재 노드로 내놓는가**(브라우저가
 * 노출한 것)를 잰다. id 참조는 같은 트리 범위에서만 풀리므로, 포커스 보유 요소와 셀이 다른 섀도에 있으면 속성은 맞아도
 * 노출은 비어 있다 — 형제 flex-table 이 그 이유로 로빙 포커스를 택했다.
 */

type Sheet = HTMLElement & { data: string[][]; rows: number; cols: number; updateComplete: Promise<unknown> };

const mount = async () => {
  const el = document.createElement('u-simple-sheet') as Sheet;
  el.rows = 6;
  el.cols = 3;
  el.data = Array.from({ length: 6 }, (_, r) => Array.from({ length: 3 }, (_, c) => `r${r}c${c}`));
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const cell = (el: Sheet, row: number, col: number) =>
  el.shadowRoot!.querySelector<HTMLElement>(`td.cell[data-row="${row}"][data-col="${col}"]`)!;

const press = async (el: Sheet, keys: string) => {
  await userEvent.keyboard(keys);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 40));
};

afterEach(() => document.body.replaceChildren());

describe('u-simple-sheet — accessibility tree', () => {
  it('the grid is exposed with its name', async () => {
    await mount();
    expect(await axFirst('grid')).toMatchObject({ role: 'grid', name: 'Spreadsheet' });
  });

  it('the current node is the active cell and follows the arrows', async () => {
    const el = await mount();
    await userEvent.click(cell(el, 1, 0));
    await press(el, '{ArrowRight}');
    expect(await axActive()).toMatchObject({ role: 'gridcell', name: 'r1c1', props: { selected: true } });
    await press(el, '{ArrowDown}');
    expect(await axActive()).toMatchObject({ role: 'gridcell', name: 'r2c1' });
  });

  it('while editing the current node is the editor, not the cell', async () => {
    const el = await mount();
    await userEvent.click(cell(el, 2, 2));
    await press(el, '{F2}');
    const node = await axActive();
    expect(node?.role).not.toBe('gridcell');
    expect(node?.props.focused).toBe(true);
  });
});
