// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { USimpleSheet } from '../src/components/simple-sheet/USimpleSheet.js';

/**
 * docket #150 — Ctrl+C 복사가 동작하지 않는 결함의 회귀 테스트.
 *
 * 근본원인: 셀 선택이 `_sel`(내부 상태)로만 관리되고 실제 브라우저 텍스트 선택(Range)을
 * 만들지 않아, 네이티브 `copy` 이벤트가 절대 발생하지 않았다(모든 주요 브라우저의 표준
 * 동작). `_onContainerKeyDown`은 Ctrl+C/V를 명시 감지하지 않고 통과시키고 있었다.
 * 형제 컴포넌트 `URichTable`은 이미 Clipboard API 직접 호출 패턴으로 구현돼 있다.
 */

function mount(data: string[][] = [['a', 'b'], ['c', 'd']]): USimpleSheet {
  const el = new USimpleSheet();
  el.data = data;
  document.body.appendChild(el);
  return el;
}

async function focusContainer(el: USimpleSheet): Promise<HTMLElement> {
  await el.updateComplete;
  const container = el.shadowRoot!.querySelector('.sheet-container') as HTMLElement;
  container.dispatchEvent(new FocusEvent('focus'));
  await el.updateComplete;
  return container;
}

describe('USimpleSheet 클립보드 (docket #150)', () => {
  let writeText: ReturnType<typeof vi.fn>;
  let readText: ReturnType<typeof vi.fn>;
  let sheet: USimpleSheet | undefined;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    readText = vi.fn().mockResolvedValue('');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText, readText },
      configurable: true,
    });
  });

  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
  });

  it('실제 DOM 선택(Range) 없이도 Ctrl+C가 선택 영역을 Clipboard API로 복사한다', async () => {
    const el = sheet = mount();
    const container = await focusContainer(el); // 포커스만으로 (0,0) 셀이 선택된다

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('a');
  });

  it('Ctrl+V가 Clipboard API에서 읽은 TSV를 선택 위치부터 붙여넣는다', async () => {
    const el = sheet = mount();
    const container = await focusContainer(el);
    readText.mockResolvedValue('x\ty');

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(el.getData()[0].slice(0, 2)).toEqual(['x', 'y']));

    expect(readText).toHaveBeenCalledTimes(1);
  });

  it('readonly 상태에서는 Ctrl+V가 데이터를 바꾸지 않는다', async () => {
    const el = sheet = mount();
    el.readonly = true;
    const container = await focusContainer(el);
    readText.mockResolvedValue('x\ty');

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(readText).not.toHaveBeenCalled();
    expect(el.getData()[0].slice(0, 2)).toEqual(['a', 'b']);
  });

  it('열 단위 readonly(readonly: true) 컬럼은 Ctrl+V로도 덮어써지지 않는다 (docket #160)', async () => {
    const el = sheet = mount();
    el.columns = [{ readonly: true }, {}];
    const container = await focusContainer(el); // (0,0)이 앵커 — 0번 컬럼은 readonly
    readText.mockResolvedValue('x\ty');

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(el.getData()[0][1]).toBe('y'));

    expect(el.getData()[0][0]).toBe('a');
  });

  it('선택이 없으면 Ctrl+C가 아무것도 복사하지 않는다', async () => {
    const el = sheet = mount();
    await el.updateComplete;
    const container = el.shadowRoot!.querySelector('.sheet-container') as HTMLElement;
    // 포커스를 주지 않아 _sel이 null인 상태 그대로 유지

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));

    expect(writeText).not.toHaveBeenCalled();
  });

  it('Clipboard API가 거부(권한 등)되면 조용히 죽지 않고 clipboard-error를 낸다', async () => {
    const el = sheet = mount();
    const container = await focusContainer(el);
    writeText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    const handler = vi.fn();
    el.addEventListener('clipboard-error', handler);

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    expect(handler.mock.calls[0][0].detail.action).toBe('copy');
  });
});
