// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import { sortRows } from '../src/components/u-rich-table/utils/client-data';

/**
 * `dataMode="client"` 의 글자 정렬 — 순서는 브라우저 기본 로캘이 아니라 앱의 `Locale.get()` 이 정한다.
 * 같은 데이터가 로캘만 달라 한글이 라틴 앞 / 뒤로 갈리고, 숫자 구간은 수로 읽는다(`A-2` < `A-10`).
 */
const ROWS = ['banana', '가나다', 'Apple', 'A-10', 'A-2', 'A-1'].map(name => ({ name }));
const COLUMNS = [{ key: 'name', label: 'Name', sortable: true }];
const names = () => sortRows(ROWS, { key: 'name', direction: 'asc' }, COLUMNS).map(r => r.name);

describe('u-rich-table client sort — text order', () => {
  const prev = Locale.get();
  afterEach(() => Locale.set(prev));

  it('reads digit runs as numbers', () => {
    Locale.set('en');
    const out = names();
    expect(out.indexOf('A-1')).toBeLessThan(out.indexOf('A-2'));
    expect(out.indexOf('A-2')).toBeLessThan(out.indexOf('A-10'));
  });

  it('puts Hangul before or after Latin by the app locale', () => {
    Locale.set('en');
    expect(names()).toEqual(['A-1', 'A-2', 'A-10', 'Apple', 'banana', '가나다']);
    Locale.set('ko');
    expect(names()).toEqual(['가나다', 'A-1', 'A-2', 'A-10', 'Apple', 'banana']);
  });
});
