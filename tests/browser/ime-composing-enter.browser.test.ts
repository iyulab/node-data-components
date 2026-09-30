import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/simple-sheet/USimpleSheet';
import '../../src/components/u-record-picker/URecordPicker';

/**
 * IME 조합(한국어 등)을 확정하는 Enter 는 확정·이동·찾기가 아니다.
 * 조합 중 keydown 은 `isComposing: true`, Safari 의 확정 키는 `keyCode: 229` 로 온다 — 둘 다 잰다.
 * 대조군(보통 Enter)이 같은 합성 경로로 핸들러에 닿는 것을 함께 확인한다.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (k: string, init: KeyboardEventInit & { keyCode?: number } = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  if (init.keyCode !== undefined) Object.defineProperty(e, 'keyCode', { value: init.keyCode });
  return e;
};
const COMPOSING = [
  ['isComposing', { isComposing: true }],
  ['keyCode 229(Safari)', { keyCode: 229 }],
] as const;

type Sheet = HTMLElement & { data: string[][]; updateComplete: Promise<unknown> };

async function editingSheet() {
  const sheet = document.createElement('u-simple-sheet') as Sheet;
  sheet.data = [['가', 'b'], ['c', 'd']];
  document.body.appendChild(sheet);
  await sheet.updateComplete;
  (sheet as unknown as { _startEdit(r: number, c: number): void })._startEdit(0, 0);
  await sheet.updateComplete;
  await sleep(30);
  return { sheet, input: () => sheet.shadowRoot!.querySelector('.cell-input') as HTMLInputElement | null };
}

describe('USimpleSheet — 편집 중 조합을 확정하는 Enter 로 확정하지 않는다', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it.each(COMPOSING)('%s', async (_n, init) => {
    const { sheet, input } = await editingSheet();
    input()!.dispatchEvent(key('Enter', init));
    await sheet.updateComplete;
    expect(input(), '여전히 편집 중').not.toBeNull();
  });

  it('대조군 — 보통 Enter 는 확정한다', async () => {
    const { sheet, input } = await editingSheet();
    input()!.dispatchEvent(key('Enter', { keyCode: 13 }));
    await sheet.updateComplete;
    expect(input()).toBeNull();
  });
});

type Picker = HTMLElement & {
  search: (q: string) => Promise<{ id: string; label: string }[]>;
  columns: { key: string; label: string }[];
  updateComplete: Promise<unknown>;
};

async function picker() {
  const p = document.createElement('u-record-picker') as Picker;
  p.search = async () => [];
  p.columns = [{ key: 'label', label: 'Name' }];
  document.body.appendChild(p);
  await p.updateComplete;
  await sleep(60);
  const input = p.shadowRoot!.querySelector('.main-input') as HTMLInputElement;
  const dialogOpen = () => p.shadowRoot!.querySelector('u-dialog')!.hasAttribute('open');
  return { input, dialogOpen };
}

describe('u-record-picker — 조합을 확정하는 Enter 로 조회 대화상자를 열지 않는다', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it.each(COMPOSING)('%s', async (_n, init) => {
    const { input, dialogOpen } = await picker();
    input.dispatchEvent(key('Enter', init));
    await sleep(200);
    expect(dialogOpen()).toBe(false);
  });

  it('대조군 — 보통 Enter 는 대화상자를 연다', async () => {
    const { input, dialogOpen } = await picker();
    input.dispatchEvent(key('Enter', { keyCode: 13 }));
    for (let i = 0; i < 50 && !dialogOpen(); i++) await sleep(20);
    expect(dialogOpen()).toBe(true);
  });
});
