import { UDataView } from './UDataView.component.js';

UDataView.define("u-data-view");

declare global {
  interface HTMLElementTagNameMap {
    "u-data-view": UDataView;
  }
}

export { UDataView };
export type { Column, ViewMode } from './UDataView.component.js';