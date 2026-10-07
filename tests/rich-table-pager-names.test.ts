// @vitest-environment happy-dom
import { describe, it, afterEach, expect } from 'vitest';
import { Locale } from '@iyulab/components';
import '../src/components/u-rich-table/URichTable';

/**
 * 페이저의 접근 가능한 이름.
 *
 * 페이저는 `u-pagination` 이다(0.46.0~) — 목록이 따로 쓰는 페이저와 같은 컴포넌트라, 이름·현재 쪽·크기 선택의 규칙도 하나다.
 * 표가 정하는 것은 내비게이션의 이름뿐이다: 호스트 `aria-label` 이 있으면 «<이름> pagination», 없으면 로케일의 «Pagination».
 * 이전·다음은 아이콘 버튼이라 이름이 없으면 보조기기가 아무것도 읽지 못한다 — 그 이름은 `u-pagination` 이 준다.
 */

type Table = HTMLElement & {
  columns: unknown[]; data: Record<string, unknown>[]; totalCount: number; page: number; pageSize: number;
  updateComplete: Promise<unknown>;
};
type Pager = HTMLElement & { updateComplete: Promise<unknown> };

let table: Table | null = null;
afterEach(() => { table?.remove(); table = null; Locale.set('en'); });

const mount = async (label?: string) => {
  table = document.createElement('u-rich-table') as Table;
  if (label) table.setAttribute('aria-label', label);
  table.columns = [{ key: 'name', label: 'Name' }];
  table.data = [{ _id: 1, name: 'a' }];
  table.totalCount = 60;
  table.pageSize = 25;
  table.page = 1;
  document.body.appendChild(table);
  await table.updateComplete;
  const pager = table.shadowRoot!.querySelector('u-pagination') as Pager;
  await pager.updateComplete;
  return pager.shadowRoot!;
};

describe('u-rich-table pager names', () => {
  it('the pager is u-pagination: named navigation, named step buttons, the current page, a named size choice', async () => {
    Locale.set('en');
    const pager = await mount();
    expect(pager.querySelector('nav')!.getAttribute('aria-label')).toBe('Pagination');
    expect(pager.querySelector('[part="prev"]')!.getAttribute('aria-label')).toBe('Previous page');
    expect(pager.querySelector('[part="next"]')!.getAttribute('aria-label')).toBe('Next page');
    const current = [...pager.querySelectorAll('[part="page"]')].filter(b => b.getAttribute('aria-current') === 'page');
    expect(current.map(b => b.textContent!.trim())).toEqual(['2']);
    expect(current[0].getAttribute('aria-label')).toBe('Page 2');
    expect(pager.querySelector('[part="page-size"]')!.getAttribute('aria-label')).toBe('Rows per page');
  });

  it('🔴a named table names its pager landmark — two tables on a page are two distinct landmarks', async () => {
    const pager = await mount('Orders');
    expect(pager.querySelector('nav')!.getAttribute('aria-label')).toBe('Orders pagination');
  });

  it('follows the locale', async () => {
    Locale.set('ko');
    const pager = await mount();
    expect(pager.querySelector('[part="prev"]')!.getAttribute('aria-label')).toBe('이전 페이지');
    expect(pager.querySelector('[aria-current="page"]')!.getAttribute('aria-label')).toBe('2페이지');
  });
});
