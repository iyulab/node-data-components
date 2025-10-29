import { html,  } from 'lit';
import { customElement, property } from "lit/decorators.js";

import { UFlyout, UFlyoutPosition } from "@iyulab/components";

import type { 
  ColumnDefinition, 
  SearchColumn 
} from "./UTableModel";

import { styles } from './TableFilterMenu.styles';

@customElement("table-filter-menu")
export class TableFilterMenu extends UFlyout {
  keepHover: boolean = true;
  position: UFlyoutPosition = 'BottomLeft';

  @property({ type: Object })
  search?: SearchColumn;

  @property({ type: Array })
  selectList: string[] = [];

  render() {
    return html`
      <div class="container">
        <div class="body">
          ${this.renderBody()}
        </div>
        <div class="footer">
          <span class="cancle" @click=${this.hideClickAsync}>Cancle</span>
          <span class="apply" @click=${this.handleSetFilter}>Apply</span>
        </div>
      </div>
    `;
  }

  public async showFilterAsync(event: MouseEvent, column: ColumnDefinition, search?: SearchColumn) {
    this.search = JSON.parse(JSON.stringify(search));
    this.selectList = column.selectList ?? [];
    this.requestUpdate();
    await this.updateComplete;
    this.toggleAsync(event);
  }

  public async hideClickAsync() {
    this.search = undefined;
    super.hideClickAsync();
  }

  private renderBody() {
    if (!this.search) return null;

    if (this.search.type === 'text') {
      return html`
        <input class="value" type="text" .value=${this.search.value ?? ''}
          placeholder="Search Field"
          @change=${this.handleChangeValue}/>
      `;
    } else if (this.search.type === 'numberRange') {
      return html`
        <div class="range">
          <div class="range-value">
            <span>From</span>
            <input type="number" .value=${this.search.numberFrom?.toString() ?? ''}
              @change=${(e:any) => this.handleChangeRange(e, 'from')} />
          </div>
          <div class="range-value">
            <span>To</span>
          <input type="number" .value=${this.search.numberTo?.toString() ?? ''}
              @change=${(e:any) => this.handleChangeRange(e, 'to')}/>
          </div>
        </div>
      `;
    } else if (this.search.type === 'dateRange') {
      return html`
        <div class="range">
          <div class="range-value">
            <span>From</span>
            <input type="datetime-local" .value=${this.search.dateFrom
              ? this.formatDate(this.search.dateFrom) : ''}
              @change=${(e:any) => this.handleChangeRange(e, 'from')} />
          </div>
          <div class="range-value">
            <span>To</span>
            <input type="datetime-local" .value=${this.search.dateTo
              ? this.formatDate(this.search.dateTo) : ''}
              @change=${(e:any) => this.handleChangeRange(e, 'to')}/>
          </div>
        </div>
      `;
    } else if (this.search.type === 'select') {
      const selectList = this.search.list;
      return html`
        <div class="list">
          ${this.selectList?.map((item) => {
            const checked = selectList.includes(item);
            return html`
              <span class="item ${checked ? 'selected' : ''}"
                @click=${this.handleSelectedItem}>
                ${item}
              </span>
            `;
          })}
        </div>
      `;
    } else {
      new Error('Something went wrong!, Check firstupdated method to initialize search object');
      return null;
    }
  }

  private async handleSetFilter() {
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('filter', {
        detail: this.search
      }));
      this.hideClickAsync();
    }, 100);
  }

  private async handleChangeValue(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value.trim();
    if (this.search?.type === 'text') {
      this.search.value = value.length > 0 ? value : undefined;
    }
  }

  private async handleChangeRange(event: Event, type: 'from' | 'to') {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (this.search?.type === 'dateRange') {
      const dateValue = value.length > 0 ? new Date(target.value) : undefined;
      if (type === 'from') this.search.dateFrom = dateValue;
      else if (type === 'to') this.search.dateTo = dateValue;
    } else if (this.search?.type === 'numberRange') {
      const numberValue = value.length > 0 ? Number(target.value) : undefined;
      if (type === 'from') this.search.numberFrom = numberValue;
      else if (type === 'to') this.search.numberTo = numberValue;
    }
  }

  private async handleSelectedItem(event: Event) {
    const target = event.target as HTMLElement;
    const item = target.innerText;
    if (this.search?.type === 'select') {
      const selectList = this.search.list;
      if (selectList.includes(item)) {
        this.search.list = selectList.filter(x => x !== item);
      } else {
        this.search.list = [...selectList, item];
      }
    }
    this.requestUpdate();
  }

  private formatDate(date: Date) {
    if (!date) return '';
    if (!(date instanceof Date)) date = new Date(date);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // 'YYYY-MM-DDTHH:mm' 형식으로 반환
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  static styles = [styles];
}