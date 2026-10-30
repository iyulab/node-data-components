import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/u-record-picker/URecordPicker';
import '../../src/components/u-rich-table/URichTable';
import { compose, commit } from './ime.js';

/**
 * 한국어 IME 로 «서울» 을 치는 동안 — 조합 중인 음절(«ㅅ» · «성»)로 서버에 묻거나 거르지 않는다. 조합 중에 사람이
 * 디바운스보다 오래 머물러도 마찬가지다. 검색 · 거르기는 조합이 끝날 때 확정 글자로 한다.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
beforeEach(() => { document.body.innerHTML = ''; });

type Picker = HTMLElement & {
  search: (q: string) => Promise<{ id: string; label: string }[]>;
  columns: { key: string; label: string }[];
  debounce: number;
  updateComplete: Promise<unknown>;
};

describe('u-record-picker — 조합 중에는 묻지 않는다', () => {
  it('인라인 검색: 조합 단계에서 디바운스가 지나도 질의 없음 · 조합이 끝나면 확정 글자로 묻는다', async () => {
    const asked: string[] = [];
    const p = document.createElement('u-record-picker') as Picker;
    p.search = async (q) => { asked.push(q); return [{ id: '1', label: '서울' }]; };
    p.columns = [{ key: 'label', label: 'Name' }];
    p.debounce = 50;
    document.body.appendChild(p);
    await p.updateComplete;
    await sleep(60);
    const input = p.shadowRoot!.querySelector('.main-input') as HTMLInputElement;
    input.focus();

    for (const step of ['ㅅ', '서', '성']) { await compose([step]); await sleep(120); }
    expect(asked, '조합 중').toEqual([]);
    await commit('서');
    await sleep(120);
    expect(asked).toEqual(['서']);
    await compose(['우']);
    await sleep(120);
    await compose(['울']);
    await sleep(120);
    await commit('울');
    await sleep(120);
    expect(asked).toEqual(['서', '서울']);
  });
});

type Table = HTMLElement & {
  columns: { key: string; label: string; filterable?: boolean }[];
  data: Record<string, unknown>[];
  filterable: boolean;
  updateComplete: Promise<unknown>;
};

describe('u-rich-table — 열 필터는 조합이 끝날 때 거른다', () => {
  it('조합 중에는 filter-change 없음 · 조합이 끝나면 확정 글자로', async () => {
    const t = document.createElement('u-rich-table') as Table;
    t.columns = [{ key: 'city', label: 'City', filterable: true }];
    t.data = [{ _id: 1, city: '서울' }, { _id: 2, city: '성남' }, { _id: 3, city: '부산' }];
    t.filterable = true;
    document.body.appendChild(t);
    await t.updateComplete;
    const filters: unknown[] = [];
    t.addEventListener('filter-change', (e) => filters.push((e as CustomEvent).detail.filters));
    const input = t.shadowRoot!.querySelector('.filter-row input') as HTMLInputElement;
    input.focus();

    await compose(['ㅅ', '서', '성']);
    await t.updateComplete;
    expect(filters).toEqual([]);
    await commit('서');
    await t.updateComplete;
    expect(filters).toEqual([{ city: { type: 'text', mode: 'contains', value: '서' } }]);
  });
});

describe('u-rich-table — 클라이언트 필터의 검색 일치', () => {
  it('열 필터는 자모 · 초성으로 찾는다 — «ㅅㄴ» 은 성남', async () => {
    const t = document.createElement('u-rich-table') as Table & { dataMode: string; filteredRowCount: number };
    t.columns = [{ key: 'city', label: 'City', filterable: true }];
    t.data = [{ _id: 1, city: '서울' }, { _id: 2, city: '성남' }, { _id: 3, city: '부산' }];
    t.filterable = true;
    t.dataMode = 'client';
    document.body.appendChild(t);
    await t.updateComplete;
    const input = t.shadowRoot!.querySelector('.filter-row input') as HTMLInputElement;
    input.focus();
    await compose(['ㅅ']);
    await commit('ㅅ');
    await compose(['ㄴ']);
    await commit('ㄴ');
    await t.updateComplete;
    expect(t.filteredRowCount).toBe(1);
  });
});
