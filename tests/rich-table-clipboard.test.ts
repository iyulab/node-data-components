// @vitest-environment happy-dom
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import '../src/components/u-rich-table/URichTable';

/**
 * 복사는 머리글 행 + 선택 행을 스프레드시트 형식(RFC 4180 인용)으로 싣고, 붙여넣기는 그것을 읽는다.
 * 종전: 인용하지 않아 여러 줄 셀이 스프레드시트에서 행으로 쪼개졌고, 텍스트 전체를 `trim()` 해
 * 첫 셀이 빈 행이 한 열 밀렸으며, 이 표에서 복사한 머리글 행을 붙여넣으면 데이터 행이 됐다.
 */
type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
  setSelection(ids: Iterable<string>): void;
};

let table: Table | null = null;
const mount = async () => {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = [{ key: 'name', label: 'Name' }, { key: 'note', label: 'Note' }];
  el.data = [{ _id: 'r0', name: 'first', note: 'line 1\nline 2' }];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { vi.restoreAllMocks(); table?.remove(); table = null; });

describe('URichTable — 클립보드 형식', () => {
  it('복사는 머리글 행과 인용된 여러 줄 셀을 싣는다', async () => {
    const el = table = await mount();
    el.setSelection(['r0']);
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));

    expect(write.mock.calls[0][0]).toBe('Name\tNote\nfirst\t"line 1\nline 2"');
  });

  it('이 표에서 복사한 텍스트를 붙여넣으면 머리글 행은 건너뛰고 여러 줄 셀은 한 셀이다', async () => {
    const el = table = await mount();
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue('Name\tNote\r\nsecond\t"a\r\nb"\r\n');
    const paste = vi.fn();
    el.addEventListener('paste', paste);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(paste).toHaveBeenCalledTimes(1));

    expect(paste.mock.calls[0][0].detail.rows).toEqual([{ name: 'second', note: 'a\r\nb' }]);
  });

  it('첫 셀이 빈 행도 열이 밀리지 않는다', async () => {
    const el = table = await mount();
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue('\tonly note\n');
    const paste = vi.fn();
    el.addEventListener('paste', paste);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(paste).toHaveBeenCalledTimes(1));

    expect(paste.mock.calls[0][0].detail.rows).toEqual([{ name: '', note: 'only note' }]);
  });
});
