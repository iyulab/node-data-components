import { describe, it, afterEach, expect, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * **좁은 폭의 카드 목록 폴백** — `layout="auto"` 는 표가 맞지 않는 자리에서 행을 카드로 그린다:
 * ⑴휴대폰(창이 `card-breakpoint` 보다 좁다) ⑵넓은 창의 좁은 자리에서 열이 들어가지 않아 옆으로 스크롤할 때.
 * 넓은 창에서 내용에 맞춰 좁은 자리(조회 대화상자)에 들어간 표는 표로 남는다. 앱이 `layout` 을 정하지 않았으면 한 번 알린다.
 * 폭 · 넘침은 상자 모델의 결과라 브라우저로 잰다.
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  layout: 'auto' | 'table' | 'cards';
  selectable: boolean;
  updateComplete: Promise<unknown>;
};

afterEach(async () => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  // 이 프로젝트의 기본 창(414 × 896)으로 — ⚠넓힌 창에서는 iframe 이 축소돼 작은 대상(행 체크박스)의 클릭이 빗나간다.
  await page.viewport(414, 896);
});

const COLUMNS = [
  { key: 'id', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
];
/** 300px 에 들어가지 않는 열(합 600px). */
const WIDE_COLUMNS = COLUMNS.map((c) => ({ ...c, width: 200 }));
const ROWS = [
  { _id: 'a', id: 'G-1', customer: 'Aster', status: 'pending' },
  { _id: 'b', id: 'G-2', customer: 'Birch', status: 'shipped' },
];

const settle = async (el: Table) => {
  for (let i = 0; i < 3; i++) {
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 30));
  }
  await el.updateComplete;
};

