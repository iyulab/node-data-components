import { css } from 'lit';

export const styles = css`
    .container {
      margin-top: 5px;
      width: 600px;
      background-color: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-gray-200);
      border-radius: 5px;
      user-select: none;
    }

    .header {
      display: grid;
      grid-template-columns: 1.5fr 7fr 1.5fr;
      align-items: center;
      padding: 5px 0px;
      height: 30px;
      font-size: 16px;
      font-weight: 600;
      border-bottom: 1px solid #ddd;
    }

    .header > :nth-child(2) {
      text-align: left;
    }

    .header > :last-child {
      text-align: center;
    }

    .body {
      font-size: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .search-item {
        padding: 10px 0px;
        display: grid;
        grid-template-columns: 1.5fr 7fr 1.5fr;
        align-items: center;

        .title {
          text-align: left;
          padding: 0px 10px;
        }

        .filterby {
          display: flex;
          flex-flow: row wrap;
          gap: 5px;
          max-height: 150px;
          overflow: hidden;
          overflow-y: auto;

          &::-webkit-scrollbar {
            width: 16px;
          }
            
          &::-webkit-scrollbar-thumb {
            height: 56px;
            border-radius: 8px;
            border: 4px solid transparent;
            background-clip: content-box;
            background-color: hsl(0,0%,37%);
          }
            
          &::-webkit-scrollbar-thumb:hover {
            background-color: hsl(0,0%,67%);
          }

          .item {
            text-align: center;
            padding: 5px;
            border-radius: 15px;
            border: 1px solid #ccc;
            cursor: pointer;

            &.selected {
              background-color: #0078d4;
              color: white;
            }
          }
        }

        .filterby input {
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
  
        .filterby input[type="text"] {
          width: 300px;
        }

        .filterby input[type="number"] {
          width: 180px;
        }

        .filterby input[type="datetime-local"] {
          width: 180px;
        }

        .orderby {
          text-align: center;

          .order-value {
            width: 18px;
            height: 18px;
            cursor: pointer;
            fill: var(--primary-text);
            fill-rule: evenodd;

            &:hover {
              opacity: 0.6;
            }
          }
        }
      }
    }

    .footer {
      text-align: right;
      padding: 10px 20px;
      font-size: 18px;

      .cancel {
        margin-right: 10px;
        color: dimgray;
        cursor: pointer;

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