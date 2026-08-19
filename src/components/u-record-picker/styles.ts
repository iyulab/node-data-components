import { css } from 'lit';

export const styles = css`
  :host {
    display: inline-block;
  }

  .container {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .container input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: inherit;
  }

  .suffix-item {
    cursor: pointer;
    flex: none;
  }

  u-popover {
    display: block;
    max-height: var(--record-picker-popover-max-height, 50vh);
    overflow: auto;
  }

  .no-results {
    padding: 0.5rem 0.75rem;
    opacity: 0.6;
    font-size: 0.875rem;
  }

  .popover-loading {
    padding: 0.5rem 0.75rem;
    display: flex;
    justify-content: center;
  }

  .dialog-error {
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    color: var(--u-color-danger, #b91c1c);
    font-size: 0.875rem;
  }

  .dialog-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
  }

  .dialog-search input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.25rem;
    font: inherit;
  }

  .dialog-table-wrap {
    min-height: 16rem;
    max-height: 60vh;
    overflow: auto;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
`;
