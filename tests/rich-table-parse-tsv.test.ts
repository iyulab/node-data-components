import { describe, it, expect, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import { parseTSV } from '../src/components/u-rich-table/utils/clipboard.js';
import type { ColumnDef } from '../src/components/u-rich-table/types.js';

/**
 * 붙여넣은 숫자 열은 앱 로케일로 읽는다 — 로케일 스프레드시트에서 복사한 `1,5` 는 1.5 다.
 * 결함: 쉼표를 전부 묶음으로 지워 `1,5` 가 15 가 됐고, 수가 아닌 칸은 조용히 0 이 됐다.
 */
const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'qty', label: 'Qty', type: 'number' },
];

afterEach(() => Locale.set('en'));

describe('parseTSV — number columns', () => {
  it('🔴reads a decimal comma in the app locale (de: 1,5 → 1.5, not 15)', () => {
    Locale.set('de');
    expect(parseTSV('a\t1,5\nb\t1.234,5', COLUMNS)).toEqual([
      { name: 'a', qty: 1.5 },
      { name: 'b', qty: 1234.5 },
    ]);
  });

  it('reads grouping in a dot-decimal locale (en: 1,234 → 1234)', () => {
    Locale.set('en');
    expect(parseTSV('a\t1,234\nb\t2.5', COLUMNS)).toEqual([
      { name: 'a', qty: 1234 },
      { name: 'b', qty: 2.5 },
    ]);
  });

  it('🔴a cell that is not a number, or empty, is null — not a made-up 0', () => {
    expect(parseTSV('a\tabc\nb\t', COLUMNS)).toEqual([
      { name: 'a', qty: null },
      { name: 'b', qty: null },
    ]);
  });

  it('⚪NEGATIVE — a column with clipboardParse keeps its own reading', () => {
    const cols: ColumnDef[] = [{ key: 'qty', label: 'Qty', type: 'number', clipboardParse: v => `raw:${v}` }];
    expect(parseTSV('1,5', cols)).toEqual([{ qty: 'raw:1,5' }]);
  });
});
