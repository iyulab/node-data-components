import { describe, it, afterEach, expect, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * **렌더 뒤 측정은 소비자의 콘솔에 «비효율» 경고로 보이지 않는다.**
 *
 * `u-rich-table` 은 `layout="auto"` 에서 표가 가로로 넘치는지를 *그려 본 뒤에야* 알 수 있어 `updated()` 에서 재고 그 값을 상태로
 * 되먹인다(그래서 한 번 더 그린다). Lit 의 개발 빌드는 `updated()` 가 끝난 뒤 갱신이 다시 예약돼 있으면
 * «scheduled an update after an update completed» 를 낸다 — 그 경고 자신이 «다음 갱신이 이전 갱신의 부수 효과로만 예약될 수 있으면
 * 예외» 라고 적은 바로 그 경우다. 소비자는 개발 중 이 요소가 들어간 화면마다 자기 콘솔에서 이 경고를 보게 된다.
 *
 * ⚠Lit 은 같은 경고를 페이지당 한 번만 낸다 — 이 파일의 첫 사례여야 하므로 시험은 하나의 요소로 시작한다.
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
};

afterEach(async () => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  await page.viewport(414, 896);
});

const settle = async (el: Table) => {
  for (let i = 0; i < 3; i++) {
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 30));
  }
  await el.updateComplete;
};

describe('u-rich-table — Lit 개발 모드 경고', () => {
  it('🔴넓은 창에서 호스트보다 넓은 열 때문에 넘치는 표(표로 남는다)가 «갱신 뒤 갱신» 경고를 내지 않는다', async () => {
    await page.viewport(1100, 800);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = document.createElement('u-rich-table') as unknown as Table;
    // 700px 호스트(card-breakpoint 이상이라 표로 남는다)에 합 900px 의 열 — 가로로 넘쳐 `_tableNeed` 가 처음 정해진다.
    el.columns = ['a', 'b', 'c'].map((k) => ({ key: k, label: k.toUpperCase(), width: 300 }));
    el.data = [{ _id: '1', a: 'x', b: 'y', c: 'z' }];
    el.style.display = 'block';
    el.style.width = '700px';
    document.body.appendChild(el);
    await settle(el);

    const table = el.shadowRoot!.querySelector('table');
    expect(table, '표로 남아야 이 시험이 «넘침 측정 → 한 번 더 그림» 을 지난다').not.toBeNull();
    const wrap = el.shadowRoot!.querySelector<HTMLElement>('.table-wrap')!;
    expect(wrap.scrollWidth, '열이 호스트보다 넓다').toBeGreaterThan(wrap.clientWidth);

    const lit = warn.mock.calls.filter(([m]) => String(m).includes('scheduled an update'));
    expect(lit, `Lit 경고: ${lit.map(([m]) => String(m).slice(0, 80)).join(' | ')}`).toEqual([]);
  });
});
