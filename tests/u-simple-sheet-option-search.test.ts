// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { USimpleSheet } from '../src/components/simple-sheet/USimpleSheet.js';

/**
 * 칸의 후보 목록은 선택기 · 표 필터와 같은 검색 일치로 거른다(components `Locale.matchesSearch`) — 대소문자 · 발음 기호 접기,
 * 한글 초성, 조합 중인 마지막 음절은 자모 앞부분(치는 도중의 «성» 이 «서울» 을 남긴다), 확정되면 음절 그대로.
 */
describe('USimpleSheet — 후보 목록 거르기', () => {
  let sheet: USimpleSheet | undefined;
  afterEach(() => { sheet?.remove(); sheet = undefined; });

  const mount = async (options: string[]) => {
    const el = sheet = new USimpleSheet();
    el.columns = [{ options }];
    el.rows = 1;
    document.body.appendChild(el);
    await el.updateComplete;
    const container = el.shadowRoot!.querySelector<HTMLElement>('[tabindex="0"]')!;
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true, composed: true, cancelable: true }));
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-input')!;
    const items = () => [...el.shadowRoot!.querySelectorAll('.dropdown-item')].map((o) => o.textContent!.trim());
    const type = async (value: string, composing = false) => {
      input.value = value;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: composing }));
      await el.updateComplete;
    };
    const commit = async () => {
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: input.value }));
      await el.updateComplete;
    };
    return { el, items, type, commit };
  };

  it('대소문자 · 발음 기호를 접는다', async () => {
    const { items, type } = await mount(['Müller', 'Zoë', 'Smith']);
    await type('MULLER');
    expect(items()).toEqual(['Müller']);
    await type('zoe');
    expect(items()).toEqual(['Zoë']);
  });

  it('한글 초성으로 찾는다', async () => {
    const { items, type } = await mount(['서울', '부산', '대전']);
    await type('ㅂㅅ');
    expect(items()).toEqual(['부산']);
  });

  it('조합 중인 음절은 자모 앞부분으로, 확정되면 음절 그대로', async () => {
    const { items, type, commit } = await mount(['서울', '성남', '대전']);
    await type('성', true);
    expect(items()).toEqual(['서울', '성남']);
    await type('서', true);
    expect(items()).toEqual(['서울', '성남']);
    await commit();
    expect(items()).toEqual(['서울']);
  });
});
