// src/components/u-rich-table/styles.ts
import { css } from 'lit';

export const richTableStyles = css`
  :host {
    display: block;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: var(--u-txt-color, #0f172a);
    border: 1px solid var(--u-border-color, #e2e8f0);
    border-radius: 8px;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--u-neutral-50, #f8fafc);
    border-bottom: 1px solid var(--u-border-color, #e2e8f0);
  }

  .toolbar .selection-info {
    font-size: 12px;
    /* 역할 토큰으로 옮기지 않는다 — --u-txt-color-weak 는 라이트에서
       neutral-500(#9E9E9E) = 흰 배경 대비 2.68 로 WCAG AA(4.5) 미달이다.
       이 값(#64748b)은 4.76 로 AA 를 통과한다. 다크 쪽은 역할 토큰이 5.43 으로
       정상이므로, 아래 다크 규칙에서만 --u-txt-color-weak 를 쓴다.
       ⇒ 업스트림에서 라이트 매핑이 neutral-600(4.61)으로 고쳐지면 이 예외는 사라진다. */
    color: #64748b;
  }

  .toolbar .search-input {
    padding: 4px 10px;
    border: 1px solid var(--u-input-border-color, #d1d5db);
    border-radius: 4px;
    font-size: 12px;
    outline: none;
  }

  .toolbar .search-input:focus {
    border-color: var(--u-input-border-color-focus, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .toolbar .btn {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    /* 예외 — "색 배경 위의 글자" 역할 토큰이 없다. --u-txt-color-inverse 는
       다크에서 neutral-100(#121212) 이라 파랑/초록 버튼 위에서 읽히지 않는다.
       버튼 배경은 두 테마 모두 유채색이므로 흰 글자가 맞다. */
    color: white;
  }

  .toolbar .btn-primary { background: var(--u-primary-color, #3b82f6); }
  .toolbar .btn-primary:hover { background: var(--u-primary-color-strong, #2563eb); }
  .toolbar .btn-success { background: var(--u-success-color, #10b981); }
  .toolbar .btn-success:hover { background: var(--u-success-color-strong, #059669); }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    padding: 8px;
    background: var(--u-neutral-100, #f1f5f9);
    font-weight: 600;
    text-align: left;
    border-bottom: 2px solid var(--u-border-color, #e2e8f0);
    user-select: none;
    position: relative;
  }

  thead th.sortable {
    cursor: pointer;
  }

  thead th.sortable:hover {
    background: var(--u-bg-color-active, #e2e8f0);
  }

  .sort-indicator {
    font-size: 10px;
    color: var(--u-txt-color-weak, #94a3b8);
    margin-left: 4px;
  }

  .filter-row td {
    padding: 4px;
    background: var(--u-yellow-0, #fefce8);
    border-bottom: 1px solid var(--u-border-color, #e2e8f0);
  }

  .filter-row input,
  .filter-row select {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid var(--u-input-border-color, #d1d5db);
    border-radius: 3px;
    font-size: 11px;
    outline: none;
  }

  tbody tr {
    border-bottom: 1px solid var(--u-border-color-weak, #e2e8f0);
  }

  tbody tr:hover {
    background: var(--u-bg-color-hover, #f8fafc);
  }

  tbody tr.selected {
    background: var(--u-blue-0, #eff6ff);
  }

  tbody tr.focused td.focused-cell {
    outline: 2px solid var(--u-primary-color, #3b82f6);
    outline-offset: -2px;
  }

  tbody tr.editing {
    background: var(--u-yellow-0, #fefce8);
    outline: 2px solid var(--u-warning-color-weak, #eab308);
  }

  tbody tr.error {
    background: var(--u-red-0, #fef2f2);
  }

  tbody td {
    padding: 8px;
  }

  tbody td .cell-edit-input {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid var(--u-primary-color, #3b82f6);
    border-radius: 3px;
    font-size: 13px;
    outline: none;
  }

  tbody td .cell-edit-input.invalid {
    border-color: var(--u-danger-color, #ef4444);
  }

  .validation-error {
    font-size: 10px;
    color: var(--u-danger-color, #ef4444);
    margin-top: 2px;
  }

  .checkbox-cell {
    width: 40px;
    text-align: center;
  }

  .expand-cell {
    width: 30px;
    text-align: center;
    cursor: pointer;
    color: var(--u-txt-color-weak, #94a3b8);
  }

  .expand-cell:hover {
    color: var(--u-primary-color, #3b82f6);
  }

  .actions-cell {
    width: 60px;
    text-align: center;
  }

  .new-row td {
    padding: 4px 8px;
    background: var(--u-green-0, #f0fdf4);
    opacity: 0.8;
  }

  .new-row input {
    width: 100%;
    padding: 4px 6px;
    border: 1px dashed var(--u-success-color-weaker, #86efac);
    border-radius: 3px;
    background: transparent;
    font-size: 12px;
    /* 역할 토큰으로 옮기지 않는다 — --u-txt-color-weak 는 라이트에서
       neutral-500(#9E9E9E) = 흰 배경 대비 2.68 로 WCAG AA(4.5) 미달이다.
       이 값(#6b7280)은 4.83 로 AA 를 통과한다. 다크 쪽은 역할 토큰이 5.43 으로
       정상이므로, 아래 다크 규칙에서만 --u-txt-color-weak 를 쓴다.
       ⇒ 업스트림에서 라이트 매핑이 neutral-600(4.61)으로 고쳐지면 이 예외는 사라진다. */
    color: #6b7280;
    outline: none;
  }

  .new-row input:focus {
    border-color: var(--u-success-color, #10b981);
    background: var(--u-bg-color, white);
    opacity: 1;
  }

  .detail-row td {
    padding: 8px 8px 8px 70px;
    background: var(--u-neutral-50, #f8fafc);
    border-bottom: 2px solid var(--u-border-color, #e2e8f0);
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--u-neutral-50, #f8fafc);
    border-top: 1px solid var(--u-border-color, #e2e8f0);
    font-size: 12px;
    /* 역할 토큰으로 옮기지 않는다 — --u-txt-color-weak 는 라이트에서
       neutral-500(#9E9E9E) = 흰 배경 대비 2.68 로 WCAG AA(4.5) 미달이다.
       이 값(#64748b)은 4.76 로 AA 를 통과한다. 다크 쪽은 역할 토큰이 5.43 으로
       정상이므로, 아래 다크 규칙에서만 --u-txt-color-weak 를 쓴다.
       ⇒ 업스트림에서 라이트 매핑이 neutral-600(4.61)으로 고쳐지면 이 예외는 사라진다. */
    color: #64748b;
  }

  .pagination .page-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .pagination button {
    padding: 2px 8px;
    border: 1px solid var(--u-input-border-color, #d1d5db);
    border-radius: 3px;
    background: var(--u-bg-color, white);
    font-size: 11px;
    cursor: pointer;
  }

  .pagination button.active {
    background: var(--u-primary-color, #3b82f6);
    color: var(--u-txt-color-inverse, white);
    border-color: var(--u-input-border-color-focus, #3b82f6);
  }

  .pagination select {
    padding: 2px 4px;
    border: 1px solid var(--u-input-border-color, #d1d5db);
    border-radius: 3px;
    font-size: 11px;
    margin-left: 8px;
  }

  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    /* 역할 토큰으로 옮기지 않는다 — --u-txt-color-weak 는 라이트에서
       neutral-500(#9E9E9E) = 흰 배경 대비 2.68 로 WCAG AA(4.5) 미달이다.
       이 값(#6b7280)은 4.83 로 AA 를 통과한다. 다크 쪽은 역할 토큰이 5.43 으로
       정상이므로, 아래 다크 규칙에서만 --u-txt-color-weak 를 쓴다.
       ⇒ 업스트림에서 라이트 매핑이 neutral-600(4.61)으로 고쳐지면 이 예외는 사라진다. */
    color: #6b7280;
  }

  .empty-message {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--u-txt-color-weak, #9ca3af);
  }

  /* ── 다크 보정 ──
     ⚠**여기 남은 규칙은 "다크 테마 구현"이 아니다.** 역할 토큰의 중립 계열은 두 테마에서
     서로 다른 팔레트 단에 매핑돼 있어(--u-bg-color = neutral-0 라이트 / neutral-100 다크,
     --u-border-color = neutral-300 / neutral-400) 테마 보정이 토큰 층에 이미 들어 있다.
     그래서 base 규칙 하나로 두 테마가 성립한다.

     종전에는 이 자리에 57개 선언이 있었고, base 레이어가 토큰을 전혀 쓰지 않았기 때문에
     (Tailwind 계열 hex 하드코딩) 다크를 통째로 재구현할 수밖에 없었다. base 를 역할 토큰으로
     옮기면서 그 대부분이 불필요해졌다.

     남긴 것은 역할 층에 자리가 없는 둘뿐이다:

     ⑴ **표면 높이 축이 없다.** 배경 역할 토큰은 상호작용 상태 이름(-hover/-active/
        -disabled)뿐이라 "바탕보다 한 단 올라온 면"을 뜻하는 토큰이 없다. 라이트에서는
        neutral-50/100 이 흰 바탕 위에서 충분히 읽히지만, 다크에서는 그 단이 각각
        #0A0A0A/#121212 로 거의 검정이라 툴바·헤더·페이지네이션이 배경에 묻힌다.

     ⑵ **--u-txt-color-weak 의 라이트 매핑이 WCAG AA 에 미달한다.** 라이트는
        neutral-500(#9E9E9E) = 흰 배경 대비 2.68 로 AA(4.5) 미달이고, 다크는
        neutral-700(#8A8A8A) = 5.43 으로 정상이다. 그래서 base 는 AA 를 통과하는
        고정값을 유지하고, **다크에서만** 역할 토큰을 쓴다.
        ⇒ 업스트림 라이트 매핑이 neutral-600(4.61)으로 고쳐지면 이 넷은 사라진다.

     ⚠:host-context 는 Firefox/Safari 미지원이다. 그러나 위 base 마이그레이션으로
     **색의 대부분이 이제 토큰 층에서 테마를 따르므로**, 그 브라우저에서도 다크가
     동작한다 — 종전에는 이 블록이 전부였기 때문에 다크가 아예 없었다. */

  :host-context([theme="dark"]) .toolbar,
  :host-context([theme="dark"]) thead th,
  :host-context([theme="dark"]) .detail-row td,
  :host-context([theme="dark"]) .pagination {
    background: var(--u-neutral-200, #1E1E1E);
  }

  :host-context([theme="dark"]) .pagination button {
    background: var(--u-neutral-300, #2A2A2A);
  }

  :host-context([theme="dark"]) .toolbar .selection-info,
  :host-context([theme="dark"]) .pagination,
  :host-context([theme="dark"]) .loading-overlay,
  :host-context([theme="dark"]) .new-row input {
    color: var(--u-txt-color-weak, #8A8A8A);
  }
`;
