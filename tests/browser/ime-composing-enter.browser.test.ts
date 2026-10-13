import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/simple-sheet/USimpleSheet';
import '../../src/components/u-record-picker/URecordPicker';
import { compose, commitWithEnter } from './ime.js';

/**
 * IME 조합(한국어 등)을 확정하는 Enter 는 확정·이동·찾기가 아니다.
 * 조합은 Chromium 의 실제 조합(`ime.ts`)으로 재고, Chromium 이 낼 수 없는 Safari 의 확정 키
 * (`keyCode: 229` · `isComposing: false`)는 합성 대역으로 잰다. 대조군(보통 Enter)이 같은 합성 경로로 핸들러에
 * 닿는 것을 함께 확인한다.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (k: string, init: KeyboardEventInit & { keyCode?: number } = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true, ...init });
  if (init.keyCode !== undefined) Object.defineProperty(e, 'keyCode', { value: init.keyCode });
  return e;
};
const SAFARI = { keyCode: 229 };

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

  it('실제 조합을 Enter 로 확정 — 여전히 편집 중이고 글자는 들어간다', async () => {
    const { sheet, input } = await editingSheet();
    input()!.focus();
    input()!.select();
    await compose(['ㄴ', '나']);
    await commitWithEnter('나');
    await sheet.updateComplete;
    expect(input(), '여전히 편집 중').not.toBeNull();
    expect(input()!.value).toBe('나');
  });

  it('keyCode 229(Safari — 합성 대역)', async () => {
    const { sheet, input } = await editingSheet();
    input()!.dispatchEvent(key('Enter', SAFARI));
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

  it('실제 조합을 Enter 로 확정', async () => {
    const { input, dialogOpen } = await picker();
    input.focus();
    await compose(['ㄱ', '가']);
    await commitWithEnter('가');
    await sleep(200);
    expect(dialogOpen()).toBe(false);
  });

  it('keyCode 229(Safari — 합성 대역)', async () => {
    const { input, dialogOpen } = await picker();
    input.dispatchEvent(key('Enter', SAFARI));
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
