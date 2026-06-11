import { css, unsafeCSS } from 'lit';

const baseStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 400px;
  }

  .sheet-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    outline: none;
    border: 1px solid var(--u-border-color, #e2e8f0);
    border-radius: 4px;
    background: var(--u-bg-color, #fff);
  }

  .sheet-container:focus-within {
    border-color: var(--u-blue-500, #3b82f6);
    box-shadow: 0 0 0 2px var(--u-blue-100, #dbeafe);
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
    background: var(--u-neutral-100, #f1f5f9);
    border-right: 1px solid var(--u-border-color, #e2e8f0);
    border-bottom: 2px solid var(--u-border-color, #e2e8f0);
    cursor: pointer;
    user-select: none;
  }

  .corner:hover {
    background: var(--u-neutral-200, #e2e8f0);
  }

  /* Column headers (A, B, C...) */
  .col-header {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--u-neutral-100, #f1f5f9);
    padding: 4px 8px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--u-txt-color-weak, #64748b);
    border-right: 1px solid var(--u-border-color, #e2e8f0);
    border-bottom: 2px solid var(--u-border-color, #e2e8f0);
    white-space: nowrap;
    min-width: 80px;
    cursor: pointer;
    letter-spacing: 0.05em;
    user-select: none;
  }

  .col-header.col-selected {
    background: var(--u-blue-200, #bfdbfe);
    color: var(--u-blue-800, #1e40af);
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
    background: var(--u-blue-500, #3b82f6);
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
    color: var(--u-txt-color-weak, #64748b);
    background: var(--u-neutral-50, #f8fafc);
    border-right: 1px solid var(--u-border-color, #e2e8f0);
    border-bottom: 1px solid var(--u-border-color-weak, #f1f5f9);
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
  }

  .row-num.row-selected {
    background: var(--u-blue-100, #dbeafe);
    color: var(--u-blue-800, #1e40af);
    font-weight: 600;
  }

  /* Data cells */
  .cell {
    padding: 0 6px;
    border-right: 1px solid var(--u-border-color-weak, #f1f5f9);
    border-bottom: 1px solid var(--u-border-color-weak, #f1f5f9);
    font-size: 13px;
    color: var(--u-txt-color, #0f172a);
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
    background: var(--u-blue-50, #eff6ff);
  }

  /* The anchor cell (top-left of selection) */
  .cell.anchor {
    background: var(--u-bg-color, #fff);
    outline: 2px solid var(--u-blue-500, #3b82f6);
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
    outline: 2px solid var(--u-blue-500, #3b82f6);
    outline-offset: -1px;
    padding: 0 6px;
    font-size: 13px;
    font-family: inherit;
    color: var(--u-txt-color, #0f172a);
    background: var(--u-bg-color, #fff);
    box-sizing: border-box;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
    background: var(--u-bg-color, #fff);
    border: 1px solid var(--u-border-color, #e2e8f0);
    border-top: none;
    border-radius: 0 0 4px 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    z-index: 20;
  }

  .dropdown-item {
    padding: 4px 8px;
    font-size: 13px;
    color: var(--u-txt-color, #0f172a);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-item:hover {
    background: var(--u-neutral-100, #f1f5f9);
  }

  .dropdown-item.highlighted {
    background: var(--u-blue-50, #eff6ff);
    color: var(--u-blue-800, #1e40af);
  }

  .dropdown-empty {
    padding: 6px 8px;
    font-size: 12px;
    color: var(--u-txt-color-weak, #64748b);
    font-style: italic;
  }

  /* Numeric cell (right-aligned like Excel) */
  .cell.cell-numeric {
    text-align: right;
  }

  /* Readonly column/cell */
  .cell.cell-readonly {
    background: var(--u-neutral-50, #f8fafc);
    color: var(--u-txt-color-weak, #64748b);
    cursor: default;
  }

  .cell.cell-readonly.selected {
    background: var(--u-neutral-100, #f1f5f9);
  }

  .cell.cell-readonly.anchor {
    background: var(--u-neutral-50, #f8fafc);
  }

  /* Computed column/cell */
  .cell.cell-computed {
    background: var(--u-blue-50, #eff6ff);
    color: var(--u-txt-color, #0f172a);
    font-style: italic;
    cursor: default;
  }

  .cell.cell-computed.selected {
    background: var(--u-blue-100, #dbeafe);
  }

  .cell.cell-computed.anchor {
    background: var(--u-blue-50, #eff6ff);
  }

  /* Readonly mode (whole sheet) */
  :host([readonly]) .cell {
    cursor: default;
  }

`;

/* ── Dark mode ──
   외부에서 --u-* CSS 변수가 제공되면 그 값을 사용하고,
   제공되지 않으면 자체 dark fallback 값을 적용한다.

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
  ${host} .sheet-container {
    background: var(--u-bg-color, #121212);
    border-color: var(--u-border-color, #3D3D3D);
  }

  ${host} .sheet-container:focus-within {
    border-color: var(--u-blue-500, #6ba3e3);
    box-shadow: 0 0 0 2px var(--u-blue-100, #1e3a5f);
  }

  ${host} .corner {
    background: var(--u-neutral-100, #121212);
    border-color: var(--u-border-color, #3D3D3D);
  }

  ${host} .corner:hover {
    background: var(--u-neutral-200, #1E1E1E);
  }

  ${host} .col-header {
    background: var(--u-neutral-100, #121212);
    color: var(--u-txt-color-weak, #8A8A8A);
    border-color: var(--u-border-color, #3D3D3D);
  }

  ${host} .col-header.col-selected {
    background: var(--u-blue-100, #1e3a5f);
    color: var(--u-blue-800, #c2deff);
  }

  ${host} .row-num {
    background: var(--u-neutral-50, #0A0A0A);
    color: var(--u-txt-color-weak, #8A8A8A);
    border-right-color: var(--u-border-color, #3D3D3D);
    border-bottom-color: var(--u-border-color-weak, #2A2A2A);
  }

  ${host} .row-num.row-selected {
    background: var(--u-blue-100, #1e3a5f);
    color: var(--u-blue-800, #c2deff);
  }

  ${host} .cell {
    color: var(--u-txt-color, #D4D4D4);
    border-right-color: var(--u-border-color-weak, #2A2A2A);
    border-bottom-color: var(--u-border-color-weak, #2A2A2A);
  }

  ${host} .cell.cell-readonly {
    background: var(--u-neutral-100, #1E1E1E);
    color: var(--u-txt-color-weak, #8A8A8A);
  }

  ${host} .cell.cell-readonly.selected {
    background: var(--u-neutral-200, #2A2A2A);
  }

  ${host} .cell.cell-readonly.anchor {
    background: var(--u-neutral-100, #1E1E1E);
  }

  ${host} .cell.cell-computed {
    background: var(--u-blue-100, #1e3a5f);
    color: var(--u-txt-color, #D4D4D4);
  }

  ${host} .cell.cell-computed.selected {
    background: var(--u-blue-200, #2a4a6f);
  }

  ${host} .cell.cell-computed.anchor {
    background: var(--u-blue-100, #1e3a5f);
  }

  ${host} .cell.selected {
    background: var(--u-blue-0, #0a1e3d);
  }

  ${host} .cell.anchor {
    background: var(--u-bg-color, #121212);
    outline-color: var(--u-blue-500, #6ba3e3);
  }

  ${host} .resize-handle:hover::after {
    background: var(--u-blue-500, #6ba3e3);
  }

  ${host} .cell-input {
    background: var(--u-bg-color, #121212);
    color: var(--u-txt-color, #D4D4D4);
    outline-color: var(--u-blue-500, #6ba3e3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  ${host} .cell-dropdown {
    background: var(--u-bg-color, #121212);
    border-color: var(--u-border-color, #3D3D3D);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  ${host} .dropdown-item {
    color: var(--u-txt-color, #D4D4D4);
  }

  ${host} .dropdown-item:hover {
    background: var(--u-neutral-100, #1E1E1E);
  }

  ${host} .dropdown-item.highlighted {
    background: var(--u-blue-100, #1e3a5f);
    color: var(--u-blue-800, #c2deff);
  }

  ${host} .dropdown-empty {
    color: var(--u-txt-color-weak, #8A8A8A);
  }
`;

export const styles = [
  baseStyles,
  unsafeCSS(DARK_PREFIXES.map(darkRules).join('\n')),
];
