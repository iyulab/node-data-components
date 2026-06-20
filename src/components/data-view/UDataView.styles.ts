import { css, unsafeCSS } from 'lit';

/* ── Base (light) ──
   모든 --u-* 토큰에 light fallback을 부여해 토큰 미공급 환경에서도 자가-테마된다.
   외부에서 --u-* 가 공급되면 그 값이 우선한다. 형제 컴포넌트(USimpleSheet/
   URichTable)의 NT-5 자가-테마 패턴과 동일한 slate 계열 light fallback을 사용한다. */
const baseStyles = css`
  :host {
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
    background: var(--u-bg-color, #fff);
    border: 1px solid var(--u-border-color, #e2e8f0);
    border-radius: 8px;
  }

  .view-toggles {
    display: flex;
    gap: 0.25rem;
  }

  .view-toggles u-button[active] {
    background: var(--u-blue-600, #1E88E5);
    color: var(--u-neutral-0, #fff);
  }

  .info {
    font-size: 0.875rem;
    color: var(--u-txt-color-weak, #64748b);
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
    background: var(--u-bg-color, #fff);
    border: 1px solid var(--u-border-color, #e2e8f0);
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .card:hover {
    border-color: var(--u-blue-600, #1E88E5);
    box-shadow: 0 4px 12px var(--u-shadow-color-weak, rgba(0, 0, 0, 0.08));
    transform: translateY(-2px);
  }

  .card.selected {
    border-color: var(--u-blue-600, #1E88E5);
    background: var(--u-bg-color-active, #EEEEEE);
    box-shadow: 0 0 0 3px var(--u-blue-200, #90CAF9);
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
    color: var(--u-txt-color-weak, #64748b);
    min-width: 80px;
    flex-shrink: 0;
  }

  .card-field .value {
    font-size: 0.9375rem;
    color: var(--u-txt-color, #0f172a);
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
    border: 1px solid var(--u-border-color, #e2e8f0);
    border-radius: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--u-bg-color, #fff);
  }

  thead {
    background: var(--u-neutral-50, #f8fafc);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--u-txt-color-weak, #64748b);
    border-bottom: 2px solid var(--u-border-color, #e2e8f0);
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
    border-bottom: 1px solid var(--u-border-color-weak, #f1f5f9);
  }

  td {
    padding: 0.875rem 1rem;
    font-size: 0.9375rem;
    color: var(--u-txt-color, #0f172a);
  }

  /* Empty State */
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--u-txt-color-weak, #64748b);
    font-size: 1rem;
  }
`;

/* ── Dark mode ──
   외부에서 --u-* 변수가 제공되면 그 값을 사용하고, 없으면 dark fallback을 적용한다.
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
  ${host} .toolbar {
    background: var(--u-bg-color, #121212);
    border-color: var(--u-border-color, #3D3D3D);
  }

  ${host} .view-toggles u-button[active] {
    background: var(--u-blue-600, #87B8F5);
    color: var(--u-neutral-0, #000);
  }

  ${host} .info {
    color: var(--u-txt-color-weak, #8A8A8A);
  }

  ${host} .card {
    background: var(--u-bg-color, #121212);
    border-color: var(--u-border-color, #3D3D3D);
  }

  ${host} .card:hover {
    border-color: var(--u-blue-600, #87B8F5);
    box-shadow: 0 4px 12px var(--u-shadow-color-weak, rgba(0, 0, 0, 0.25));
  }

  ${host} .card.selected {
    border-color: var(--u-blue-600, #87B8F5);
    background: var(--u-bg-color-active, #3D3D3D);
    box-shadow: 0 0 0 3px var(--u-blue-200, #2B4F7E);
  }

  ${host} .card-field .label {
    color: var(--u-txt-color-weak, #8A8A8A);
  }

  ${host} .card-field .value {
    color: var(--u-txt-color, #D4D4D4);
  }

  ${host} .table-wrapper {
    border-color: var(--u-border-color, #3D3D3D);
  }

  ${host} table {
    background: var(--u-bg-color, #121212);
  }

  ${host} thead {
    background: var(--u-neutral-50, #0A0A0A);
  }

  ${host} th {
    color: var(--u-txt-color-weak, #8A8A8A);
    border-bottom-color: var(--u-border-color, #3D3D3D);
  }

  ${host} tbody tr:hover {
    background: var(--u-bg-color-hover, #2A2A2A);
  }

  ${host} tbody tr.selected {
    background: var(--u-bg-color-active, #3D3D3D);
  }

  ${host} tbody tr:not(:last-child) {
    border-bottom-color: var(--u-border-color-weak, #2A2A2A);
  }

  ${host} td {
    color: var(--u-txt-color, #D4D4D4);
  }

  ${host} .empty {
    color: var(--u-txt-color-weak, #8A8A8A);
  }
`;

export const styles = [
  baseStyles,
  unsafeCSS(DARK_PREFIXES.map(darkRules).join('\n')),
];
