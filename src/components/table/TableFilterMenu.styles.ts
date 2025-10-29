import { css } from 'lit';

export const styles = css`
    .container {
      width: 250px;
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      background-color: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-gray-200);
      overflow: hidden;
    }

    .body {
      max-height: 200px;
      padding: 10px;
      overflow: hidden;
      overflow-y: auto;
      font-size: 14px;

      &::-webkit-scrollbar {
        width: 16px;
      }
        
      &::-webkit-scrollbar-thumb {
        height: 56px;
        border-radius: 8px;
        border: 4px solid transparent;
        background-clip: content-box;
        background-color: hsl(0,0%,37%)
      }
        
      &::-webkit-scrollbar-thumb:hover {
        background-color: hsl(0,0%,67%)
      }

      .range {
        display: flex;
        flex-direction: column;
        gap: 5px;

        .range-value {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        .range-value span {
          font-weight: 600;
        }

        .range-value input {
          width: 180px;
          height: 20px;
          padding: 5px;
          border: 1px solid #ccc;
          border-radius: 3px;
          outline: none;
          transition: border-color 0.3s ease;

          &:focus {
            border-color: #007BFF;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
          }
        }
      }

      .list {
        display: flex;
        flex-flow: row wrap;
        gap: 5px;

        .item {
          text-align: center;
          padding: 5px;
          border: 1px solid #ccc;
          border-radius: 15px;
          cursor: pointer;

          &.selected {
            background-color: #0078d4;
            color: #fff;
          }
        }
      }

      .value {
        width: -webkit-fill-available;
        height: 20px;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 3px;
        outline: none;
        transition: border-color 0.3s ease;

        &:focus {
          border-color: #007BFF;
          box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }
      }
    }

    .footer {
      text-align: right;
      padding: 10px;
      padding-top: 0;
      font-size: 16px;

      .cancle {
        color: dimgray;
        cursor: pointer;
        margin-right: 10px;

        &:hover {
          opacity: 0.6;
        }
      }

      .apply {
        color: #0078d4;
        cursor: pointer;

        &:hover {
          opacity: 0.6;
        }
      }
    }
  `;