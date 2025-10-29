import { css } from 'lit';

export const styles = css`
      .container {
        margin-top: 13px;
        width: 80px;
        background-color: var(--sl-color-neutral-0);
        border: 1px solid var(--sl-color-gray-200);
      }

      .row {
        text-align: right;
        padding: 5px;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          background-color: var(--sl-color-gray-100);
        }

        &.selected {
          background-color: var(--sl-color-gray-200);
        }
      }
    `;