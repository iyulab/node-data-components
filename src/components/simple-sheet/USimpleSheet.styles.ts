import { css } from 'lit';

export const styles = css`
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

  /* Readonly mode */
  :host([readonly]) .cell {
    cursor: default;
  }

  /* ── Dark mode ──
     헤더/셀 배경·텍스트는 CSS 변수(--u-neutral-*, --u-txt-color 등)가
     테마에 따라 자동 처리되므로 선택 상태와 포커스 효과만 재정의한다. */

  :host-context([theme="dark"]) .sheet-container:focus-within {
    border-color: var(--u-blue-500, #6ba3e3);
    box-shadow: 0 0 0 2px var(--u-blue-100, #1e3a5f);
  }

  :host-context([theme="dark"]) .col-header.col-selected {
    background: var(--u-blue-100, #1e3a5f);
    color: var(--u-blue-800, #c2deff);
  }

  :host-context([theme="dark"]) .row-num.row-selected {
    background: var(--u-blue-100, #1e3a5f);
    color: var(--u-blue-800, #c2deff);
  }

  :host-context([theme="dark"]) .cell.selected {
    background: var(--u-blue-0, #0a1e3d);
  }

  :host-context([theme="dark"]) .cell.anchor {
    background: var(--u-bg-color);
    outline-color: var(--u-blue-500, #6ba3e3);
  }

  :host-context([theme="dark"]) .resize-handle:hover::after {
    background: var(--u-blue-500, #6ba3e3);
  }

  :host-context([theme="dark"]) .cell-input {
    background: var(--u-bg-color);
    color: var(--u-txt-color);
    outline-color: var(--u-blue-500, #6ba3e3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
`;
