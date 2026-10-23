import { describe, it, afterEach, expect } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * 상태 문구(빈 상태 · 오류 · 불러오는 중)는 행 영역의 «보이는» 폭 가운데에 선다 — 열 합계가 표보다 넓어 가로로 넘치는 표에서
 * 열 전체 폭의 가운데는 보이는 영역의 오른쪽 끝이나 그 밖이었다(15열 · 1,900px 를 1,130px 에 두면 오른쪽 끝). 가로로 굴려도 그
 * 자리에 머문다. NEGATIVE: 넘치지 않는 표에서는 종전처럼 표 폭의 가운데다.
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  error?: Error | null;
  loading: boolean;
  updateComplete: Promise<unknown>;
};

afterEach(() => { document.body.replaceChildren(); });

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

async function mount(columns: number, width = 600): Promise<{ el: Table; wrap: HTMLElement }> {
  const el = document.createElement('u-rich-table') as unknown as Table;
  el.style.width = `${width}px`;
  el.columns = Array.from({ length: columns }, (_, i) => ({ key: `c${i}`, label: `Column ${i}`, width: '150px' }));
  el.data = [];
  document.body.appendChild(el);
  await el.updateComplete;
  await frame();
  return { el, wrap: el.shadowRoot!.querySelector('.table-wrap') as HTMLElement };
}

/** 문구 글자의 가운데가 보이는 영역 가운데에서 얼마나 떨어져 있는가(px). */
function offCentre(el: Table, wrap: HTMLElement, selector: string): number {
  const msg = el.shadowRoot!.querySelector(selector) as HTMLElement;
  const range = document.createRange();
  range.selectNodeContents(msg);
  const text = range.getBoundingClientRect();
  const view = wrap.getBoundingClientRect();
  const visibleCentre = view.left + wrap.clientWidth / 2;
  return Math.abs(text.left + text.width / 2 - visibleCentre);
}

describe('u-rich-table — state message in the visible area', () => {
  it('🔴empty: a table wider than its box centres the message in what is visible', async () => {
    const { el, wrap } = await mount(15);
    expect(wrap.scrollWidth).toBeGreaterThan(wrap.clientWidth * 2);
    expect(offCentre(el, wrap, '.empty-message')).toBeLessThan(2);
  });

  it('🔴empty: scrolled to the far right, the message is still centred in view', async () => {
    const { el, wrap } = await mount(15);
    wrap.scrollLeft = wrap.scrollWidth;
    await frame();
    expect(wrap.scrollLeft).toBeGreaterThan(0);
    expect(offCentre(el, wrap, '.empty-message')).toBeLessThan(2);
  });

  it('🔴error and loading take the same place', async () => {
    const { el, wrap } = await mount(15);
    el.error = new Error('Server unavailable');
    await el.updateComplete;
    await frame();
    expect(offCentre(el, wrap, '.error-message')).toBeLessThan(2);
    el.error = null;
    el.loading = true;
    await el.updateComplete;
    await frame();
    expect(offCentre(el, wrap, '.loading-overlay')).toBeLessThan(2);
  });

  it('follows the box when it is resized', async () => {
    const { el, wrap } = await mount(15);
    el.style.width = '900px';
    await frame();
    await frame();
    expect(offCentre(el, wrap, '.empty-message')).toBeLessThan(2);
  });

  it('NEGATIVE: a table that fits centres the message across the table as before', async () => {
    const { el, wrap } = await mount(2);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
    expect(offCentre(el, wrap, '.empty-message')).toBeLessThan(2);
  });
});
