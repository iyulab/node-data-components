import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  .u-data-view-container {
    width: 100%;
  }

  .layout-selector {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;

    u-icon-button {
      margin-left: 0.5rem;

      &[current] {
        color: var(--sl-color-primary-600);
      }
    }
  }

  .u-data-view {
    &.grid {
      display: grid;
      gap: var(--item-margin);
      grid-template-columns: repeat(auto-fill, minmax(var(--min-item-width), 1fr));
    }

    &.list {
      display: flex;
      flex-direction: column;
      gap: var(--item-margin);
    }
  }

  .default-item {
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    &.selected {
      border: 2px solid #007bff;
      box-shadow: 0 0 15px rgba(0, 123, 255, 0.3);
    }
  }

  .u-data-view.list .default-item {
    display: flex;
    align-items: flex-start;
  }

  .u-data-view.list .default-item .default-image,
  .u-data-view.list .default-item .placeholder-image {
    width: 128px;
    height: 128px;
    min-width: 128px;
    margin-right: 1rem;
    margin-bottom: 0;
    object-fit: cover;
  }

  .u-data-view.list .default-item .default-fields {
    flex: 1;
  }

  .default-image {
    width: 100%;
    height: 128px;
    object-fit: cover;
    margin-bottom: 1rem;
    border-radius: 4px;

    &.list-image {
      width: 128px;
      height: 128px;
    }

    &.table-image {
      width: 64px;
      height: 64px;
      margin-bottom: 0;
    }

    &.placeholder-image {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      text-transform: uppercase;
    }
  }

  .default-fields {
    .field {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;

      .field-title {
        color: var(--sl-color-neutral-500);
        margin-right: 0.5rem;
        flex: 0 0 30%;
      }

      .field-value {
        font-weight: bold;
        flex: 1;
      }
    }
  }

  .default-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;

    th, td {
      padding: 0.5em;
      border: none;
      border-bottom: 1px solid #eee;
    }

    th {
      background-color: #f8f9fa;
      font-weight: bold;
      text-align: left;
    }

    .image-cell {
      width: 64px;
      height: 64px;
      padding: 0;
      position: relative;

      img, .placeholder-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder-image {
        font-size: 1.5rem;
      }
    }

    tr {
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(0, 123, 255, 0.05);
      }

      &.selected {
        background-color: rgba(0, 123, 255, 0.1);
        box-shadow: 0 0 0 2px #007bff;
        position: relative;
        z-index: 1;

        td:first-child {
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
        }

        td:last-child {
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
        }
      }
    }
  }

  u-skeleton {
    display: block;
    width: 100%;
    height: 1em;
    background-color: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: skeleton-loading 1.5s infinite;
    }
  }

  @keyframes skeleton-loading {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .skeleton-item {
    &.grid .skeleton-image,
    &.list .skeleton-image {
      width: 100%;
      height: 128px;
      margin-bottom: 1rem;
    }

    &.list {
      display: flex;
      align-items: flex-start;

      .skeleton-image {
        width: 128px;
        height: 128px;
        margin-right: 1rem;
        margin-bottom: 0;
      }

      .skeleton-fields {
        flex: 1;
      }
    }

    .skeleton-field {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;

      .skeleton-label {
        width: 30%;
        height: 1em;
        margin-right: 0.5rem;
      }

      .skeleton-value {
        width: 70%;
        height: 1em;
      }
    }
  }

  .skeleton-table {
    width: 100%;

    .skeleton-row {
      display: flex;
      border-bottom: 1px solid #eee;
      padding: 0.5em 0;

      .skeleton-cell {
        flex: 1;
        height: 1em;
        margin-right: 0.5em;

        &:first-child {
          width: 64px;
          height: 64px;
          flex: none;
        }
      }
    }
  }
`;