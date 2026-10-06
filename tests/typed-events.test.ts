// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import '../src/components/u-rich-table/URichTable';
import '../src/components/simple-sheet/USimpleSheet';

/**
 * Listeners on `<u-rich-table>` and `<u-simple-sheet>` get their event maps' detail types. `RichTableEventMap`
 * existed but only the React wrapper used it — a vanilla `addEventListener` got a plain `Event`. The
 * assignments below are the test: `npm run typecheck` fails if the overloads stop applying.
 */
describe('typed events', () => {
  it('u-rich-table listeners get RichTableEventMap details', () => {
    const table = document.createElement('u-rich-table');
    const fields: string[] = [];
    table.addEventListener('sort-change', (e) => {
      const field: string = e.detail.field;
      const direction: 'asc' | 'desc' | null = e.detail.direction;
      void direction;
      fields.push(field);
    });
    table.dispatchEvent(new CustomEvent('sort-change', { detail: { field: 'name', direction: 'asc' } }));
    expect(fields).toEqual(['name']);
  });

  it('u-simple-sheet listeners get SimpleSheetEventMap details — `change` is the custom one, not the native Event', () => {
    const sheet = document.createElement('u-simple-sheet');
    const sizes: number[] = [];
    sheet.addEventListener('change', (e) => {
      const data: string[][] = e.detail.data;
      sizes.push(data.length);
    });
    sheet.addEventListener('paste-rejected', (e) => {
      const cells: Array<{ row: number; col: number }> = e.detail.cells;
      void cells;
    });
    sheet.dispatchEvent(new CustomEvent('change', { detail: { data: [['a'], ['b']] } }));
    expect(sizes).toEqual([2]);
  });
});
