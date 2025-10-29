import { css } from 'lit';

export const styles = css`
    .tooltip {
      max-width: 200px;
      margin: 3px;
      padding: 6px 12px;
      background-color: rgba(0, 0, 0, .65);
      border-radius: 2px;
      box-shadow: none;

      color: #fff;
      font-weight: normal;
      font-size: 14px;
      line-height: 20px;
      white-space: wrap;
    }

    .tooltip .content {
      margin: 0;
      padding: 0;
    }
  `;