import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-rich-table/URichTable';

/**
 * 서버 페이징에서 **선택 상태의 수명** 계약.
 *
 * ## 왜 이 파일이 생겼는가
 *
 * `URichTable` 은 `totalCount`/`currentPage`/`page-change` 로 서버 페이징을 표방하고
 * `selectedIds` 는 `data` 가 바뀌어도 초기화되지 않는다 — 즉 **선택은 페이지를 넘어 살아남는다.**
 * 그런데 그 사실을 아는 코드와 모르는 코드가 한 컴포넌트 안에 섞여 있었다:
 *
 * - 전체선택 체크박스가 «누적 선택 수 == 이 페이지 행 수» 로 상태를 그렸다
 *   ⇒ 페이지 1을 전량 선택하고 넘어가면 **페이지 2에서 아무것도 안 골랐는데 켜져 보였다**
 * - 그것을 끄면 `new Set()` — **전역 소거**라 페이지 1의 선택이 조용히 사라졌다
 * - 켜는 쪽도 합집합이 아니라 **치환**이라 마찬가지였다
 *
 * ⇒ 이 계약은 *"전체선택은 «이 페이지» 범위이고, 다른 페이지의 선택분을 건드리지 않는다"* 다.
 *
 * ## 왜 브라우저인가
 *
 * 재는 것이 **체크박스의 `checked`/`indeterminate` 와 클릭 → `change` 흐름**이다.
 * 소스 대조나 내부 상태 직독으로 확인하면 *우리가 다시 구현한 규칙*을 스스로에게 물어보는 셈이 된다.
 * 실제 입력 요소가 실제로 그 상태를 갖는지는 실제 브라우저만 답한다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  updateComplete: Promise<unknown>;
  getSelectedRows(): Record<string, unknown>[];
  readonly selectedRowIds: ReadonlySet<string>;
  setSelection(ids: Iterable<string>): void;
  clearSelection(): void;
};

const PAGE_SIZE = 3;
const page = (n: number) =>
  Array.from({ length: PAGE_SIZE }, (_, i) => ({ _id: `p${n}-r${i}`, name: `row ${n}-${i}` }));

const mount = async () => {
  const el = document.createElement('u-rich-table') as Table;
  el.setAttribute('selectable', '');
  el.columns = [{ key: 'name', label: 'Name' }];
  el.pageSize = PAGE_SIZE;
  el.totalCount = PAGE_SIZE * 3; // 서버 페이징 활성 — 3페이지
  el.currentPage = 1;
  el.data = page(1);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

/** 툴바의 전체선택 체크박스 — 헤더 `<th>` 가 아니라 여기 있다. */
const selectAllBox = (el: Table) =>
  el.shadowRoot!.querySelector('.selection-info input[type=checkbox]') as HTMLInputElement;

const rowBoxes = (el: Table) =>
  [...el.shadowRoot!.querySelectorAll('tbody .checkbox-cell input[type=checkbox]')] as HTMLInputElement[];

const label = (el: Table) =>
  el.shadowRoot!.querySelector('.selection-info span')?.textContent?.trim() ?? '';

/** 실제 사용자 조작과 같은 경로 — `.click()` 이 `checked` 를 뒤집고 `change` 를 발생시킨다. */
const click = async (el: Table, box: HTMLInputElement) => {
  box.click();
  await el.updateComplete;
};

const goToPage = async (el: Table, n: number) => {
  el.currentPage = n;
  el.data = page(n);
  await el.updateComplete;
};

let table: Table | null = null;
// ⚠선택 라벨(`messages.text('selected', …)`)은 `Locale.get()`을 읽는다 — 핀 없이 두면
// 이 스위트가 브라우저의 기본 감지 로케일(`navigator.language`)을 물려받는다. 개발 머신이
// 한국어면 「3 selected」 대신 「3건 선택됨」을 보게 되어 이 파일의 단언이 환경에 따라
// 갈린다(`messages-locale.browser.test.ts`가 이미 세운 관행을 여기도 적용한다).
beforeEach(() => { Locale.set('en'); document.body.innerHTML = ''; });
afterEach(() => { table?.remove(); table = null; document.body.innerHTML = ''; Locale.set('en'); });

