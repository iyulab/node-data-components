// @vitest-environment happy-dom
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import '../src/components/u-rich-table/URichTable';

/**
 * `_handleCopy`/`_handlePaste`는 `navigator.clipboard`의 promise를 그냥 기다리기만 하고
 * 실패를 흡수하지 않았다 — 권한 거부·비보안 컨텍스트에서 unhandled rejection만 남기고
 * 소비자에게는 아무 신호도 가지 않았다. `flex-table`/`u-simple-sheet`(docket #150)와
 * 같은 `clipboard-error` 이벤트로 통일한다.
 */

type Table = HTMLElement & {
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
  setSelection(ids: Iterable<string>): void;
};

const mount = async () => {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = [{ key: 'name', label: 'Name' }];
  el.data = [{ _id: 'r0', name: 'first' }];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

let table: Table | null = null;
beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { table?.remove(); table = null; document.body.innerHTML = ''; });

describe('URichTable — clipboard-error', () => {
  it('Ctrl+C가 Clipboard API에서 거부되면 clipboard-error(action: copy)를 낸다', async () => {
    const el = table = await mount();
    el.setSelection(['r0']);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    const handler = vi.fn();
    el.addEventListener('clipboard-error', handler);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    expect(handler.mock.calls[0][0].detail.action).toBe('copy');
  });

  it('Ctrl+V가 Clipboard API에서 거부되면 clipboard-error(action: paste)를 내고 paste는 안 낸다', async () => {
    const el = table = await mount();
    vi.spyOn(navigator.clipboard, 'readText').mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    const errorHandler = vi.fn();
    const pasteHandler = vi.fn();
    el.addEventListener('clipboard-error', errorHandler);
    el.addEventListener('paste', pasteHandler);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(errorHandler).toHaveBeenCalledTimes(1));

    expect(errorHandler.mock.calls[0][0].detail.action).toBe('paste');
    expect(pasteHandler).not.toHaveBeenCalled();
  });
});
