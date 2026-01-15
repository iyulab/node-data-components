import { UDataView } from './UDataView.component.js';

UDataView.define("u-data-view");

declare global {
  interface HTMLElementTagNameMap {
    "u-data-view": UDataView;
  }
}

export { UDataView };
export type { DataViewColumnDefinition } from './UDataView.component.js';