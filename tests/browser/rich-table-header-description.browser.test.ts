/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import { userEvent, cdp } from 'vitest/browser';
import '../../src/components/u-rich-table/URichTable';

/**
 * 열 머리글 설명(`ColumnDef.description`) — 아이콘 + `u-tooltip` 은 «어디에 뜨는가» 와 «키보드로 닿는가» 가
 * 계약이라 실제 배치와 실제 입력(Tab)으로 잰다.
 */

type Table = HTMLElement & { columns: unknown[]; data: Record<string, unknown>[]; totalCount: number; updateComplete: Promise<boolean> };

let host: HTMLElement;

async function mount(): Promise<Table> {
  host = document.createElement('div');
  host.setAttribute('style', 'position:fixed;top:80px;left:20px;width:480px');
  document.body.appendChild(host);
  const el = document.createElement('u-rich-table') as Table;
  el.setAttribute('layout', 'table'); // 표를 잰다 — 시험 창(414px)은 휴대폰 폭이라 layout="auto" 면 카드다
  host.appendChild(el);
  el.columns = [
    { key: 'a', label: 'A', sortable: true, description: 'Billed amount — by the billing party\'s unit price' },
    { key: 'b', label: 'B', sortable: true },
    { key: 'c', label: 'C', description: 'A column that cannot be sorted' },
  ];
  el.data = [{ a: 1, b: 2, c: 3 }, { a: 4, b: 5, c: 6 }];
  el.totalCount = 2;
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 80));
  return el;
}

/**
 * 실제 마우스 — 머리 칸은 역할이 gridcell/columnheader 로 갈려 요소 기반 `userEvent.hover/click` 의 선택자 생성이 못 찾는다.
 * 테스트는 iframe 안에서 돌고 CDP 는 최상위 페이지에 붙어 있으므로 iframe 의 위치·배율로 좌표를 옮긴다.
 */
async function mouse(type: 'mouseMoved' | 'mousePressed' | 'mouseReleased', target: Element): Promise<void> {
  const r = target.getBoundingClientRect();
  const frame = window.frameElement as HTMLElement | null;
  const f = frame?.getBoundingClientRect();
  const scale = f ? f.width / window.innerWidth : 1;
  await cdp().send('Input.dispatchMouseEvent', {
    type,
    x: (f?.left ?? 0) + (r.left + r.width / 2) * scale,
    y: (f?.top ?? 0) + (r.top + r.height / 2) * scale,
    button: type === 'mouseMoved' ? 'none' : 'left',
    clickCount: type === 'mouseMoved' ? 0 : 1,
  });
}
const hover = (target: Element) => mouse('mouseMoved', target);
const click = async (target: Element) => {
  await mouse('mouseMoved', target);
  await mouse('mousePressed', target);
  await mouse('mouseReleased', target);
};

const th = (el: Table, i: number) => el.shadowRoot!.querySelector<HTMLElement>(`thead th[data-col="${i}"]`)!;
const tip = (el: Table, i: number) => th(el, i).querySelector<HTMLElement & { open: boolean }>('.header-hint u-tooltip');
const settle = () => new Promise((r) => setTimeout(r, 400));

afterEach(() => {
  host?.remove();
});

describe('u-rich-table 열 머리글 설명', () => {
  it('설명이 있는 열만 아이콘을 갖고, th 가 aria-description 으로 전달한다', async () => {
    const el = await mount();
    expect(th(el, 0).querySelector('.header-hint')).toBeTruthy();
    expect(th(el, 0).getAttribute('aria-description')).toContain('Billed amount');
    expect(th(el, 2).querySelector('.header-hint')).toBeTruthy();
    expect(th(el, 1).querySelector('.header-hint')).toBeNull();
    expect(th(el, 1).hasAttribute('aria-description')).toBe(false);
  });

  it('아이콘에 마우스를 올리면 칸 위에 뜨고 벗어나면 닫힌다', async () => {
    const el = await mount();
    const icon = th(el, 0).querySelector<HTMLElement>('.header-hint')!;
    await hover(icon);
    await settle();
    const t = tip(el, 0)!;
    expect(t.open).toBe(true);
    const r = t.getBoundingClientRect();
    // 아이콘(= 설명을 읽는 이가 보고 있는 자리)을 가리지 않는다 — 위(자리가 있으면)든 아래(표의 스크롤 영역이 위를 막으면 뒤집힘)든.
    const i = icon.getBoundingClientRect();
    expect(r.bottom <= i.top + 1 || r.top >= i.bottom - 1).toBe(true);
    await hover(document.body);
    await settle();
    expect(t.open).toBe(false);
  });

  it('아이콘 클릭은 정렬을 일으키지 않고, 호버로 열린 툴팁을 닫지 않는다', async () => {
    const el = await mount();
    let sorted = 0;
    el.addEventListener('sort-change', () => { sorted++; });
    const icon = th(el, 0).querySelector<HTMLElement>('.header-hint')!;
    await click(icon);
    await settle();
    expect(sorted).toBe(0);
    expect(tip(el, 0)!.open).toBe(true);
  });

  it('키보드(ArrowUp)로 머리 칸에 닿으면 열리고, 벗어나면 닫힌다', async () => {
    const el = await mount();
    // 키보드의 길로 머리에 닿는다: 본문 칸에서 ArrowUp 두 번(행 → 머리).
    await click(el.shadowRoot!.querySelector('td[data-cell][data-row="0"][data-col="0"]')!);
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{ArrowUp}');
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(th(el, 0));
    expect(tip(el, 0)!.open).toBe(true);
    await userEvent.keyboard('{ArrowRight}');
    await settle();
    expect(tip(el, 0)!.open).toBe(false);
  });

  it('머리 칸을 마우스로 눌러서는 툴팁이 뜨지 않는다', async () => {
    const el = await mount();
    await click(th(el, 2));
    await settle();
    expect(tip(el, 2)!.open).toBe(false);
  });
});
