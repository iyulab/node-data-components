// @vitest-environment happy-dom
import { describe, it, afterEach, expect } from 'vitest';
import '../src/components/u-rich-table/URichTable';
import { effectiveAlign, type ColumnDef } from '../src/components/u-rich-table/types';

/**
 * 열 정렬 어휘 — flex-table 과 같은 말을 쓴다(cycle-766, `DL-765-1`).
 *
 * 머리글은 값을 따른다: 오른쪽 정렬 숫자 위에 왼쪽 머리글이 얹히면 열이 넓을수록 머리글이
 * 옆 열의 것처럼 읽힌다(소비자 실측 — 한 열 안에서 60px 어긋남). 기본값은 셀의 실효 정렬이고,
 * `number` 열은 끝 정렬이 기본이다.
 */

type Table = HTMLElement & { columns: ColumnDef[]; data: Record<string, unknown>[]; updateComplete: Promise<unknown> };

let table: Table | null = null;
afterEach(() => { table?.remove(); table = null; document.body.innerHTML = ''; });

const mount = async (columns: ColumnDef[]) => {
  table = document.createElement('u-rich-table') as Table;
  table.columns = columns;
  table.data = [Object.fromEntries(columns.map(c => [c.key, c.type === 'number' ? 1 : 'x']))];
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
};

const textAlign = (el: Element) => (el as HTMLElement).style.textAlign || 'start';

describe('u-rich-table column alignment', () => {
  it('cells: align, else end for numbers, else start — headers follow unless headerAlign says otherwise', async () => {
    const el = await mount([
      { key: 'name', label: 'Name' },
      { key: 'qty', label: 'Qty', type: 'number' },
      { key: 'code', label: 'Code', align: 'center' },
      { key: 'amount', label: 'Amount', type: 'number', headerAlign: 'start' },
    ]);
    const tds = [...el.shadowRoot!.querySelectorAll('tbody tr:first-child td')].slice(-4);
    const ths = [...el.shadowRoot!.querySelectorAll('thead tr:first-child th')].slice(-4);
    expect(tds.map(textAlign)).toEqual(['start', 'end', 'center', 'end']);
    expect(ths.map(textAlign)).toEqual(['start', 'end', 'center', 'start']);
  });

  it('a numeric width is pixels', async () => {
    const el = await mount([{ key: 'a', label: 'A', width: 120 }, { key: 'b', label: 'B', width: '8rem' }]);
    const ths = [...el.shadowRoot!.querySelectorAll('thead tr:first-child th')].slice(-2) as HTMLElement[];
    expect(ths.map(th => th.style.width)).toEqual(['120px', '8rem']);
  });

  it('effectiveAlign — align wins over the number default', () => {
    expect(effectiveAlign({ type: 'number' })).toBe('end');
    expect(effectiveAlign({ type: 'number', align: 'start' })).toBe('start');
    expect(effectiveAlign({})).toBe('start');
  });
});