describe('URichTable — 페이지를 가로지르는 선택', () => {
  it('전체선택 체크박스는 «이 페이지» 상태를 그린다 — 다른 페이지 선택분이 새지 않는다', async () => {
    const el = table = await mount();

    await click(el, selectAllBox(el));
    expect(selectAllBox(el).checked).toBe(true);

    await goToPage(el, 2);
    // 🔴회귀 지점: 종전에는 누적 3 == 이 페이지 3 이라 «켜짐» 으로 그렸다.
    expect(selectAllBox(el).checked).toBe(false);
    expect(selectAllBox(el).indeterminate).toBe(false);
    expect(rowBoxes(el).every(b => !b.checked)).toBe(true);
  });

  it('다른 페이지에서 전체해제해도 이전 페이지 선택은 남는다', async () => {
    const el = table = await mount();

    await click(el, selectAllBox(el));
    await goToPage(el, 2);

    // 페이지 2에서 켰다 끈다 — 페이지 2 범위 안에서만 일어나야 한다.
    await click(el, selectAllBox(el));
    await click(el, selectAllBox(el));

    await goToPage(el, 1);
    // 🔴회귀 지점: 종전에는 `new Set()` 전역 소거라 여기서 전부 꺼져 있었다.
    expect(selectAllBox(el).checked).toBe(true);
    expect(el.getSelectedRows()).toHaveLength(PAGE_SIZE);
  });

  it('다른 페이지에서 전체선택해도 이전 페이지 선택은 치환되지 않는다 — 누적된다', async () => {
    const el = table = await mount();

    await click(el, selectAllBox(el));
    await goToPage(el, 2);
    await click(el, selectAllBox(el));

    // 🔴회귀 지점: 종전에는 `new Set(현재 페이지)` 치환이라 누적이 3 에 머물렀다.
    expect(label(el)).toContain('6');

    await goToPage(el, 1);
    expect(el.getSelectedRows()).toHaveLength(PAGE_SIZE);
  });

  it('페이지를 가로지르면 라벨이 누적과 이 페이지 몫을 함께 알린다', async () => {
    const el = table = await mount();

    await click(el, selectAllBox(el));
    // 한 페이지 안에서는 «이 페이지» 표기를 덧붙이지 않는다.
    expect(label(el)).toBe('3 selected');

    await goToPage(el, 2);
    await click(el, rowBoxes(el)[0]);
    // 누적 4 · 이 페이지 1 — 두 숫자가 다르다는 사실 자체가 사용자에게 보여야 한다.
    expect(label(el)).toBe('4 selected (1 on this page)');
  });

  it('clearSelection() 은 누적분까지 비운다 — 전역 소거의 제자리', async () => {
    const el = table = await mount();

    await click(el, selectAllBox(el));
    await goToPage(el, 2);
    await click(el, selectAllBox(el));

    el.clearSelection();
    await el.updateComplete;
    expect(label(el)).toBe('');

    await goToPage(el, 1);
    expect(el.getSelectedRows()).toHaveLength(0);
  });

  it('선택이 바뀔 때마다 selection-change 가 현재 페이지 행을 싣는다', async () => {
    const el = table = await mount();
    const seen: number[] = [];
    el.addEventListener('selection-change', (e) => {
      seen.push((e as CustomEvent<{ selectedRows: unknown[] }>).detail.selectedRows.length);
    });

    await click(el, selectAllBox(el));
    await goToPage(el, 2);
    await click(el, rowBoxes(el)[0]);

    expect(seen).toEqual([PAGE_SIZE, 1]);
  });
});