async function mount(width: string, props: Partial<Table> = {}, attrs: Record<string, string> = {}): Promise<Table> {
  const el = document.createElement('u-rich-table') as unknown as Table;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.columns = COLUMNS;
  el.data = ROWS;
  Object.assign(el, props);
  el.style.display = 'block';
  el.style.width = width;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

const shadow = (el: Table) => el.shadowRoot!;
const cards = (el: Table) => [...shadow(el).querySelectorAll<HTMLElement>('li.card')];
const isTable = (el: Table) => shadow(el).querySelector('table') !== null;
const notes = (warn: { mock: { calls: unknown[][] } }) => warn.mock.calls.filter(([m]) => String(m).includes('drew its rows as cards'));

describe('u-rich-table — 카드 폴백', () => {
  it('🔴휴대폰 폭이면(auto) 행이 카드다 — 첫 열이 제목, 나머지는 라벨:값 · 콘솔에 한 번', async () => {
    await page.viewport(390, 844);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await mount('100%');
    expect(isTable(el)).toBe(false);
    expect(cards(el)).toHaveLength(2);
    const first = cards(el)[0];
    expect(first.querySelector('.card-title')!.textContent!.trim()).toBe('G-1');
    expect([...first.querySelectorAll('dt')].map((d) => d.textContent)).toEqual(['Customer', 'Status']);
    expect([...first.querySelectorAll('dd')].map((d) => d.textContent)).toEqual(['Aster', 'pending']);
    expect(notes(warn)).toHaveLength(1);
    expect(String(notes(warn)[0][0])).toMatch(/^\[@iyulab\/data-components\] .*screen is 390px/);
  });

  it('🔴넓은 창의 좁은 자리에서 열이 들어가지 않으면 카드 — 넓히면 표로 돌아온다', async () => {
    await page.viewport(1280, 900);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await mount('300px', { columns: WIDE_COLUMNS });
    expect(cards(el)).toHaveLength(2);
    expect(String(notes(warn)[0][0])).toMatch(/300px wide and its columns need/);
    el.style.width = '900px';
    await settle(el);
    expect(isTable(el)).toBe(true);
  });

  it('⚪NEGATIVE — 넓은 창에서 좁은 자리에 들어가는 표(내용에 맞춘 대화상자)는 표로 남는다 · 넓은 표도', async () => {
    await page.viewport(1280, 900);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(isTable(await mount('360px'))).toBe(true);
    expect(isTable(await mount('900px'))).toBe(true);
    expect(notes(warn)).toHaveLength(0);
  });

  it('🔴앱이 layout 을 정하면 그대로 — 휴대폰에서도 table 은 표, 넓어도 cards 는 카드 · 알림 없음', async () => {
    await page.viewport(390, 844);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(isTable(await mount('100%', {}, { layout: 'table' }))).toBe(true);
    await page.viewport(1280, 900);
    expect(cards(await mount('900px', { layout: 'cards' }))).toHaveLength(2);
    expect(notes(warn)).toHaveLength(0);
  });

  it('🔴편집 열이 있는 표는 auto 에서 휴대폰이어도 표 — 편집은 그리드의 일', async () => {
    await page.viewport(390, 844);
    const el = await mount('100%', { columns: [...COLUMNS.slice(0, 2), { key: 'status', label: 'Status', editable: true }] });
    expect(isTable(el)).toBe(true);
  });

  it('🔴열의 card 역할 — title 이 제목, hidden 은 빠진다', async () => {
    const el = await mount('360px', {
      layout: 'cards',
      columns: [{ key: 'id', label: 'Order', card: 'hidden' }, { key: 'customer', label: 'Customer', card: 'title' }, { key: 'status', label: 'Status' }],
    });
    const first = cards(el)[0];
    expect(first.querySelector('.card-title')!.textContent!.trim()).toBe('Aster');
    expect([...first.querySelectorAll('dt')].map((d) => d.textContent)).toEqual(['Status']);
  });

  it('🔴값이 빈 칸은 카드에 줄을 세우지 않는다(null · undefined · 공백) — render 를 가진 열과 always 는 남는다', async () => {
    const el = await mount('360px', {
      layout: 'cards',
      columns: [
        { key: 'id', label: 'Order' },
        { key: 'maker', label: 'Maker' },
        { key: 'model', label: 'Model' },
        { key: 'closed', label: 'Closed' },
        { key: 'note', label: 'Note', render: (v: unknown) => (v ? String(v) : 'none') },
        { key: 'owner', label: 'Owner', card: 'always' },
        { key: 'qty', label: 'Qty' },
      ],
      data: [
        { id: 'A-1', maker: 'Acme', model: '', closed: null, note: null, owner: null, qty: 0 },
        { id: 'A-2', maker: '  ', model: 'M2', note: 'x', owner: 'Kim', qty: 3 },
      ],
    });
    const labels = (i: number) => [...cards(el)[i].querySelectorAll('dt')].map((d) => d.textContent);
    // 0 은 값이다 — 빈 것은 null · undefined · 공백뿐인 글자만.
    expect(labels(0)).toEqual(['Maker', 'Note', 'Owner', 'Qty']);
    expect(labels(1)).toEqual(['Model', 'Note', 'Owner', 'Qty']);
    expect(cards(el)[0].querySelector('.card-title')!.textContent!.trim()).toBe('A-1');
  });

  it('🔴카드를 누르면 row-activate(click) · 카드에서 Enter 는 (keyboard) · 체크박스는 선택만', async () => {
    const el = await mount('360px', { selectable: true, layout: 'cards' });
    const events: string[] = [];
    el.addEventListener('row-activate', (e) => events.push(`${(e as CustomEvent).detail.id}:${(e as CustomEvent).detail.via}`));
    const selections: string[][] = [];
    el.addEventListener('selection-change', (e) => selections.push((e as CustomEvent).detail.selectedIds));
    await userEvent.click(cards(el)[1].querySelector('.card-title')!);
    expect(events).toEqual(['b:click']);
    cards(el)[0].focus();
    await userEvent.keyboard('{Enter}');
    expect(events).toEqual(['b:click', 'a:keyboard']);
    await userEvent.click(cards(el)[0].querySelector('input[type="checkbox"]')!, { force: true });
    expect(selections.at(-1)).toEqual(['a']);
    expect(events).toHaveLength(2);
  });
});
