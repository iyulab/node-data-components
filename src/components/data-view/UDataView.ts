import { html, type TemplateResult } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';

import '@iyulab/components/dist/components/icon/UIcon.js';
import '@iyulab/components/dist/components/button/UButton.js';
import { UElement } from '@iyulab/components/dist/components/UElement.js';
import { styles } from './UDataView.styles';

export type ViewMode = 'grid' | 'list' | 'table';

export interface DataColumn {
  key: string;
  label?: string;
  width?: string;
}

/**
 * Data View Component
 * 데이터를 3가지 레이아웃(grid, list, table)으로 표시하는 컴포넌트
 */
@customElement('u-data-view')
export class UDataView extends UElement {
  static styles = [super.styles, styles];

  /** 표시할 데이터 배열 */
  @property({ type: Array }) items: any[] = [];
  /** 현재 뷰 모드 */
  @property({ type: String }) mode: ViewMode = 'grid';
  /** 표시할 컬럼 설정 (미지정시 자동 감지) */
  @property({ type: Array }) columns?: DataColumn[];
  /** 그리드 모드 최소 폭 */
  @property({ type: String }) gridMinWidth = '200px';
  /** 아이템 간격 */
  @property({ type: String }) gap = '1rem';
  /** 커스텀 렌더 함수 (grid/list 카드용) */
  @property({ attribute: false }) renderCard?: (item: any, index: number) => TemplateResult;
  /** 커스텀 셀 렌더 함수 (table용) */
  @property({ attribute: false }) renderCell?: (item: any, column: DataColumn, index: number) => TemplateResult | string;

  @state() private selectedIndex: number | null = null;

  render() {
    return html`
      <div class="data-view">
        ${this.renderToolbar()}
        ${this.renderContent()}
      </div>
    `;
  }

  private renderToolbar() {
    return html`
      <div class="toolbar">
        <div class="view-toggles">
          ${this.renderViewButton('grid', 'grid-3x3-gap', 'Grid')}
          ${this.renderViewButton('list', 'list-ul', 'List')}
          ${this.renderViewButton('table', 'table', 'Table')}
        </div>
        <div class="info">
          ${this.items.length} items
        </div>
      </div>
    `;
  }

  private renderViewButton(mode: ViewMode, icon: string, label: string) {
    return html`
      <u-button
        ?active=${this.mode === mode}
        title=${label}
      >
        <u-icon lib="bootstrap" name=${icon}></u-icon>
      </u-button>
    `;
  }

  private renderContent() {
    if (!this.items?.length) {
      return html`<div class="empty">No data available</div>`;
    }

    switch (this.mode) {
      case 'grid': return this.renderGrid();
      case 'list': return this.renderList();
      case 'table': return this.renderTable();
    }
  }

  private renderGrid() {
    return html`
      <div class="grid" style="--min-width: ${this.gridMinWidth}; --gap: ${this.gap};">
        ${this.items.map((item, index) => this.renderGridItem(item, index))}
      </div>
    `;
  }

  private renderList() {
    return html`
      <div class="list" style="--gap: ${this.gap};">
        ${this.items.map((item, index) => this.renderListItem(item, index))}
      </div>
    `;
  }

  private renderTable() {
    const cols = this.getColumns();
    
    return html`
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              ${cols.map(col => html`
                <th style=${col.width ? `width: ${col.width}` : ''}>
                  ${col.label || this.formatLabel(col.key)}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${this.items.map((item, index) => html`
              <tr 
                class=${this.selectedIndex === index ? 'selected' : ''}
              >
                ${cols.map(col => html`
                  <td>${this.getCellContent(item, col, index)}</td>
                `)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderGridItem(item: any, index: number) {
    const content = this.renderCard 
      ? this.renderCard(item, index)
      : this.renderDefaultCard(item);

    return html`
      <div 
        class="card ${this.selectedIndex === index ? 'selected' : ''}"
      >
        ${content}
      </div>
    `;
  }

  private renderListItem(item: any, index: number) {
    const content = this.renderCard
      ? this.renderCard(item, index)
      : this.renderDefaultCard(item);

    return html`
      <div 
        class="card list-card ${this.selectedIndex === index ? 'selected' : ''}"
      >
        ${content}
      </div>
    `;
  }

  private renderDefaultCard(item: any) {
    const cols = this.getColumns();
    
    return html`
      <div class="card-content">
        ${cols.slice(0, 5).map(col => {
          const value = item[col.key];
          return html`
            <div class="card-field">
              <span class="label">${col.label || this.formatLabel(col.key)}:</span>
              <span class="value">${this.formatValue(value)}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private getCellContent(item: any, column: DataColumn, index: number): TemplateResult | string {
    if (this.renderCell) {
      return this.renderCell(item, column, index);
    }
    return this.formatValue(item[column.key]);
  }

  private getColumns(): DataColumn[] {
    if (this.columns?.length) {
      return this.columns;
    }

    // 자동 감지
    if (this.items.length > 0) {
      const firstItem = this.items[0];
      return Object.keys(firstItem).map(key => ({ key }));
    }

    return [];
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (value == null) return '—';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "u-data-view": UDataView;
  }
}