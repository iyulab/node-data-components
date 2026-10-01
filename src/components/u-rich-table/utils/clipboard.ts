// src/components/u-rich-table/utils/clipboard.ts
import { encodeTsv, decodeTsv } from '@iyulab/components/dist/utilities/tsv.js';
import { parseNumber } from '@iyulab/components/dist/utilities/format.js';
import type { ColumnDef } from '../types.js';

/**
 * 스프레드시트 클립보드 텍스트(TSV — 인용 규칙은 `decodeTsv`)를 파싱하여 행 배열로 반환.
 *
 * `type: 'number'` 열은 `parseNumber` 로 앱 로케일에 맞춰 읽고, 수가 아니거나 빈 칸은 `null` 이다.
 *
 * 첫 행이 이 표의 열 머리글과 같으면(이 표에서 복사한 텍스트 — `toTSV` 가 머리글을 싣는다) 데이터로
 * 읽지 않는다.
 */
export function parseTSV(text: string, columns: ColumnDef[]): Record<string, unknown>[] {
  let lines = decodeTsv(text);
  const first = lines[0];
  if (first && columns.length > 0 && columns.every((col, i) => first[i]?.trim() === col.label)) {
    lines = lines.slice(1);
  }
  return lines.map(cells => {
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      if (i < cells.length) {
        const raw = cells[i].trim();
        if (col.clipboardParse) {
          row[col.key] = col.clipboardParse(raw);
        } else if (col.type === 'number') {
          // 앱 로케일로 읽는다(`1,5` 는 1.5). 수가 아니거나 빈 칸은 null — 지어낸 0 이 아니다.
          row[col.key] = raw === '' ? null : parseNumber(raw);
        } else {
          row[col.key] = raw;
        }
      }
    });
    return row;
  });
}

/**
 * 행 배열을 스프레드시트 클립보드 텍스트(TSV)로 변환 — 첫 행은 열 머리글.
 * 탭·줄바꿈·따옴표가 든 셀은 인용되어 스프레드시트에 한 셀로 붙는다(`encodeTsv`).
 */
export function toTSV(rows: Record<string, unknown>[], columns: ColumnDef[]): string {
  return encodeTsv([
    columns.map(c => c.label),
    ...rows.map(row =>
      columns.map(col => {
        const value = row[col.key];
        if (col.clipboardFormat) return col.clipboardFormat(value);
        return String(value ?? '');
      }),
    ),
  ]);
}
