import { css } from 'lit';

export const styles = css`
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
    background: var(--u-bg-color);
    border: 1px solid var(--u-border-color);
    border-radius: 8px;
  }

  .view-toggles {
    display: flex;
    gap: 0.25rem;
  }

  .view-toggles u-button[active] {
    background: var(--u-blue-600);
    color: var(--u-neutral-0);
  }

  .info {
    font-size: 0.875rem;
    color: var(--u-txt-color-weak);
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
    background: var(--u-bg-color);
    border: 1px solid var(--u-border-color);
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .card:hover {
    border-color: var(--u-blue-600);
    box-shadow: 0 4px 12px var(--u-shadow-color-weak);
    transform: translateY(-2px);
  }

  .card.selected {
    border-color: var(--u-blue-600);
    background: var(--u-bg-color-active);
    box-shadow: 0 0 0 3px var(--u-blue-200);
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
    color: var(--u-txt-color-weak);
    min-width: 80px;
    flex-shrink: 0;
  }

  .card-field .value {
    font-size: 0.9375rem;
    color: var(--u-txt-color);
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
    border: 1px solid var(--u-border-color);
    border-radius: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--u-bg-color);
  }

  thead {
    background: var(--u-neutral-50);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--u-txt-color-weak);
    border-bottom: 2px solid var(--u-border-color);
    white-space: nowrap;
  }

  tbody tr {
    cursor: pointer;
    transition: background 0.1s ease;
  }

  tbody tr:hover {
    background: var(--u-bg-color-hover);
  }

  tbody tr.selected {
    background: var(--u-bg-color-active);
  }

  tbody tr:not(:last-child) {
    border-bottom: 1px solid var(--u-border-color-weak);
  }

  td {
    padding: 0.875rem 1rem;
    font-size: 0.9375rem;
    color: var(--u-txt-color);
  }

  /* Empty State */
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--u-txt-color-weak);
    font-size: 1rem;
  }

  /* ── Dark mode ──
     외부에서 --u-* CSS 변수가 제공되면 그 값을 사용하고,
     제공되지 않으면 자체 dark fallback 값을 적용한다. */

  :host-context([theme="dark"]) .toolbar {
    background: var(--u-bg-color, #121212);
    border-color: var(--u-border-color, #3D3D3D);
  }

  :host-context([theme="dark"]) .view-toggles u-button[active] {
    background: var(--u-blue-600, #87B8F5);
    color: var(--u-neutral-0, #000000);
  }

  :host-context([theme="dark"]) .info {
    color: var(--u-txt-color-weak, #8A8A8A);
  }

  :host-context([theme="dark"]) .card {
    background: var(--u-bg-color, #121212);
    border-color: var(--u-border-color, #3D3D3D);
  }

  :host-context([theme="dark"]) .card:hover {
    border-color: var(--u-blue-600, #87B8F5);
    box-shadow: 0 4px 12px var(--u-shadow-color-weak, rgba(0, 0, 0, 0.25));
  }

  :host-context([theme="dark"]) .card.selected {
    border-color: var(--u-blue-600, #87B8F5);
    background: var(--u-bg-color-active, #3D3D3D);
    box-shadow: 0 0 0 3px var(--u-blue-200, #2B4F7E);
  }

  :host-context([theme="dark"]) .card-field .label {
    color: var(--u-txt-color-weak, #8A8A8A);
  }

  :host-context([theme="dark"]) .card-field .value {
    color: var(--u-txt-color, #D4D4D4);
  }

  :host-context([theme="dark"]) .table-wrapper {
    border-color: var(--u-border-color, #3D3D3D);
  }

  :host-context([theme="dark"]) table {
    background: var(--u-bg-color, #121212);
  }

  :host-context([theme="dark"]) thead {
    background: var(--u-neutral-50, #0A0A0A);
  }

  :host-context([theme="dark"]) th {
    color: var(--u-txt-color-weak, #8A8A8A);
    border-bottom-color: var(--u-border-color, #3D3D3D);
  }

  :host-context([theme="dark"]) tbody tr:hover {
    background: var(--u-bg-color-hover, #2A2A2A);
  }

  :host-context([theme="dark"]) tbody tr.selected {
    background: var(--u-bg-color-active, #3D3D3D);
  }

  :host-context([theme="dark"]) tbody tr:not(:last-child) {
    border-bottom-color: var(--u-border-color-weak, #2A2A2A);
  }

  :host-context([theme="dark"]) td {
    color: var(--u-txt-color, #D4D4D4);
  }

  :host-context([theme="dark"]) .empty {
    color: var(--u-txt-color-weak, #8A8A8A);
  }
`;
