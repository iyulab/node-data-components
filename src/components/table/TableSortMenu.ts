import { html,  } from 'lit';
import { customElement, property } from "lit/decorators.js";

import { UFlyout, UFlyoutPosition } from "@iyulab/components";
import type { SearchColumn } from "./UTableModel";
import { styles } from './TableSortMenu.styles';

@customElement("table-sort-menu")
export class TableSortMenu extends UFlyout {
  keepHover: boolean = true;
  position: UFlyoutPosition = 'BottomRight';

  @property({ type: String })
  name?: string;

  @property({ type: String })
  orderby?: 'asc' | 'desc';

  render() {
    return html`
      <div class="container">
        <div class="row ${this.orderby === undefined ? 'selected' : ''}" 
          @click=${() => this.handleSortClick()}>
          None
        </div>
        <div class="row ${this.orderby === 'asc' ? 'selected' : ''}"
          @click=${() => this.handleSortClick("asc")}>
          Ascending
        </div>
        <div class="row ${this.orderby === 'desc' ? 'selected' : ''}"
          @click=${() => this.handleSortClick("desc")}>
          Descending
        </div>
      </div>
    `;
  }

  public async showSortAsync(event: MouseEvent, search?: SearchColumn) {
    this.name = search?.name;
    this.orderby = search?.orderby;
    await this.updateComplete;
    this.toggleAsync(event);
  }

  private async handleSortClick(orderby?: 'asc' | 'desc') {
    this.dispatchEvent(new CustomEvent("orderby", {
      detail: {
        name: this.name,
        orderby: orderby
      },
    }));
    this.hideClickAsync();
  }

  static styles = [styles];
}