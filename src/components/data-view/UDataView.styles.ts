import { css } from 'lit';

/* ── 색 규약 ──
   이 컴포넌트는 **역할 토큰만** 읽는다. 다크 전용 규칙은 두지 않는다.

   역할 토큰은 두 테마에서 *다른 팔레트 단*에 매핑돼 있다
   (`--u-bg-color` = neutral-0 라이트 / neutral-100 다크, `--u-border-color` =
   neutral-300 / neutral-400 …). 즉 테마 보정이 토큰 층에 이미 들어 있어서,
   base 규칙 하나로 두 테마가 성립한다.

   ⚠전에는 여기에 다크 전용 블록이 92줄 있었다. 그 블록의 24개 선언은 전부 base 와
   **같은 토큰**을 가리키고 있었고, 따라서 토큰 시트가 로드된 환경에서 계산값을 전혀
   바꾸지 못했다 — 브라우저 스냅샷으로 실증했다(`tests/browser/`). 다른 것은 폴백
   리터럴뿐이었는데, 폴백은 시트가 없을 때만 쓰이고 그때의 규약은 이미
   "라이트 기준 고정값"이다.

   팔레트를 직접 읽어도 되는 예외는 아래 두 곳뿐이며 각각 이유를 달았다. */

/* ── Base ──
   모든 --u-* 토큰에 라이트 기준 폴백을 부여해 토큰 미공급 환경에서도 렌더된다.
   외부에서 --u-* 가 공급되면 그 값이 우선한다. */
const baseStyles = css`
  :host {

    /* ── 소비자 조절점 — 보조 전경 5단 ──
       ★이 셋의 보조 전경이 전부 --u-txt-color-weak 직독이라 «표 안에서만» 조절할 방법이
       없었다(소비자 토큰 0 · part 0). 소비앱은 한 제품 안에 표를 넷 두는데, 그중 업스트림
       표만 조절되지 않으면 나머지에 맞출 수가 없다.
       ⚠**한 토큰으로 접지 않는다** — 실측상 16곳의 역할이 갈리고, 접으면 "읽기 전용 셀만
       진하게" 같은 요청이 원리적으로 불가능해진다. 그것이 이 요청의 발단이었다.
       ⚠**다크 블록에 다시 선언하지 않는다.** --u-txt-color-weak 자체가 테마 변형이므로
       시트가 있으면 따라온다. 이 패키지의 다크 블록이 «비어 있는 것»이 목표 상태다.
       ⚠**폴백 리터럴은 라이트 시트 값의 복제다**(루트 tokens:sync 가 대조한다).
       ⚠**이 컴포넌트가 «읽는» 단만 선언한다.** 다섯을 어디서나 선언하면 소비자가
       바꿔도 아무 일이 없는 자리가 생긴다 — 이 리포가 반복해서 본 «토큰 존재 ≠ 배선»
       이다. 어느 단이 어디에 있는지는 README 의 표가 정본이다. */
    --dc-muted-color:    var(--u-txt-color-weak, #757575);   /* 보조 텍스트 · 라벨 */
    --dc-header-color:   var(--u-txt-color-weak, #757575);   /* 열 머리 · 행 머리 */
    --dc-empty-color:    var(--u-txt-color-weak, #757575);   /* 빈 상태 안내문 */
    display: block;
    width: 100%;
  }

  .data-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--u-bg-color, #FFFFFF);
    border: 1px solid var(--u-border-color, #E0E0E0);
    border-radius: 8px;
  }

  .view-toggles {
    display: flex;
    gap: 0.25rem;
  }

  .view-toggles u-button[active] {
    background: var(--u-primary-color, #1976D2);
    /* 예외 1 — "주색 위의 글자" 역할 토큰이 없다.
       역할 층의 유채색은 전경 5단(--u-primary-color-*)뿐이고, 그 위에 얹는 글자색을
       가리키는 토큰은 없다. 실측: 라이트 #FFFFFF/#1E88E5 = 3.68, 다크 #000000/#2A659D
       = 3.45 — 다크는 흰 글자였다면 6.09 였다. 즉 현재 값이 최선이 아니지만, 팔레트를
       직접 바꾸면 게시된 시각이 움직이므로 토큰 추가 결정까지 현행을 유지한다. */
    color: var(--u-neutral-0, #FFFFFF);
  }

  .info {
    font-size: 0.875rem;
    color: var(--dc-muted-color);
    font-weight: 500;
  }

  /* Grid Layout */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--min-width, 200px), 1fr));
    gap: var(--gap, 1rem);
  }

  /* List Layout */
  .list {
    display: flex;
    flex-direction: column;
    gap: var(--gap, 1rem);
  }

  /* Card Styles */
  .card {
    background: var(--u-bg-color, #FFFFFF);
    border: 1px solid var(--u-border-color, #E0E0E0);
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .card:hover {
    border-color: var(--u-primary-color, #1976D2);
    box-shadow: 0 4px 12px var(--u-shadow-color-weak, rgba(0, 0, 0, 0.08));
    transform: translateY(-2px);
  }

  .card.selected {
    border-color: var(--u-primary-color, #1976D2);
    background: var(--u-bg-color-active, #EEEEEE);
    box-shadow: 0 0 0 3px var(--u-primary-color-weakest, #90CAF9);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-field {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
  }

  .card-field .label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--dc-muted-color);
    min-width: 80px;
    flex-shrink: 0;
  }

  .card-field .value {
    font-size: 0.9375rem;
    color: var(--u-txt-color, #212121);
    word-break: break-word;
  }

  /* List Card Override */
  .list-card .card-content {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .list-card .card-field {
    flex: 1 1 calc(50% - 0.5rem);
    min-width: 200px;
  }

  /* Table */
  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--u-border-color, #E0E0E0);
    border-radius: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--u-bg-color, #FFFFFF);
  }

  thead {
    /* 예외 2 — 표면 높이 축이 없다.
       배경 역할 토큰은 상호작용 상태 이름(-hover/-active/-disabled)뿐이라,
       "바탕보다 한 단 올라온 면"을 뜻하는 토큰이 없다. 헤더에 -hover 를 쓰면
       마우스 상태를 뜻하게 되므로 팔레트를 직접 읽는다. neutral-50 은 두 테마에서
       각각 #FAFAFA/#0A0A0A 로 반전되므로 다크 보정은 필요 없다. */
    background: var(--u-neutral-50, #FAFAFA);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--dc-header-color);
    border-bottom: 2px solid var(--u-border-color, #E0E0E0);
    white-space: nowrap;
  }

  tbody tr {
    cursor: pointer;
    transition: background 0.1s ease;
  }

  tbody tr:hover {
    background: var(--u-bg-color-hover, #F5F5F5);
  }

  tbody tr.selected {
    background: var(--u-bg-color-active, #EEEEEE);
  }

  tbody tr:not(:last-child) {
    border-bottom: 1px solid var(--u-border-color-weak, #EEEEEE);
  }

  td {
    padding: 0.875rem 1rem;
    font-size: 0.9375rem;
    color: var(--u-txt-color, #212121);
  }

  /* Empty State */
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--dc-empty-color);
    font-size: 1rem;
  }
`;

export const styles = [baseStyles];
