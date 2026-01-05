import { UDataView } from './UDataView.component.js';

customElements.define("u-data-view", UDataView);

declare global {
  interface HTMLElementTagNameMap {
    "u-data-view": UDataView;
  }
}

export { UDataView };
export type { DataViewColumnDefinition } from './UDataView.component.js';