// src/components/u-rich-table/utils/clipboard.ts
import type { ColumnDef } from '../types.js';

/**
 * 탭/줄바꿈 구분 텍스트(TSV)를 파싱하여 행 배열로 반환
 */
export function parseTSV(text: string, columns: ColumnDef[]): Record<string, unknown>[] {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const cells = line.split('\t');
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      if (i < cells.length) {
        const raw = cells[i].trim();
        if (col.clipboardParse) {
          row[col.key] = col.clipboardParse(raw);
        } else if (col.type === 'number') {
          row[col.key] = Number(raw.replace(/,/g, '')) || 0;
        } else {
          row[col.key] = raw;
        }
      }
    });
    return row;
  });
}

/**
 * 행 배열을 탭/줄바꿈 구분 텍스트(TSV)로 변환
 */
export function toTSV(rows: Record<string, unknown>[], columns: ColumnDef[]): string {
  const header = columns.map(c => c.label).join('\t');
  const body = rows.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (col.clipboardFormat) return col.clipboardFormat(value);
      return String(value ?? '');
    }).join('\t')
  ).join('\n');
  return `${header}\n${body}`;
}
