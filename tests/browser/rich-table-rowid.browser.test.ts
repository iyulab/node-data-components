import { describe, it, expect, afterEach } from 'vitest';
import '../../src/components/u-rich-table/URichTable';

/**
 * URichTable 은 행 식별에 `_id` 를 쓴다 — 선택·확장·행 오류 상태가 전부 이 값으로 추적된다.
 *
 * ★이 파일이 생긴 이유: `_id` 는 **어디서도 부여되지 않는데** 코드는 그것이 있다고 가정하고
 * 있었다. 소비자가 넣어 주지 않으면 모든 행의 `_id` 가 `undefined` 가 되고, Set 은 그
 * 하나만 담으므로 **한 행을 고르면 전부 골라졌다.** 세 행짜리 표에서 실측해 확인했다.
 *
 * 이제는 `_id` 가 없으면 위치로 식별하고 개발 경고를 낸다. 위치 기반 식별은 데이터가
 * 재정렬·재페이징되면 선택이 다른 행으로 옮겨가므로 **대체재가 아니라 안전망**이다 —
 * 정렬/필터/페이지가 소비자 책임인 컴포넌트이니 실제 사용에서는 `_id` 를 주어야 한다.
 */

afterEach(() => document.body.replaceChildren());

type Rich = HTMLElement & {
  columns: unknown[]; data: Record<string, unknown>[];
  selectable: boolean; updateComplete: Promise<unknown>;
};

async function mount(data: Record<string, unknown>[]) {
  const el = document.createElement('u-rich-table') as Rich;
  el.columns = [{ key: 'a', label: 'A' }];
  el.data = data;
  el.selectable = true;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const rowChecks = (el: Rich) =>
  Array.from(
    el.shadowRoot!.querySelectorAll<HTMLInputElement>('tbody .checkbox-cell input'),
  );

describe('URichTable 행 식별 계약', () => {
  it('★[회귀] _id 가 없어도 한 행만 선택된다', async () => {
    const warn = console.warn;
    const seen: string[] = [];
    console.warn = (...a: unknown[]) => { seen.push(String(a[0])); };
    try {
      const el = await mount([{ a: 1 }, { a: 2 }, { a: 3 }]);
      const boxes = rowChecks(el);
      expect(boxes.length).toBe(3);

      boxes[0].click();
      await el.updateComplete;

      // 종전에는 여기서 3 이 나왔다 — 모든 행의 _id 가 undefined 였기 때문이다.
      expect(rowChecks(el).filter(b => b.checked).length).toBe(1);
      // 그리고 위치 기반 식별로 떨어졌다는 사실을 개발자가 알아야 한다.
      expect(seen.some(m => m.includes('_id'))).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it('_id 를 주면 한 행만 선택된다', async () => {
    const el = await mount([
      { _id: 'r1', a: 1 }, { _id: 'r2', a: 2 }, { _id: 'r3', a: 3 },
    ]);
    rowChecks(el)[0].click();
    await el.updateComplete;

    const checked = rowChecks(el).filter(b => b.checked).length;
    expect(checked).toBe(1);
  });
});
