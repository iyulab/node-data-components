import { css, unsafeCSS } from 'lit';

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
    --dc-header-color:   var(--u-txt-color-weak, #757575);   /* 열 머리 · 행 머리 */
    --dc-empty-color:    var(--u-txt-color-weak, #757575);   /* 빈 상태 안내문 */
    --dc-readonly-color: var(--u-txt-color-weak, #757575);   /* 읽기 전용 셀 */
    display: block;
    width: 100%;
    height: 400px;
  }

  .sheet-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    outline: none;
    border: 1px solid var(--u-border-color, #E0E0E0);
    border-radius: 4px;
    background: var(--u-bg-color, #FFFFFF);
  }

  .sheet-container:focus-within {
    border-color: var(--u-blue-500, #2196F3);
    box-shadow: 0 0 0 2px var(--u-blue-100, #BBDEFB);
  }

  .sheet-scroll {
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .sheet-table {
    border-collapse: collapse;
    table-layout: fixed;
    user-select: none;
    font-family: inherit;
  }

  /* Corner cell (top-left) */
  .corner {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 4;
    width: 48px;
    min-width: 48px;
    background: var(--u-neutral-100, #F5F5F5);
    border-right: 1px solid var(--u-border-color, #E0E0E0);
    border-bottom: 2px solid var(--u-border-color, #E0E0E0);
    cursor: pointer;
    user-select: none;
  }

  .corner:hover {
    background: var(--u-neutral-200, #EEEEEE);
  }

  /* Column headers (A, B, C...) */
  .col-header {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--u-neutral-100, #F5F5F5);
    padding: 4px 8px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--dc-header-color);
    border-right: 1px solid var(--u-border-color, #E0E0E0);
    border-bottom: 2px solid var(--u-border-color, #E0E0E0);
    white-space: nowrap;
    min-width: 80px;
    cursor: pointer;
    letter-spacing: 0.05em;
    user-select: none;
  }

  .col-header.col-selected {
    background: var(--u-blue-200, #90CAF9);
    color: var(--u-blue-800, #1565C0);
  }

  .resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    cursor: col-resize;
    z-index: 1;
  }

  .resize-handle::after {
    content: '';
    position: absolute;
    right: 1px;
    top: 20%;
    bottom: 20%;
    width: 2px;
    background: transparent;
    border-radius: 1px;
    transition: background 0.15s;
  }

  .resize-handle:hover::after {
    background: var(--u-blue-500, #2196F3);
  }

  .sheet-container.is-resizing {
    cursor: col-resize;
    user-select: none;
  }

  .sheet-container.is-resizing * {
    cursor: col-resize !important;
  }

  /* Row number cells */
  .row-num {
    position: sticky;
    left: 0;
    z-index: 1;
    width: 48px;
    min-width: 48px;
    text-align: right;
    padding: 0 6px;
    font-size: 11px;
    color: var(--dc-header-color);
    /* 예외 — 표면 높이 축이 없다. 행번호 여백은 "비활성"이 아니라 시트 바탕보다
       한 단 내려간 면이다. --u-bg-color-disabled 를 쓰면 다크에서 바탕(neutral-100)과
       같은 값이 되어 여백 구분이 사라진다 — 스냅샷이 그것을 잡았다. */
    background: var(--u-neutral-50, #FAFAFA);
    border-right: 1px solid var(--u-border-color, #E0E0E0);
    border-bottom: 1px solid var(--u-border-color-weak, #EEEEEE);
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
  }

  .row-num.row-selected {
    background: var(--u-blue-100, #BBDEFB);
    color: var(--u-blue-800, #1565C0);
    font-weight: 600;
  }

  /* Data cells */
  .cell {
    padding: 0 6px;
    border-right: 1px solid var(--u-border-color-weak, #EEEEEE);
    border-bottom: 1px solid var(--u-border-color-weak, #EEEEEE);
    font-size: 13px;
    color: var(--u-txt-color, #212121);
    min-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: cell;
    height: 24px;
    line-height: 24px;
    vertical-align: middle;
    position: relative;
    box-sizing: border-box;
  }

  .cell.selected {
    background: var(--u-primary-bg-color, #E3F2FD);
  }

  /* The anchor cell (top-left of selection) */
  .cell.anchor {
    background: var(--u-bg-color, #FFFFFF);
    outline: 2px solid var(--u-blue-500, #2196F3);
    outline-offset: -2px;
    overflow: visible;
    z-index: 1;
  }

  /* Editing cell */
  .cell.editing {
    overflow: visible;
    z-index: 2;
    padding: 0;
  }

  .cell-input {
    position: absolute;
    inset: -1px;
    width: calc(100% + 2px);
    min-width: 100%;
    height: calc(100% + 2px);
    border: none;
    outline: 2px solid var(--u-blue-500, #2196F3);
    outline-offset: -1px;
    padding: 0 6px;
    font-size: 13px;
    font-family: inherit;
    color: var(--u-txt-color, #212121);
    background: var(--u-bg-color, #FFFFFF);
    box-sizing: border-box;
    z-index: 10;
    box-shadow: 0 2px 8px var(--u-shadow-color-strong, rgba(0, 0, 0, 0.16));
  }

  /* Dropdown overlay */
  .cell-dropdown {
    position: absolute;
    top: 100%;
    left: -1px;
    width: calc(100% + 2px);
    min-width: 120px;
    max-height: 200px;
    overflow-y: auto;
    background: var(--u-bg-color, #FFFFFF);
    border: 1px solid var(--u-border-color, #E0E0E0);
    border-top: none;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 4px 12px var(--u-shadow-color-normal, rgba(0, 0, 0, 0.12));
    z-index: 20;
  }

  .dropdown-item {
    padding: 4px 8px;
    font-size: 13px;
    color: var(--u-txt-color, #212121);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-item:hover {
    background: var(--u-neutral-100, #F5F5F5);
  }

  .dropdown-item.highlighted {
    background: var(--u-primary-bg-color, #E3F2FD);
    color: var(--u-blue-800, #1565C0);
  }

  .dropdown-empty {
    padding: 6px 8px;
    font-size: 12px;
    color: var(--dc-empty-color);
    font-style: italic;
  }

  /* Numeric cell (right-aligned like Excel) */
  .cell.cell-numeric {
    text-align: right;
  }

  /* Readonly column/cell */
  .cell.cell-readonly {
    background: var(--u-bg-color-disabled, #FAFAFA);
    color: var(--dc-readonly-color);
    cursor: default;
  }

  .cell.cell-readonly.selected {
    background: var(--u-neutral-100, #F5F5F5);
  }

  .cell.cell-readonly.anchor {
    background: var(--u-bg-color-disabled, #FAFAFA);
  }

  /* Computed column/cell */
  .cell.cell-computed {
    background: var(--u-primary-bg-color, #E3F2FD);
    color: var(--u-txt-color, #212121);
    font-style: italic;
    cursor: default;
  }

  .cell.cell-computed.selected {
    background: var(--u-blue-100, #BBDEFB);
  }

  .cell.cell-computed.anchor {
    background: var(--u-primary-bg-color, #E3F2FD);
  }

  /* Readonly mode (whole sheet) */
  :host([readonly]) .cell {
    cursor: default;
  }

`;

/* ── 다크 보정 ──
   ⚠**여기 남은 규칙은 "다크 테마 구현"이 아니다.** 역할 토큰의 중립 계열은 두 테마에서
   서로 다른 팔레트 단에 매핑돼 있어(--u-bg-color = neutral-0 라이트 / neutral-100 다크)
   테마 보정이 토큰 층에 이미 들어 있다. 그래서 중립 색을 쓰는 규칙은 base 하나로 족하고,
   실제로 이 블록에 있던 24개 선언 중 대부분이 base 와 **같은 토큰**을 가리켜 계산값을
   전혀 바꾸지 못하고 있었다(브라우저 스냅샷으로 실증 — tests/browser/).

   남은 것은 **유채색 표면**뿐이다. 역할 층에는 유채색 표면 토큰이 없고(0종), 팔레트의
   유채색 틴트는 다크에서 짓눌린다 — 바탕 대비 델타의 다크/라이트 비가 중립은 1.34~1.62배인
   반면 청색은 0.38~0.54배다. 즉 같은 단을 두 테마에 그대로 쓰면 다크에서 절반 이하로
   옅게 읽힌다. 아래 6개는 그 어긋남을 손으로 메운 것이고, 지우면 실제로 색이 달라진다.

   ⇒ 업스트림에 유채색 표면 토큰이 생기면 이 블록은 통째로 사라져야 한다.

   다크 규칙은 아래 3가지 컨텍스트에서 동일하게 적용된다:
   - :host([theme="dark"])              — 1급 theme 속성 (전 브라우저)
   - :host-context([theme="dark"])      — 조상 theme 속성, Theme 유틸 호환 (Chromium)
   - :host-context([data-theme="dark"]) — 조상 data-theme 속성만 쓰는 앱 (Chromium)

   셀렉터 리스트로 결합하면 :host-context 미지원 브라우저(Firefox/Safari)가
   리스트 전체를 무효화하므로, 프리픽스별 개별 규칙으로 생성한다. */
const DARK_PREFIXES = [
  ':host([theme="dark"])',
  ':host-context([theme="dark"])',
  ':host-context([data-theme="dark"])',
];

const darkRules = (host: string) => `
  ${host} .col-header.col-selected {
    background: var(--u-blue-100, #BBDEFB);
  }

  ${host} .cell.cell-readonly.selected {
    background: var(--u-neutral-200, #EEEEEE);
  }


  ${host} .cell.cell-computed.selected {
    background: var(--u-blue-200, #90CAF9);
  }

  ${host} .cell.cell-computed.anchor {
    background: var(--u-blue-100, #BBDEFB);
  }

`;

export const styles = [
  baseStyles,
  unsafeCSS(DARK_PREFIXES.map(darkRules).join('\n')),
];
