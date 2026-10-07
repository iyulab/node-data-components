// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/data-view/UDataView.js';
import type { UDataView } from '../src/components/data-view/UDataView.js';

/**
 * `u-data-view` 가 두 표와 **같은 뷰 어휘**를 받는다 — `data` · `totalCount` · `loading` · `error` · `emptyMessage` ·
 * `loadingMessage`. 종전에는 레코드를 `items` 로 받고 불러오는 중·실패를 표현할 길이 없어, 같은 소스의 상태를 넘기면
 * 표에서는 «불러오지 못했습니다» 인 것이 카드에서는 «데이터가 없습니다» 로 보였고 서버 페이지 목록의 «N items» 는
 * 한 페이지 수를 셌다. 목록 키트의 «표 ↔ 카드는 속성 하나» 가 서려면 두 뷰가 같은 이름을 받아야 한다.
 */
async function mount(props: Partial<UDataView>): Promise<UDataView> {
  const el = document.createElement('u-data-view') as UDataView;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const info = (el: UDataView) => el.shadowRoot!.querySelector('.info')!.textContent!.trim();
const state = (el: UDataView) => el.shadowRoot!.querySelector('.state') as HTMLElement | null;
const cards = (el: UDataView) => el.shadowRoot!.querySelectorAll('.card').length;

describe('u-data-view — the view vocabulary of the two tables', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('🔴a data source state object can be handed over as is', async () => {
    // `createODataSource(...).getState()` 의 모양 — 한 페이지(2) · 전체 245.
    const sourceState = { data: [{ id: 1 }, { id: 2 }], totalCount: 245, loading: false, error: null };
    const el = await mount(sourceState);
    expect(cards(el)).toBe(2);
    expect(info(el)).toContain('245');
  });

  it('without totalCount the count is the records it has', async () => {
    const el = await mount({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    expect(info(el)).toContain('3');
  });

  it('🔴a failed load is an alert with the source message — not "no data"', async () => {
    const el = await mount({ data: [], error: { message: 'Request failed (503)' } });
    const s = state(el)!;
    expect(s.getAttribute('role')).toBe('alert');
    expect(s.textContent!.trim()).toBe('Request failed (503)');
    expect(s.classList.contains('empty')).toBe(false);
  });

  it('loading shows the loading text in place of the last result, and comes before a stale error', async () => {
    const el = await mount({ data: [{ id: 1 }], loading: true, error: { message: 'old failure' }, loadingMessage: 'Fetching…' });
    expect(cards(el)).toBe(0);
    expect(state(el)!.textContent!.trim()).toBe('Fetching…');
    expect(state(el)!.getAttribute('aria-busy')).toBe('true');
    expect(state(el)!.getAttribute('role')).toBeNull();
  });

  it('emptyMessage replaces the locale text for an empty result', async () => {
    const el = await mount({ data: [], emptyMessage: 'No assets yet' });
    expect(state(el)!.textContent!.trim()).toBe('No assets yet');
  });

  it('NEGATIVE records with no load state render as before', async () => {
    const el = await mount({ data: [{ id: 1 }] });
    expect(state(el)).toBeNull();
    expect(cards(el)).toBe(1);
  });
});
