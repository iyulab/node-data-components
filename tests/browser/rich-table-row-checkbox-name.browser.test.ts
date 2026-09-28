import { describe, it, afterEach, expect } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-rich-table/URichTable';

/**
 * 행 선택 체크박스의 접근성 이름 — WCAG 2.1 SC 4.1.2 (Name, Role, Value).
 *
 * 머리글의 전체 선택에는 이름이 있는데 행마다의 체크박스는 이름이 없어, 스크린리더가 «체크박스,
 * 선택 안 됨» 만 읽었다. 이름은 행을 가리키지 않아도 된다 — 표 안의 칸이라 스크린리더가 행 탐색으로
 * 그 행의 다른 칸을 함께 준다(흔한 데이터 그리드의 «Select row» 와 같은 규칙).
 */

type Table = HTMLElement & {
  columns: Record<string, unknown>[];
  data: Record<string, unknown>[];
  updateComplete: Promise<unknown>;
  requestUpdate(): void;
};

afterEach(() => {
  document.body.replaceChildren();
  Locale.set('en');
});

async function mount(): Promise<Table> {
  const el = document.createElement('u-rich-table') as unknown as Table;
  el.setAttribute('selectable', '');
  el.columns = [{ key: 'name', label: 'Name' }];
  el.data = [{ _id: 'a', name: 'A' }, { _id: 'b', name: 'B' }];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const rowBoxes = (el: Table) =>
  [...el.shadowRoot!.querySelectorAll<HTMLInputElement>('tbody td.checkbox-cell input[type="checkbox"]')];

describe('u-rich-table row checkbox name', () => {
  it('every row checkbox has a name, and it follows the locale', async () => {
    Locale.set('en');
    const el = await mount();
    const boxes = rowBoxes(el);
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box.getAttribute('aria-label')).toBe('Select row');

    Locale.set('ko');
    el.requestUpdate();
    await el.updateComplete;
    for (const box of rowBoxes(el)) expect(box.getAttribute('aria-label')).toBe('행 선택');
  });
});
