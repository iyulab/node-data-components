import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/u-record-picker/URecordPicker';

/**
 * `u-record-picker` 지우기 버튼 — **잡히는 영역 24×24 · 보이는 글리프 16×16** (§D-57 · cycle-549).
 *
 * 게이트가 이 컴포넌트를 «대상 아님» 에서 꺼내자 지우기 버튼(cycle-537 이 역할·핸들러를 준 우리 타깃)이
 * 16×16 으로 잡혔다. 방식은 §C-A ⑷ «히트 영역만 넓힌다». ⚠두 축을 함께 재지 않으면 검증이 안 되고,
 * 이 결정이 성립하는 조건 — **늘어난 영역이 이웃 타깃(입력칸·찾기 버튼)을 덮지 않는다** — 을 따로 잰다.
 */
type Picker = HTMLElement & {
  search: (q: string) => Promise<{ id: string; label: string }[]>;
  columns: { key: string; label: string }[];
  value?: string;
  updateComplete: Promise<unknown>;
};

async function mount(): Promise<Picker> {
  const p = document.createElement('u-record-picker') as Picker;
  p.setAttribute('clearable', '');
  p.style.width = '260px';
  p.search = async () => [{ id: '1', label: 'Acme Corp' }];
  p.columns = [{ key: 'label', label: 'Name' }];
  p.value = '1';
  document.body.appendChild(p);
  await p.updateComplete;
  await new Promise((r) => setTimeout(r, 60));
  return p;
}

const q = (p: Picker, sel: string) => p.shadowRoot!.querySelector(sel) as HTMLElement;

describe('u-record-picker 지우기 버튼 — 영역 24 · 글리프 16', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('잡히는 영역은 24×24 이고, 글리프는 그대로 16×16 이며 가운데에 있다', async () => {
    const p = await mount();
    const clear = q(p, '.clear-btn');
    const box = clear.getBoundingClientRect();
    expect(`${Math.round(box.width)}x${Math.round(box.height)}`).toBe('24x24');
    const glyph = clear.shadowRoot!.querySelector('svg, img, span, slot')!.getBoundingClientRect();
    expect(`${Math.round(glyph.width)}x${Math.round(glyph.height)}`, '글리프가 커졌다면 시각 계약이 바뀐 것이다').toBe('16x16');
    expect(Math.abs(glyph.left + glyph.width / 2 - (box.left + box.width / 2))).toBeLessThan(0.5);
    expect(Math.abs(glyph.top + glyph.height / 2 - (box.top + box.height / 2))).toBeLessThan(0.5);
  });

  it('🔴늘어난 영역이 입력칸과 찾기 버튼을 덮지 않는다 — 셋 다 우리 쪽 포인터 경로다', async () => {
    const p = await mount();
    const input = q(p, '.main-input').getBoundingClientRect();
    const clear = q(p, '.clear-btn').getBoundingClientRect();
    const find = q(p, '.find-btn').getBoundingClientRect();
    expect(input.right).toBeLessThanOrEqual(clear.left + 0.5);
    expect(clear.right).toBeLessThanOrEqual(find.left + 0.5);
  });

  it('지우기가 보일 때와 숨을 때 입력칸의 오른쪽 끝과 행 높이가 같다 — 늘어난 영역이 배치를 밀지 않는다', async () => {
    const p = await mount();
    const withClear = { input: q(p, '.main-input').getBoundingClientRect(), row: q(p, '.container').getBoundingClientRect().height };
    const findLeft = q(p, '.find-btn').getBoundingClientRect().left;
    // 지우기가 차지하던 폭(글리프 1em + gap)만큼 입력칸이 넓어지는 것이 정상이다 — 종전과 같은지만 본다.
    expect(Math.round(findLeft - withClear.input.right)).toBe(Math.round(16 + 2 * 4));
    p.value = undefined;
    await p.updateComplete;
    const rowWithout = q(p, '.container').getBoundingClientRect().height;
    expect(Math.round(withClear.row)).toBe(Math.round(rowWithout));
  });

  it('영역의 가장자리를 눌러도 지워진다 — 늘어난 4px 가 실제로 포인터를 받는다', async () => {
    const p = await mount();
    const clear = q(p, '.clear-btn');
    const box = clear.getBoundingClientRect();
    const hit = p.shadowRoot!.elementFromPoint(box.left + 1, box.top + box.height / 2);
    expect(hit, `가장자리가 ${(hit as HTMLElement | null)?.className} 로 갔다`).toBe(clear);
    let changed = 0;
    p.addEventListener('change', () => changed++);
    (hit as HTMLElement).click();
    await p.updateComplete;
    expect(changed).toBe(1);
    expect(p.value ?? '').toBe('');
  });
});
