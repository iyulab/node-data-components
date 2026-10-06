// @vitest-environment happy-dom
import { describe, it, afterEach, expect } from 'vitest';
import { Locale } from '@iyulab/components';
import '../src/components/u-rich-table/URichTable';

/**
 * 페이저의 접근 가능한 이름.
 *
 * 이전·다음 버튼의 내용은 글리프(`◀`·`▶`)뿐이라, 이름을 주지 않으면 보조기기가 기호의 이름을 읽는다.
 * 현재 페이지는 `aria-current="page"` 로, 페이지 크기 선택은 이름으로, 묶음 전체는 내비게이션 영역으로 알린다.
 */

type Table = HTMLElement & {
  columns: unknown[]; data: Record<string, unknown>[]; totalCount: number; currentPage: number; pageSize: number;
  updateComplete: Promise<unknown>;
};

let table: Table | null = null;
afterEach(() => { table?.remove(); table = null; Locale.set('en'); });

const mount = async () => {
  table = document.createElement('u-rich-table') as Table;
  table.columns = [{ key: 'name', label: 'Name' }];
  table.data = [{ _id: 1, name: 'a' }];
  table.totalCount = 60;
  table.pageSize = 25;
  table.currentPage = 2;
  document.body.appendChild(table);
  await table.updateComplete;
  return table.shadowRoot!.querySelector('.pagination')!;
};

describe('u-rich-table pager names', () => {
  it('names the glyph buttons, marks the current page and labels the size select', async () => {
    Locale.set('en');
    const pager = await mount();
    expect(pager.getAttribute('role')).toBe('navigation');
    expect(pager.getAttribute('aria-label')).toBe('Pagination');
    const buttons = [...pager.querySelectorAll('button')];
    expect(buttons[0].textContent!.trim()).toBe('◀');
    expect(buttons[0].getAttribute('aria-label')).toBe('Previous page');
    expect(buttons.at(-1)!.getAttribute('aria-label')).toBe('Next page');
    const current = buttons.filter(b => b.getAttribute('aria-current') === 'page');
    expect(current.map(b => b.textContent!.trim())).toEqual(['2']);
    expect(current[0].getAttribute('aria-label')).toBe('Page 2');
    expect(pager.querySelector('select')!.getAttribute('aria-label')).toBe('Rows per page');
  });

  it('follows the locale', async () => {
    Locale.set('ko');
    const pager = await mount();
    expect(pager.querySelector('button')!.getAttribute('aria-label')).toBe('이전 페이지');
    expect(pager.querySelector('[aria-current="page"]')!.getAttribute('aria-label')).toBe('2페이지');
  });
});
