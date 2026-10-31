import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/data-view/UDataView';
import '../../src/components/simple-sheet/USimpleSheet';
import '../../src/components/u-rich-table/URichTable';
import '../../src/components/u-record-picker/URecordPicker';
import { clickableNoise } from './clickable.js';

/**
 * A click-type listener on an element outside a handful of roles has NVDA announce «clickable» — on every grid
 * cell and tree row in browse mode (measured). Handlers are heard on the shadow root (`delegate` from
 * `@iyulab/components`); the oracle reads the listeners the browser holds (`clickable.ts`).
 */
type El = HTMLElement & { updateComplete?: Promise<unknown>; [k: string]: unknown };

const make = (tag: string, props: Record<string, unknown>): El => {
  const el = document.createElement(tag) as El;
  Object.assign(el, props);
  return el;
};

const settle = async (box: Element) => {
  for (let i = 0; i < 3; i++) {
    for (const el of box.querySelectorAll('*')) await (el as El).updateComplete;
    await new Promise((r) => setTimeout(r, 50));
  }
};

const noiseOf = async (box: Element) =>
  [...new Set((await clickableNoise(box)).map((n) => `${n.element} (${n.role}) ${n.types.join('+')}`))];

describe('click-type listeners screen readers would announce as «clickable»', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('none on the rendered data components', async () => {
    const box = document.createElement('div');
    const rows = [{ id: 1, name: 'Ann', note: 'x' }, { id: 2, name: 'Bo', note: 'y' }];
    const columns = [{ key: 'name', label: 'Name', sortable: true, description: 'Who' }, { key: 'note', label: 'Note' }];
    box.append(
      make('u-data-view', { data: rows, mode: 'table' }),
      make('u-data-view', { data: rows, mode: 'list' }),
      make('u-simple-sheet', { columns: [{ key: 'name', label: 'Name', editable: true }, { key: 'note', label: 'Note' }], data: rows }),
      make('u-rich-table', { columns, data: rows, rowKey: 'id', selectable: true, layout: 'table' }),
      make('u-rich-table', { columns, data: rows, rowKey: 'id', layout: 'cards' }),
      make('u-record-picker', { label: 'Pick', items: rows, displayKey: 'name' }),
    );
    document.body.appendChild(box);
    await settle(box);

    expect(await noiseOf(box)).toEqual([]);
  }, 60_000);
});
