// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/u-record-picker/URecordPicker';

/**
 * `clearable` 의 지우기 버튼.
 *
 * 🔴**종전에는 그려지기만 하고 동작하지 않았다** — 아이콘에 클릭 핸들러도, 버튼 역할도, 이름도
 * 없어서 마우스로도 키보드로도 쓸 수 없었다. 속성 문서는 *"Show a clear ("x") button when a value
 * is selected"* 라고 적고 있었다. 형태는 `@iyulab/components` 의 `u-input` 지우기 버튼을 따른다.
 */

type Picker = HTMLElement & {
  value?: string;
  clearable: boolean;
  disabled: boolean;
  search: (q: string) => Promise<unknown[]>;
  updateComplete: Promise<unknown>;
};

async function mount(opts: { clearable?: boolean; value?: string; disabled?: boolean } = {}): Promise<Picker> {
  const el = document.createElement('u-record-picker') as Picker;
  el.search = async () => [];
  if (opts.clearable) el.clearable = true;
  if (opts.value !== undefined) el.value = opts.value;
  if (opts.disabled) el.disabled = true;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const clearButton = (el: Picker) => el.shadowRoot!.querySelector<HTMLElement>('.clear-btn')!;
const mainInput = (el: Picker) => el.shadowRoot!.querySelector<HTMLInputElement>('input.main-input')!;

function countChanges(el: Picker): () => number {
  let n = 0;
  el.addEventListener('change', () => n++);
  return () => n;
}

describe('URecordPicker — clear button', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows only when clearable and a value is selected', async () => {
    expect(clearButton(await mount({ value: 'r1' })).hidden).toBe(true);
    expect(clearButton(await mount({ clearable: true })).hidden).toBe(true);
    expect(clearButton(await mount({ clearable: true, value: 'r1', disabled: true })).hidden).toBe(true);
    expect(clearButton(await mount({ clearable: true, value: 'r1' })).hidden).toBe(false);
  });

  it('is exposed as a focusable button with a non-empty name', async () => {
    const btn = clearButton(await mount({ clearable: true, value: 'r1' }));
    expect(btn.getAttribute('role')).toBe('button');
    expect(btn.getAttribute('tabindex')).toBe('0');
    expect(btn.getAttribute('aria-label')?.trim()).toBeTruthy();
  });

  it('clears the selection on click and emits change once', async () => {
    const el = await mount({ clearable: true, value: 'r1' });
    const changes = countChanges(el);

    clearButton(el).click();
    await el.updateComplete;

    expect(el.value).toBeUndefined();
    expect(changes()).toBe(1);
    expect(clearButton(el).hidden).toBe(true);
  });

  it('clears on Enter and on Space, and ignores other keys', async () => {
    for (const key of ['Enter', ' ']) {
      const el = await mount({ clearable: true, value: 'r1' });
      const changes = countChanges(el);
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      clearButton(el).dispatchEvent(ev);
      await el.updateComplete;
      expect(el.value, `key ${JSON.stringify(key)}`).toBeUndefined();
      expect(changes(), `key ${JSON.stringify(key)}`).toBe(1);
      // Space 는 스크롤을, Enter 는 폼 제출을 일으킬 수 있어 기본 동작을 막는다(u-input 과 같다).
      expect(ev.defaultPrevented, `key ${JSON.stringify(key)}`).toBe(true);
    }

    const el = await mount({ clearable: true, value: 'r1' });
    const changes = countChanges(el);
    clearButton(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    await el.updateComplete;
    expect(el.value).toBe('r1');
    expect(changes()).toBe(0);
  });

  it('returns focus to the input, so a keyboard user is not dropped to the page', async () => {
    // 지우면 버튼이 숨는다 — 포커스를 옮기지 않으면 문서 맨 앞으로 떨어진다(WCAG 2.4.3).
    const el = await mount({ clearable: true, value: 'r1' });
    clearButton(el).click();
    await el.updateComplete;
    expect(el.shadowRoot!.activeElement).toBe(mainInput(el));
  });
});
