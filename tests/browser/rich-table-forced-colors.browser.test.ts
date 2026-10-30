/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterAll } from 'vitest';
import { cdp, page } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * **강제 색 모드(Windows 고대비)에서도 선택한 행이 구분된다** — 픽셀로 잰다. 강제 색 모드는 행 배경색을 시스템 색으로
 * 덮으므로, 선택을 배경으로만 그리면 선택 행과 아닌 행이 같은 화면이 된다. 선택 전후로 그 행 상자의 픽셀이 다른지 잰다.
 */
type Table = HTMLElement & { columns: unknown[]; data: unknown[]; totalCount: number; selectable: boolean; updateComplete: Promise<unknown> };

async function forcedColors(active: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: active ? 'active' : 'none' }] });
  await new Promise((r) => setTimeout(r, 50));
}

async function shot() {
  const raw = (await page.screenshot({ save: false, base64: true } as never)) as unknown as { base64: string } | string;
  const base64 = typeof raw === 'string' ? raw : raw.base64;
  const img = new Image();
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = `data:image/png;base64,${base64}`; });
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return { data: ctx.getImageData(0, 0, img.width, img.height).data, width: img.width, scale: img.width / window.innerWidth };
}

function regionDiff(a: Awaited<ReturnType<typeof shot>>, b: Awaited<ReturnType<typeof shot>>, r: DOMRect): number {
  const s = a.scale;
  let diff = 0;
  for (let y = Math.floor(r.top * s); y < Math.ceil(r.bottom * s); y++) {
    for (let x = Math.floor(r.left * s); x < Math.ceil(r.right * s); x++) {
      const i = (y * a.width + x) * 4;
      if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 60) diff++;
    }
  }
  return diff;
}

afterAll(() => forcedColors(false));

async function measure(forced: boolean): Promise<number> {
  document.body.replaceChildren();
  window.scrollTo(0, 0);
  const el = document.createElement('u-rich-table') as Table;
  el.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
  el.selectable = true;
  el.columns = [{ key: 'name', label: '이름' }];
  el.data = [{ _id: 1, name: '홍길동' }, { _id: 2, name: '김철수' }];
  el.totalCount = 2;
  el.style.cssText = 'display:block;width:360px';
  document.body.append(el);
  await el.updateComplete;
  await forcedColors(forced);
  await new Promise((r) => setTimeout(r, 300));
  const row = el.shadowRoot!.querySelector('tbody tr')!;
  const rect = row.getBoundingClientRect();
  const before = await shot();
  (row.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 400));
  const after = await shot();
  return regionDiff(before, after, rect);
}

describe('u-rich-table — 강제 색 모드의 선택 행', () => {
  it('보통 모드에서도 · 강제 색 모드에서도 선택 전후의 행이 다르다', async () => {
    expect(await measure(false), '보통 모드').toBeGreaterThan(0);
    expect(await measure(true), '강제 색 모드').toBeGreaterThan(0);
  });
});
