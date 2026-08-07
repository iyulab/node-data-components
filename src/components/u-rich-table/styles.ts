// src/components/u-rich-table/styles.ts
import { css } from 'lit';

export const richTableStyles = css`
  :host {
    /* ── 소비자 조절점 — 보조 전경 ──
       ★이 패키지 표 셋의 보조 전경이 전부 --u-txt-color-weak 직독이라 «표 안에서만»
       조절할 방법이 없었다(소비자 토큰 0 · part 0). 소비앱은 한 제품 안에 표를 넷 두는데,
       그중 업스트림 표만 조절되지 않으면 나머지에 맞출 수가 없다.
       ⚠**한 토큰으로 접지 않는다** — 실측상 역할이 갈리고, 접으면 "읽기 전용 셀만 진하게"
       같은 요청이 원리적으로 불가능해진다. 그것이 이 요청의 발단이었다.
       ⚠**이 컴포넌트가 «읽는» 단만 선언한다.** 다섯을 어디서나 선언하면 소비자가 바꿔도
       아무 일이 없는 자리가 생긴다 — 이 리포가 반복해서 본 «토큰 존재 ≠ 배선»이다.
       ⚠**다크 블록에 다시 선언하지 않는다.** --u-txt-color-weak 자체가 테마 변형이므로
       시트가 있으면 따라온다. 이 패키지의 다크 블록이 «비어 있는 것»이 목표 상태다.
       ⚠**폴백 리터럴은 라이트 시트 값의 복제다**(루트 tokens:sync 가 대조한다). */
    --dc-muted-color: var(--u-txt-color-weak, #757575);   /* 보조 텍스트 · 라벨 */
    --dc-icon-color:  var(--u-txt-color-weak, #757575);   /* 정렬 표시 · 확장 · 행 메뉴 */
    --dc-empty-color: var(--u-txt-color-weak, #757575);   /* 빈 상태 안내문 */
    /* ── 세로 레이아웃 ──
       🔴**높이 제약은 데이터 그리드의 기본 사용 형태다** — 「조회 조건 + 결과 목록」이 한 화면에
       들어가야 하고, 결과가 몇 건이든 조건 영역과 페이지 이동은 항상 같은 자리에 있어야 한다.
       종전에는 «display: block» 이라 호스트에 높이를 주면 내용이 자연 높이로 넘쳤고,
       «overflow: hidden» 때문에 **넘친 부분에 도달할 방법이 없었다.** 페이지네이션이 마지막
       자식이므로 **가장 먼저 사라진다** ⇒ *표는 그려지는데 2페이지로 갈 수 없었다.*
       ⚠**높이를 주지 않는 사용은 그대로다** — «flex: 1 1 auto» 는 제약이 없으면 내용 높이를
       따르고 «overflow: auto» 는 넘치지 않으면 스크롤바를 만들지 않는다. */
    display: flex;
    flex-direction: column;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: var(--u-txt-color, #212121);
    border: 1px solid var(--u-border-color, #E0E0E0);
    border-radius: 8px;
    overflow: hidden;
  }

  /* 행 영역만 스크롤한다 — 툴바와 페이지네이션은 자리를 지킨다. */
  .table-wrap {
    flex: 1 1 auto;
    overflow: auto;
    min-height: 0;   /* ⚠flex 아이템의 기본 min-height:auto 는 «줄어들지 않음»이라 이것이 없으면 넘친다 */
  }

  .toolbar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--u-bg-color-raised, #FAFAFA);
    border-bottom: 1px solid var(--u-border-color, #E0E0E0);
  }

  .toolbar .selection-info {
    font-size: 12px;
    color: var(--dc-muted-color);
  }

  .toolbar .search-input {
    padding: 4px 10px;
    border: 1px solid var(--u-input-border-color, #E0E0E0);
    border-radius: 4px;
    font-size: 12px;
    outline: none;
  }

  .toolbar .search-input:focus {
    border-color: var(--u-input-border-color-focus, #1565C0);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--u-primary-color-strong, #1565C0) 20%, transparent);
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

  .toolbar .btn-primary { background: var(--u-primary-color, #1976D2); }
  .toolbar .btn-primary:hover { background: var(--u-primary-color-strong, #1565C0); }
  .toolbar .btn-success { background: var(--u-success-color, #2E7D32); }
  .toolbar .btn-success:hover { background: var(--u-success-color-strong, #1B5E20); }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    padding: 8px;
    background: var(--u-bg-color-raised, #FAFAFA);
    font-weight: 600;
    text-align: left;
    user-select: none;

    /* ⚠**아래 경계선을 «border-bottom» 으로 그리지 않는다.** «border-collapse: collapse» 에서
       셀 테두리는 테이블이 소유하므로 **헤더만 sticky 로 띄우면 함께 따라오지 않는다** —
       스크롤하는 순간 구분선이 사라지고 행이 헤더 밑으로 비쳐 지나간다. «box-shadow» 는
       요소가 그리므로 sticky 를 따라온다. */
    box-shadow: inset 0 -2px 0 var(--u-border-color, #E0E0E0);

    /* 행 영역이 스크롤되는 동안 열 이름은 남는다 — 「어느 열이 무엇인지」가 이 컴포넌트의
       스크롤 모델에서 잃으면 안 되는 것이다. */
    position: sticky;
    top: 0;
    z-index: 1;
  }

  thead th.sortable {
    cursor: pointer;
  }

  thead th.sortable:hover {
    background: var(--u-bg-color-active, #EEEEEE);
  }

  .sort-indicator {
    font-size: 10px;
    color: var(--dc-icon-color);
    margin-left: 4px;
  }

  .filter-row td {
    padding: 4px;
    background: var(--u-yellow-0, #FFFDE7);
    border-bottom: 1px solid var(--u-border-color, #E0E0E0);
  }

  .filter-row input,
  .filter-row select {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid var(--u-input-border-color, #E0E0E0);
    border-radius: 3px;
    font-size: 11px;
    outline: none;
  }

  tbody tr {
    border-bottom: 1px solid var(--u-border-color-weak, #EEEEEE);
  }

  tbody tr:hover {
    background: var(--u-bg-color-hover, #F5F5F5);
  }

  tbody tr.selected {
    background: var(--u-primary-bg-color, #E3F2FD);
  }

  tbody tr.focused td.focused-cell {
    outline: 2px solid var(--u-primary-color, #1976D2);
    outline-offset: -2px;
  }

  tbody tr.editing {
    background: var(--u-yellow-0, #FFFDE7);
    outline: 2px solid var(--u-warning-color-weak, #FFEB3B);
  }

  tbody tr.error {
    background: var(--u-danger-bg-color, #FFEBEE);
  }

  tbody td {
    padding: 8px;
  }

  tbody td .cell-edit-input {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid var(--u-primary-color, #1976D2);
    border-radius: 3px;
    font-size: 13px;
    outline: none;
  }

  tbody td .cell-edit-input.invalid {
    border-color: var(--u-danger-color, #D32F2F);
  }

  .validation-error {
    font-size: 10px;
    color: var(--u-danger-color, #D32F2F);
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
    color: var(--dc-icon-color);
  }

  .expand-cell:hover {
    color: var(--u-primary-color, #1976D2);
  }

  .actions-cell {
    width: 60px;
    text-align: center;
  }

  .new-row td {
    padding: 4px 8px;
    background: var(--u-success-bg-color, #E8F5E9);
    opacity: 0.8;
  }

  .new-row input {
    width: 100%;
    padding: 4px 6px;
    border: 1px dashed var(--u-success-color-weaker, #81C784);
    border-radius: 3px;
    background: transparent;
    font-size: 12px;
    color: var(--dc-muted-color);
    outline: none;
  }

  .new-row input:focus {
    border-color: var(--u-success-color, #2E7D32);
    background: var(--u-bg-color, #FFFFFF);
    opacity: 1;
  }

  .detail-row td {
    padding: 8px 8px 8px 70px;
    background: var(--u-bg-color-raised, #FAFAFA);
    border-bottom: 2px solid var(--u-border-color, #E0E0E0);
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .pagination {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--u-bg-color-raised, #FAFAFA);
    border-top: 1px solid var(--u-border-color, #E0E0E0);
    font-size: 12px;
    color: var(--dc-muted-color);
  }

  .pagination .page-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .pagination button {
    padding: 2px 8px;
    border: 1px solid var(--u-input-border-color, #E0E0E0);
    border-radius: 3px;
    /* 크롬 면 위의 컨트롤이다 — 면과 같은 단이면 묻힌다. 입력 계열은 두 테마 모두
       크롬 면보다 한 단 안쪽이라(라이트 흰색 / 다크 #1E1E1E) 자연히 구분된다. */
    background: var(--u-input-bg-color, #FFFFFF);
    font-size: 11px;
    cursor: pointer;
  }

  .pagination button.active {
    background: var(--u-primary-color, #1976D2);
    color: var(--u-txt-color-inverse, #FFFFFF);
    border-color: var(--u-input-border-color-focus, #1565C0);
  }

  .pagination select {
    padding: 2px 4px;
    border: 1px solid var(--u-input-border-color, #E0E0E0);
    border-radius: 3px;
    font-size: 11px;
    margin-left: 8px;
  }

  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--dc-muted-color);
  }

  .empty-message {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--dc-empty-color);
  }


  /* 종전에는 아래 셋이 템플릿 안에 style="…#94a3b8" 형태로 박혀 있었다.
     .styles.ts 만 훑는 정리로는 보이지 않는 자리다. */
  .row-menu {
    cursor: pointer;
    color: var(--dc-icon-color);
  }

  .row-error-cell {
    padding: 2px 8px;
    background: var(--u-danger-bg-color, #FFEBEE);
    color: var(--u-danger-color, #D32F2F);
    font-size: 11px;
  }

  .new-row-marker {
    color: var(--u-success-color-weaker, #81C784);
  }

  /* ── 다크 보정 ──
     ★**이 블록은 비어 있다. 그것이 목표 상태다.**

     종전에는 여기 57개 선언이 있었고, base 레이어가 토큰을 전혀 쓰지 않아(하드코딩 hex)
     다크를 통째로 재구현할 수밖에 없었다. base 를 역할 토큰으로 옮기며 대부분이 사라졌고,
     마지막까지 남은 것은 **표면 높이 축의 부재** 하나였다 — 배경 역할 토큰이 상호작용
     상태 이름(-hover/-active/-disabled)뿐이라 "바탕보다 한 단 올라온 면"을 뜻할 수단이
     없었다. 라이트에서는 neutral-50/100 이 흰 바탕 위에서 읽히지만 다크에서는 그 단이
     #0A0A0A/#121212 로 거의 검정이라 툴바·헤더·페이지네이션이 배경에 묻혔다.

     @iyulab/components 1.18.0 이 --u-bg-color-raised 를 신설해 그 자리를 채웠고,
     base 규칙이 그것을 쓰므로 다크 전용 규칙이 필요 없다.

     ⇒ **부수 효과로 Firefox·Safari 의 다크가 완성된다.** :host-context 는 그 둘에서
     미지원이라 이 블록의 색은 애초에 적용된 적이 없었다. 토큰 층은 브라우저를 가리지 않는다. */
`;
