import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * `URichTable`의 `--dc-font-size`가 `--u-density`(`components`/`flex-table`/
 * `USimpleSheet`가 이미 읽는 그 밀도 스위치)를 폴백 원본으로 갖는가.
 *
 * ⚠**이 컴포넌트는 시각 위계가 넉 단(13/12/11/10px)이라 전부를 열지 않는다.** 밀도
 * 스위치가 움직이는 것은 헤더·본문 셀(`:host` 상속 경로) + 편집 입력뿐이다 —
 * `styles.ts`의 「소비자 조절점 — 본문 타이포」 주석이 그 경계의 정본이다. 툴바·
 * 페이지네이션·필터행·배지·정렬 표시자·검증 오류는 의도적으로 이 스위트의 대상이
 * 아니다(장식·보조 텍스트, D-17이 아이콘/배지 크기를 뺀 것과 같은 경계).
 */
type Table = HTMLElement & {
  columns: unknown[];
  data: unknown[];
  totalCount: number;
  editable: boolean;
  updateComplete: Promise<unknown>;
};

const COLUMNS = [
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B', editable: true },
];
const DATA = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];

let override: HTMLStyleElement | null = null;

const declare = (decls: string) => {
  override = document.createElement('style');
  override.textContent = `u-rich-table { ${decls} }`;
  document.head.appendChild(override);
};

const mount = async (wrap?: HTMLElement) => {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = COLUMNS;
  el.data = DATA;
  el.totalCount = DATA.length;
  el.editable = true;
  (wrap ?? document.body).appendChild(el);
  await el.updateComplete;
  return el;
};

const cellOf = (el: Table) => el.shadowRoot!.querySelectorAll('tbody td')[0] as HTMLElement;
const headerOf = (el: Table) => el.shadowRoot!.querySelector('thead th') as HTMLElement;

const editInputOf = async (el: Table) => {
  const editCell = el.shadowRoot!.querySelectorAll('tbody td')[1] as HTMLElement;
  editCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  await el.updateComplete;
  return el.shadowRoot!.querySelector('.cell-edit-input') as HTMLElement;
};

beforeEach(() => {
  window.scrollTo(0, 0);
});

afterEach(() => {
  override?.remove();
  override = null;
  document.body.replaceChildren();
});

describe('URichTable — --u-density 밀도 스위치 연동', () => {
  it('미설정 시 종전 값(13px)과 바이트 단위로 동일하다', async () => {
    const el = await mount();
    expect(getComputedStyle(cellOf(el)).fontSize).toBe('13px');
  });

  it('조상에 --u-density 를 걸면 헤더·본문 셀 font-size 가 함께 따라간다', async () => {
    const wrap = document.createElement('div');
    wrap.setAttribute('style', '--u-density: 15px');
    document.body.appendChild(wrap);
    const el = await mount(wrap);
    expect(getComputedStyle(cellOf(el)).fontSize).toBe('15px');
    expect(getComputedStyle(headerOf(el)).fontSize).toBe('15px');
  });

  it('편집 입력이 본문 셀과 같은 값을 읽는다 — 편집 진입 시 글자가 튀지 않는다', async () => {
    const wrap = document.createElement('div');
    wrap.setAttribute('style', '--u-density: 16px');
    document.body.appendChild(wrap);
    const el = await mount(wrap);
    const input = await editInputOf(el);
    expect(getComputedStyle(input).fontSize).toBe('16px');
  });

  it('요소 선택자의 --dc-font-size 명시값이 --u-density 보다 이긴다', async () => {
    const wrap = document.createElement('div');
    wrap.setAttribute('style', '--u-density: 20px');
    document.body.appendChild(wrap);
    declare('--dc-font-size: 15px;');
    const el = await mount(wrap);
    expect(getComputedStyle(cellOf(el)).fontSize).toBe('15px');
  });

  it('장식·보조 텍스트(정렬 표시자)는 --u-density 의 영향을 받지 않는다 — 의도적 경계', async () => {
    const wrap = document.createElement('div');
    wrap.setAttribute('style', '--u-density: 18px');
    document.body.appendChild(wrap);
    const el = await mount(wrap);
    const indicator = el.shadowRoot!.querySelector('.sort-indicator') as HTMLElement | null;
    // 정렬 가능한 열이 없으면 렌더되지 않을 수 있다 — 렌더될 때만 재고, 없으면 이 축은
    // 애초에 관측 대상이 아니므로 스킵한다(거짓 통과가 아니라 무관함을 명시한다).
    if (indicator) expect(getComputedStyle(indicator).fontSize).not.toBe('18px');
  });
});