describe('URichTable — 선택 집합의 노출과 제어', () => {
  it('selectedRowIds 는 누적 전부를 준다 — getSelectedRows() 와 세는 것이 다르다', async () => {
    const el = table = await mount();

    await click(el, selectAllBox(el));
    await goToPage(el, 2);
    await click(el, rowBoxes(el)[0]);

    // 앱이 «여러 페이지에 걸쳐 고른 뒤 일괄 처리» 하려면 이쪽이 필요하다.
    expect([...el.selectedRowIds].sort()).toEqual(['p1-r0', 'p1-r1', 'p1-r2', 'p2-r0']);
    // 같은 시각 getSelectedRows() 는 현재 페이지뿐 — 갖고 있지 않은 행을 만들 수 없다.
    expect(el.getSelectedRows()).toHaveLength(1);
  });

  it('selectedRowIds 는 스냅샷이다 — 돌려받은 집합을 고쳐도 내부가 흔들리지 않는다', async () => {
    const el = table = await mount();
    await click(el, rowBoxes(el)[0]);

    (el.selectedRowIds as Set<string>).add('침입');
    expect(el.selectedRowIds.has('침입')).toBe(false);
    expect(el.selectedRowIds.size).toBe(1);
  });

  it('setSelection() 은 현재 페이지에 없는 식별자도 받는다', async () => {
    const el = table = await mount();

    el.setSelection(['p1-r1', 'p3-r2']);
    await el.updateComplete;

    expect(rowBoxes(el).map(b => b.checked)).toEqual([false, true, false]);
    expect(label(el)).toBe('2 selected (1 on this page)');

    // 그 페이지로 가면 선택된 것으로 렌더된다.
    await goToPage(el, 3);
    expect(rowBoxes(el).map(b => b.checked)).toEqual([false, false, true]);
  });

  it('🔴setSelection() 이 같은 집합이면 selection-change 를 내지 않는다 — 앱 배선의 무한 루프 자리', async () => {
    const el = table = await mount();
    let fired = 0;
    el.addEventListener('selection-change', () => { fired++; });

    el.setSelection(['p1-r0']);
    expect(fired).toBe(1);

    // 앱이 이벤트를 받아 자기 상태를 갱신하고 되돌려 주는 것이 자연스러운 배선이다.
    el.setSelection(['p1-r0']);
    el.setSelection(new Set(['p1-r0']));
    expect(fired).toBe(1);
  });

  it('selection-change detail 이 누적 식별자를 함께 싣는다', async () => {
    const el = table = await mount();
    let last: { selectedRows: unknown[]; selectedIds: string[] } | null = null;
    el.addEventListener('selection-change', (e) => {
      last = (e as CustomEvent<typeof last & object>).detail;
    });

    await click(el, selectAllBox(el));
    await goToPage(el, 2);
    await click(el, rowBoxes(el)[0]);

    expect(last!.selectedIds.sort()).toEqual(['p1-r0', 'p1-r1', 'p1-r2', 'p2-r0']);
    expect(last!.selectedRows).toHaveLength(1);
  });

  it('select-all 이 «전체선택을 눌렀다» 를 따로 알린다 — 행 클릭과 구분된다', async () => {
    const el = table = await mount();
    const seen: { checked: boolean; pageRowIds: string[] }[] = [];
    el.addEventListener('select-all', (e) => {
      seen.push((e as CustomEvent<{ checked: boolean; pageRowIds: string[] }>).detail);
    });

    await click(el, rowBoxes(el)[0]); // 행 클릭 — 이 이벤트가 아니다
    expect(seen).toHaveLength(0);

    await click(el, selectAllBox(el));
    expect(seen).toEqual([{ checked: true, pageRowIds: ['p1-r0', 'p1-r1', 'p1-r2'] }]);

    await click(el, selectAllBox(el));
    expect(seen[1].checked).toBe(false);
  });
});

describe('URichTable — 단일 페이지에서는 동작이 종전과 같다 (NEGATIVE 컨트롤)', () => {
  const mountSinglePage = async () => {
    const el = document.createElement('u-rich-table') as Table;
    el.setAttribute('selectable', '');
    el.columns = [{ key: 'name', label: 'Name' }];
    el.data = page(1);
    el.totalCount = 0; // 페이지네이션 미표시 = 클라이언트 사용
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  };

  it('전체선택 → 전체해제가 모두 비운다', async () => {
    const el = table = await mountSinglePage();

    await click(el, selectAllBox(el));
    expect(el.getSelectedRows()).toHaveLength(PAGE_SIZE);
    expect(label(el)).toBe('3 selected');

    await click(el, selectAllBox(el));
    expect(el.getSelectedRows()).toHaveLength(0);
    expect(label(el)).toBe('');
  });

  it('일부만 고르면 indeterminate 다', async () => {
    const el = table = await mountSinglePage();

    await click(el, rowBoxes(el)[0]);
    expect(selectAllBox(el).indeterminate).toBe(true);
    expect(selectAllBox(el).checked).toBe(false);
    // 「이 페이지」 표기가 붙지 않는다 — 누적과 이 페이지가 같기 때문이다.
    expect(label(el)).toBe('1 selected');
  });

  it('빈 데이터에서는 켜지지도 indeterminate 도 아니다', async () => {
    const el = table = await mountSinglePage();
    el.data = [];
    await el.updateComplete;

    expect(selectAllBox(el).checked).toBe(false);
    expect(selectAllBox(el).indeterminate).toBe(false);
  });
});
