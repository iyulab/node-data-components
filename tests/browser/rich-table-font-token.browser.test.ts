import { describe, it, expect, afterEach } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * 표의 글꼴이 글자 토큰(`--u-font-base`)을 따르는가 — 계산된 글꼴로 잰다.
 * `:host` 가 `system-ui` 리터럴이라, 하우스 화면 안에서 표의 머리글·셀만 다른 글꼴로 그려졌다.
 */
type Table = HTMLElement & { columns: unknown[]; data: unknown[]; totalCount: number; updateComplete: Promise<unknown> };

let theme: HTMLStyleElement | null = null;
afterEach(() => {
  document.body.replaceChildren();
  theme?.remove();
  theme = null;
});

async function mount(): Promise<Table> {
  const el = document.createElement('u-rich-table') as Table;
  el.columns = [{ key: 'name', label: '이름' }];
  el.data = [{ id: 1, name: '홍길동' }];
  el.totalCount = 1;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('u-rich-table 글꼴', () => {
  it('머리글·셀이 --u-font-base 를 따른다', async () => {
    theme = document.createElement('style');
    theme.textContent = ':root { --u-font-base: Georgia, serif; }';
    document.head.append(theme);
    const el = await mount();
    const th = el.shadowRoot!.querySelector('th:not(.checkbox-cell)')!;
    const td = el.shadowRoot!.querySelector('td:not(.checkbox-cell)')!;
    expect(getComputedStyle(th).fontFamily).toMatch(/^Georgia/);
    expect(getComputedStyle(td).fontFamily).toMatch(/^Georgia/);
  });

  it('NEGATIVE — 토큰이 없으면 종전 묶음(system-ui)', async () => {
    const el = await mount();
    expect(getComputedStyle(el.shadowRoot!.querySelector('td:not(.checkbox-cell)')!).fontFamily).toMatch(/^system-ui/);
  });
});
