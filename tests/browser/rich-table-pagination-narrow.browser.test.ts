import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * **좁은 호스트에서 페이지네이션 줄이 무너지지 않는다.**
 *
 * `.pagination` 은 한 줄 flex 이고 페이지 버튼 묶음(◀ 1 2 3 ▶ + 행 수 select)은 줄어들 수 없다.
 * 호스트가 좁아지면(폰) 줄어들 수 있는 유일한 자식인 «Showing 1-5 of 12» 문구가 수 픽셀 폭까지
 * 눌려 **글자 단위로 줄바꿈**된다 — 호스트가 shadow 경계를 가져 소비자 CSS 로는 닿을 수 없다.
 *
 * ## 왜 브라우저인가
 *
 * 줄바꿈은 계산된 레이아웃으로만 갈린다. jsdom 은 박스를 계산하지 않는다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string; width?: string }[];
  data: Record<string, unknown>[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  updateComplete: Promise<boolean>;
};

let host: HTMLDivElement;

async function mount(hostWidth: string): Promise<Table> {
  host.style.width = hostWidth;
  const el = document.createElement('u-rich-table') as Table;
  el.columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', width: '160px' },
  ];
  el.data = Array.from({ length: 5 }, (_, i) => ({ id: `R${i}`, name: `row ${i}` }));
  el.totalCount = 12;
  el.pageSize = 5;
  el.currentPage = 1;
  host.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return el;
}

const part = (el: Table, sel: string) => el.shadowRoot!.querySelector(sel) as HTMLElement;

describe('u-rich-table — 좁은 호스트의 페이지네이션', () => {
  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });
  afterEach(() => host.remove());

  for (const width of ['275px', '200px']) {
    it(`${width}: 페이지 문구가 글자 단위로 접히지 않는다(두 줄 이하)`, async () => {
      const el = await mount(width);
      const info = part(el, '.pagination > span');
      const lineHeight = parseFloat(getComputedStyle(info).lineHeight) || parseFloat(getComputedStyle(info).fontSize) * 1.4;
      expect(info.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 2 + 1);
    });

    it(`${width}: 페이지네이션 줄이 호스트 밖으로 넘치지 않는다`, async () => {
      const el = await mount(width);
      const bar = part(el, '.pagination');
      expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth + 1);
    });
  }

  it('넓은 호스트에서는 한 줄 그대로다(문구 좌·버튼 우)', async () => {
    const el = await mount('900px');
    const info = part(el, '.pagination > span').getBoundingClientRect();
    const buttons = part(el, '.page-buttons').getBoundingClientRect();
    expect(Math.abs(info.top - buttons.top)).toBeLessThan(20); // 같은 줄
    expect(buttons.left).toBeGreaterThan(info.right);
  });
});
