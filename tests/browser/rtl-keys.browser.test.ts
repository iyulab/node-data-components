import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/data-view/UDataView';
import '../../src/components/u-rich-table/URichTable';
import type { UDataView } from '../../src/components/data-view/UDataView';

/**
 * 「`dir="rtl"` 에서 가로 화살표 키는 **화면 방향**을 따른다」 — 네이티브 라디오 묶음 · APG 와 같다(components `rtl-keys` 와 같은 기준).
 * 표와 카드 격자는 RTL 에서 시작이 오른쪽이라 왼쪽 키가 «다음» 이다. 실제 `userEvent.keyboard` 로 누르고 포커스를 읽는다.
 */

afterEach(() => { document.documentElement.dir = 'ltr'; document.body.replaceChildren(); });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('RTL — u-data-view 의 가로 키', () => {
  async function mount(dir: 'ltr' | 'rtl', mode: 'grid' | 'list'): Promise<UDataView> {
    document.documentElement.dir = dir;
    const view = document.createElement('u-data-view') as UDataView;
    view.style.width = '600px';
    view.mode = mode;
    view.data = [{ _id: 'a', name: 'Alpha' }, { _id: 'b', name: 'Bravo' }, { _id: 'c', name: 'Charlie' }];
    document.body.appendChild(view);
    await view.updateComplete;
    return view;
  }
  const idx = (v: UDataView) => (v.shadowRoot!.activeElement as HTMLElement | null)?.dataset.index;

  it.each([['ltr', 'ArrowRight', '1'], ['ltr', 'ArrowLeft', '0'], ['rtl', 'ArrowLeft', '1'], ['rtl', 'ArrowRight', '0']] as const)(
    '격자 · %s: 레코드 0 에서 %s 를 누르면 레코드 %s 로 간다(0 이면 제자리)',
    async (dir, key, expected) => {
      const v = await mount(dir, 'grid');
      (v.shadowRoot!.querySelector('[data-index="0"]') as HTMLElement).focus();
      await userEvent.keyboard(`{${key}}`);
      await sleep(60);
      expect(idx(v), `${dir} ${key}`).toBe(expected);
    });

  it.each([['ltr', 'ArrowRight', 1], ['rtl', 'ArrowLeft', 1], ['rtl', 'ArrowRight', 0]] as const)(
    '보기 전환 툴바 · %s: 첫 단추에서 %s 를 누르면 단추 %s 로 간다',
    async (dir, key, expected) => {
      const v = await mount(dir, 'grid');
      const tools = [...v.shadowRoot!.querySelectorAll<HTMLElement>('.view-toggles u-button')];
      tools[0].focus();
      await userEvent.keyboard(`{${key}}`);
      await sleep(60);
      const active = v.shadowRoot!.activeElement;
      expect(tools.indexOf(active as HTMLElement), `${dir} ${key}`).toBe(expected === 0 ? tools.length - 1 : expected);
    });
});

describe('RTL — u-rich-table 의 셀 이동 키', () => {
  type Table = HTMLElement & { columns: { key: string; label: string }[]; data: Record<string, unknown>[]; updateComplete: Promise<unknown> };
  async function mount(dir: 'ltr' | 'rtl'): Promise<Table> {
    document.documentElement.dir = dir;
    const t = document.createElement('u-rich-table') as Table;
    t.setAttribute('layout', 'table');
    t.columns = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }, { key: 'c', label: 'C' }];
    t.data = [0, 1].map((i) => ({ _id: `r${i}`, a: `a${i}`, b: `b${i}`, c: `c${i}` }));
    document.body.append(t);
    await t.updateComplete;
    return t;
  }
  const cell = (t: Table, r: number, c: number) => t.shadowRoot!.querySelector<HTMLElement>(`td[data-cell][data-row="${r}"][data-col="${c}"]`)!;

  it.each([['ltr', 'ArrowRight', 1], ['ltr', 'ArrowLeft', 0], ['rtl', 'ArrowLeft', 1], ['rtl', 'ArrowRight', 0]] as const)(
    '%s: 칸 (0,0) 에서 %s 를 누르면 열 %s 로 간다',
    async (dir, key, expectedCol) => {
      const t = await mount(dir);
      await userEvent.click(cell(t, 0, 0));
      await userEvent.keyboard(`{${key}}`);
      await t.updateComplete;
      await sleep(60);
      const active = t.shadowRoot!.activeElement as HTMLElement | null;
      expect(active?.getAttribute('data-col'), `${dir} ${key}`).toBe(String(expectedCol));
    });

  it('RTL 표는 열이 오른쪽부터 놓인다(키가 화면을 따라가는 근거)', async () => {
    const t = await mount('rtl');
    expect(cell(t, 0, 1).getBoundingClientRect().left, '열 1 은 열 0 의 왼쪽').toBeLessThan(cell(t, 0, 0).getBoundingClientRect().left);
  });
});
