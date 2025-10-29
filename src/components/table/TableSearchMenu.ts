import { html  } from 'lit';
import { customElement, property } from "lit/decorators.js";

import { UFlyout, UFlyoutPosition } from "@iyulab/components";

import type { 
  SearchOption, 
  ColumnDefinition, 
  SearchColumn 
} from "./UTableModel";

import { styles } from './TableSearchMenu.styles';

const arrowUp = "M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z";
const arrowDown = "M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z";
const none = "M200-440v-80h560v80H200Z";

@customElement("table-search-menu")
export class TableSearchMenu extends UFlyout {
  keepHover: boolean = true;
  position: UFlyoutPosition = "BottomLeft";

  @property({ type: Object })
  search?: SearchOption;

  @property({ type: Array })
  columns?: ColumnDefinition[];

  render() {
    return html`
      <div class="container">
        <div class="header">
          <div></div>
          <div>FilterBy</div>
          <div>OrderBy</div>
        </div>
        <div class="body">
          ${this.renderSearchList()}
        </div>
        <div class="footer">
          <span class="cancel" @click=${this.hideClickAsync}>
            Cancel
          </span>
          <span class="apply" @click=${this.handleSetSearch}>
            Apply
          </span>
        </div>
      </div>
    `;
  }

  public async showSearchAsync(event: MouseEvent, columns: ColumnDefinition[], search: SearchOption) {
    this.columns = columns;
    this.search = JSON.parse(JSON.stringify(search));
    this.requestUpdate();
    await this.updateComplete;
    this.toggleAsync(event);
  }

  public async hideClickAsync() {
    this.search = undefined;
    super.hideClickAsync();
  }

  // 테이블 메뉴버튼 렌더링(필터 리스트)
  private renderSearchList() {
    if(!this.search || !this.columns) return null;

    if(this.search.columns.length === 0) {
      return html`
        <div class="search-item">
          <span class="search-none">No search items have been set</span>
        </div>
      `;
    } else {
      return html`${this.search.columns.map((column) => {
        const columnTitle = this.columns?.find((c) => c.name === column.name)?.title ?? column.name;
        return html`
          <div class="search-item">
            <div class="title">${columnTitle}</div>
            <div class="filterby">
              ${this.renderFilterItem(column)}
            </div>
            <div class="orderby">
              ${this.renderOrderBy(column)}
            </div>
          </div>
        `;
        })}
      `;
    }
  }

  // 필터 아이템 렌더링
  private renderFilterItem(column: SearchColumn) {
    if(column.type === 'text') {
      return html`
        <input type="text" .value=${column.value ?? ''} placeholder="Search Field"
            @change=${(e:any) => this.handleChangeValue(e, column)}/>`
    } else if(column.type === 'numberRange') {
      return html`
        <input type="number" @change=${(e:any) => this.handleChangeRange(e, 'from', column)}
            .value=${column.numberFrom?.toString() ?? ''} />
        <span>~</span>
        <input type="number" @change=${(e:any) => this.handleChangeRange(e, 'to', column)}
            .value=${column.numberTo?.toString() ?? ''} />`
    } else if(column.type === 'dateRange') {
      return html`
        <input type="datetime-local" @change=${(e:any) => this.handleChangeRange(e, 'from', column)}
            .value=${column.dateFrom ? this.formatDate(column.dateFrom) : ''} />
        <span>~</span>
        <input type="datetime-local" @change=${(e:any) => this.handleChangeRange(e, 'to', column)}
            .value=${column.dateTo ? this.formatDate(column.dateTo) : ''} />`
    } else if(column.type === 'select') {
      const list = this.columns?.find((c) => c.name === column.name)?.selectList ?? [];
      return html`${list.map((item) => {
        const selected = column.list.find((i) => i === item);
        return html`
          <span class="item ${selected ? 'selected': ''}"
            @click=${(e:any) => this.handleSelectedItem(e, column)}>
            ${item}
          </span>`;
      })}`
    } else {
      return null;
    }
  }

  // 정렬 아이템 렌더링
  private renderOrderBy(column: SearchColumn) {
    return html`
      <svg class="order-value" viewBox="0 -960 960 960"
        @click=${() => this.handleChangeOrder(column)}>
        <path d="${column.orderby === 'asc' ? arrowUp 
            : column.orderby === 'desc' ? arrowDown 
            : none}">
        </path>
      </svg>
    `;
  }

  // Apply 버튼 클릭 적용
  private async handleSetSearch() {
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('search', {
        detail: this.search
      }));
      this.hideClickAsync();
    }, 100);
  }

  private async handleChangeValue(event: Event, column: SearchColumn) {
    const target = event.target as HTMLInputElement;
    const value = target.value.trim();
    if(column.type === 'text') {
      column.value = value.length > 0 ? value : undefined;
    }
  }

  private async handleChangeRange(event: Event, type: 'from' | 'to', column: SearchColumn) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if(column.type === 'dateRange') {
      const dateValue = value.length > 0 ? new Date(target.value) : undefined;
      if(type === 'from') column.dateFrom = dateValue;
      else if(type === 'to') column.dateTo = dateValue;
    } else if(column.type === 'numberRange') {
      const numberValue = value.length > 0 ? Number(target.value) : undefined;
      if(type === 'from') column.numberFrom = numberValue;
      else if(type === 'to') column.numberTo = numberValue;
    }
  }

  private async handleSelectedItem(event: Event, column: SearchColumn) {
    const target = event.target as HTMLElement;
    const item = target.innerText;
    if(column.type === 'select') {
      const selectList = column.list;
      if(selectList.includes(item)) {
        column.list = selectList.filter(x => x !== item);
      } else {
        column.list = [...selectList, item];
      }
    }
    this.requestUpdate();
  }

  private async handleChangeOrder(column: SearchColumn) {
    if(column.orderby === 'asc') {
      column.orderby = 'desc';
    } else if(column.orderby === 'desc') {
      column.orderby = undefined;
    } else {
      column.orderby = 'asc';
    }
    this.requestUpdate();
  }

  private formatDate(date: Date) {
    if (!date) return '';
    if(!(date instanceof Date)) date = new Date(date);

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