// src/components/u-rich-table/utils/column-layout.ts
import type { ColumnDef } from '../types.js';

/** 표가 스스로 그리는 열의 폭(px) — 스타일과 하한 합계가 같은 값을 읽는다. */
export const SPECIAL_COLUMN_PX = { checkbox: 40, expand: 30, actions: 60 } as const;

/** 숫자는 px, 문자열은 CSS 길이 그대로 — flex-table 과 같은 어휘. */
export const cssLength = (w: number | string | undefined): string => (typeof w === 'number' ? `${w}px` : w ?? '');

const ABSOLUTE = /^\s*\d+(\.\d+)?(px|rem|em|ch|pt|pc|cm|mm|in|Q)\s*$/;
const isAbsolute = (w: number | string | undefined): boolean =>
  typeof w === 'number' ? w > 0 : typeof w === 'string' && ABSOLUTE.test(w);

export interface ColumnLayout {
  /** `table-layout: fixed` 로 선언한 폭을 지킬 수 있는가. */
  fixed: boolean;
  /** 유연 열이 바닥 아래로 눌리지 않도록 표에 거는 하한(`min-width`) — 유연 열이 있을 때만. */
  minTableWidth?: string;
}

/**
 * 열 배치 판정.
 *
 * 🔴**`fixed` 는 폭이 없는 열에 «남는 폭» 만 준다 — 남는 폭이 없으면 0 이다**(실측: 17열 중 8열만
 * 선언한 표에서 나머지 8열이 사라졌다). 그래서 고정 모드는 **모든 열이 절대 길이를 알 때**만 켠다:
 * 절대 `width` 를 가졌거나, `width` 없이 절대 `minWidth`(바닥)를 가진 **유연 열**이거나.
 *
 * 유연 열이 있으면 표에 `min-width` = Σ고정 폭 + 유연 열 수 × 가장 큰 바닥 을 건다. 남는 폭은
 * 유연 열끼리 **똑같이** 나뉘므로(브라우저 규칙), 가장 큰 바닥으로 곱해야 어느 유연 열도 자기
 * 바닥 아래로 내려가지 않는다 — 좁은 화면에서는 그 하한이 컨테이너를 넘어 행 영역이 스크롤한다.
 *
 * ⚠퍼센트 폭은 고정 모드에서 제외한다 — 컨테이너 기준이라 «합이 넘친다» 가 성립하지 않고 표가
 * 컨테이너에 갇혀 가로 스크롤이 사라진다(실측). 그런 표는 종전대로 `auto` 다.
 */
export function columnLayout(
  columns: readonly Pick<ColumnDef, 'width' | 'minWidth'>[],
  special: { checkbox?: boolean; expand?: boolean; actions?: boolean } = {},
): ColumnLayout {
  if (columns.length === 0) return { fixed: false };
  const fixedParts: string[] = [];
  const floors: string[] = [];
  for (const c of columns) {
    if (c.width != null) {
      if (!isAbsolute(c.width)) return { fixed: false };
      fixedParts.push(c.minWidth != null && isAbsolute(c.minWidth) ? `max(${cssLength(c.width)}, ${cssLength(c.minWidth)})` : cssLength(c.width));
    } else if (c.minWidth != null && isAbsolute(c.minWidth)) {
      floors.push(cssLength(c.minWidth));
    } else {
      return { fixed: false };
    }
  }
  if (floors.length === 0) return { fixed: true };
  for (const [key, on] of Object.entries(special)) {
    if (on) fixedParts.push(`${SPECIAL_COLUMN_PX[key as keyof typeof SPECIAL_COLUMN_PX]}px`);
  }
  const maxFloor = floors.length === 1 ? floors[0] : `max(${floors.join(', ')})`;
  return { fixed: true, minTableWidth: `calc(${[...fixedParts, `${floors.length} * ${maxFloor}`].join(' + ')})` };
}

/** 머리 칸의 폭 — 고정 폭 열만. 유연 열은 폭을 쓰지 않는다(남는 폭을 받는다). */
export function headerWidth(c: Pick<ColumnDef, 'width' | 'minWidth'>): string {
  if (c.width == null) return '';
  return c.minWidth != null && isAbsolute(c.width) && isAbsolute(c.minWidth)
    ? `max(${cssLength(c.width)}, ${cssLength(c.minWidth)})`
    : cssLength(c.width);
}
