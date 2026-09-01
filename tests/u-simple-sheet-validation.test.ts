// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { USimpleSheet, type SheetColumn } from '../src/components/simple-sheet/USimpleSheet.js';

/**
 * docket #167 — `SheetColumn`에 형제 컴포넌트 `URichTable.ColumnDef`와 같은
 * `required`/`validator`가 없어, "필수 입력"·"셀 값 유효성"을 소비앱이 매번
 * `onChange`로 전체 데이터를 순회해 직접 재구현해야 했던 결함(기능 부재)의
 * 회귀 테스트.
 *
 * `validator`의 시그니처는 `URichTable.ColumnDef.validator`(row를 객체로 받음)가
 * 아니라 이 컴포넌트의 기존 `compute`와 동일하게 `(value, rowIndex, data)`다 —
 * 이 컴포넌트의 내부 데이터 모델 자체가 2D 배열이라 객체 row가 존재하지 않는다.
 */

function cell(el: USimpleSheet, r: number, c: number): HTMLElement {
  return el.shadowRoot!.querySelector(`td[data-row="${r}"][data-col="${c}"]`) as HTMLElement;
}

describe('USimpleSheet required/validator (docket #167)', () => {
  let sheet: USimpleSheet | undefined;

  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
  });

  it('required 컬럼의 빈 셀은 cell-invalid 클래스가 붙고, 값이 있으면 붙지 않는다', async () => {
    const columns: SheetColumn[] = [{ key: 'name', required: true }, {}];
    const el = sheet = new USimpleSheet();
    el.columns = columns;
    el.data = [['', 'x'], ['filled', 'y']];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(cell(el, 0, 0).classList.contains('cell-invalid')).toBe(true);
    expect(cell(el, 1, 0).classList.contains('cell-invalid')).toBe(false);
    // required가 아닌 열은 비어 있어도 무관
    expect(cell(el, 0, 1).classList.contains('cell-invalid')).toBe(false);
  });

  it('required 셀은 title 속성으로 메시지를 노출한다', async () => {
    const el = sheet = new USimpleSheet();
    el.columns = [{ key: 'name', required: true }];
    el.data = [['']];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(cell(el, 0, 0).getAttribute('title')).toBeTruthy();
  });

  it('validator가 문자열을 반환하면 그 셀만 invalid로 표시된다', async () => {
    const columns: SheetColumn[] = [
      {
        key: 'age',
        validator: (value) => (value && Number(value) < 0) ? 'must be >= 0' : null,
      },
    ];
    const el = sheet = new USimpleSheet();
    el.columns = columns;
    el.data = [['-5'], ['10'], ['']];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(cell(el, 0, 0).classList.contains('cell-invalid')).toBe(true);
    expect(cell(el, 0, 0).getAttribute('title')).toBe('must be >= 0');
    expect(cell(el, 1, 0).classList.contains('cell-invalid')).toBe(false);
    expect(cell(el, 2, 0).classList.contains('cell-invalid')).toBe(false); // 빈 값은 validator에 그대로 전달되지만 이 예제 콜백 자체가 통과시킴
  });

  it('validator는 compute와 동일한 시그니처(rowIndex, 전체 data)로 호출된다', async () => {
    const validator = vi.fn(() => null);
    const el = sheet = new USimpleSheet();
    el.columns = [{ key: 'a', validator }];
    el.data = [['x'], ['y']];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(validator).toHaveBeenCalledWith('x', 0, el.getData());
    expect(validator).toHaveBeenCalledWith('y', 1, el.getData());
  });

  it('validator가 예외를 던지면 렌더가 깨지지 않고 해당 셀이 invalid로 표시된다', async () => {
    const el = sheet = new USimpleSheet();
    el.columns = [{ key: 'a', validator: () => { throw new Error('boom'); } }];
    el.data = [['x']];
    document.body.appendChild(el);

    await expect(el.updateComplete).resolves.toBeTruthy();
    expect(cell(el, 0, 0).classList.contains('cell-invalid')).toBe(true);
  });

  it('required/validator 둘 다 없는 컬럼은 항상 유효하다', async () => {
    const el = sheet = new USimpleSheet();
    el.columns = [{ key: 'a' }];
    el.data = [['']];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(cell(el, 0, 0).classList.contains('cell-invalid')).toBe(false);
  });

  describe('getValidationErrors()', () => {
    it('required/validator 실패 셀을 전부 { row, col, message } 로 반환한다', async () => {
      const columns: SheetColumn[] = [
        { key: 'name', required: true },
        { key: 'age', validator: (value) => (value && Number(value) < 0) ? 'must be >= 0' : null },
      ];
      const el = sheet = new USimpleSheet();
      el.columns = columns;
      el.rows = 2; // 기본값(20)이 아니라 실제 데이터 행 수로 고정 — 아니면 나머지
                   // 자동 패딩 행도 required 컬럼에서 전부 실패로 잡힌다.
      el.data = [['', '-1'], ['ok', '5']];
      document.body.appendChild(el);
      await el.updateComplete;

      const errors = el.getValidationErrors();
      expect(errors).toHaveLength(2);
      expect(errors).toContainEqual({ row: 0, col: 0, message: expect.any(String) });
      expect(errors).toContainEqual({ row: 0, col: 1, message: 'must be >= 0' });
    });

    it('전부 유효하면 빈 배열을 반환한다', async () => {
      const el = sheet = new USimpleSheet();
      el.columns = [{ key: 'name', required: true }];
      el.rows = 1;
      el.data = [['filled']];
      document.body.appendChild(el);
      await el.updateComplete;

      expect(el.getValidationErrors()).toEqual([]);
    });

    it('데이터가 붙여넣기로 여러 셀이 한 번에 바뀐 뒤에도 최신 상태를 반영한다', async () => {
      const el = sheet = new USimpleSheet();
      el.columns = [{ key: 'name', required: true }];
      el.rows = 1;
      el.data = [['']];
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.getValidationErrors()).toHaveLength(1);

      el.setCell(0, 0, 'now filled');
      await el.updateComplete;
      expect(el.getValidationErrors()).toHaveLength(0);
    });
  });
});
