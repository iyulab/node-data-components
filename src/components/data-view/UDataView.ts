import { html, type TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import '@iyulab/components/dist/components/icon/UIcon.js';
import '@iyulab/components/dist/components/button/UButton.js';
import { UElement } from '@iyulab/components/dist/components/UElement.js';
import { styles } from './UDataView.styles';

export type ViewMode = 'grid' | 'list' | 'table';

/**
 * UDataView 가 표시하는 임의의 데이터 레코드.
 *
 * 이 컴포넌트는 소비자의 도메인 타입을 제한하지 않는 범용 뷰어이므로 열린
 * 타입이 설계 의도다. `any` 를 컴포넌트 전역에 흩뿌리는 대신 여기 한 곳으로
 * 격리해 의도를 명시한다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataItem = Record<string, any>;

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
  @property({ type: Array }) items: DataItem[] = [];
  /** 현재 뷰 모드 */
  @property({ type: String }) mode: ViewMode = 'grid';
  /** 표시할 컬럼 설정 (미지정시 자동 감지) */
  @property({ type: Array }) columns?: DataColumn[];
  /** 그리드 모드 최소 폭 */
  @property({ type: String }) gridMinWidth = '200px';
  /** 아이템 간격 */
  @property({ type: String }) gap = '1rem';
  /** 커스텀 렌더 함수 (grid/list 카드용) */
  @property({ attribute: false }) renderCard?: (item: DataItem, index: number) => TemplateResult;
  /** 커스텀 셀 렌더 함수 (table용) */
  @property({ attribute: false }) renderCell?: (item: DataItem, column: DataColumn, index: number) => TemplateResult | string;


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

  /**
   * 레이아웃 전환 버튼.
   *
   * ⚠**선택 상태를 `variant`+`color` 로 나타낸다.** 종전에는 `?active` 로 이 시트의
   * `u-button[active]` 규칙(배경 한 줄)을 켰는데, 그 규칙은 자기 주석에 *"주색 위의 글자
   * 대비가 3.45~3.68 로 최선이 아니다"* 라고 적고 있었다. `UButton` 자신의 `variant`·`color`
   * 를 쓰면 그 대비 계약을 컴포넌트가 책임진다.
   * 접근성은 `aria-pressed` 가 나른다 — 색만으로는 토글 상태가 보조기술에 닿지 않는다.
   */
  private renderViewButton(mode: ViewMode, icon: string, label: string) {
    const selected = this.mode === mode;
    return html`
      <u-button
        variant=${selected ? 'solid' : 'ghost'}
        color=${selected ? 'primary' : 'neutral'}
        title=${label}
        aria-label=${label}
        aria-pressed=${selected ? 'true' : 'false'}
        @click=${() => { this.mode = mode; }}
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
              <tr>
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

  private renderGridItem(item: DataItem, index: number) {
    const content = this.renderCard 
      ? this.renderCard(item, index)
      : this.renderDefaultCard(item);

    return html`
      <div class="card">
        ${content}
      </div>
    `;
  }

  private renderListItem(item: DataItem, index: number) {
    const content = this.renderCard
      ? this.renderCard(item, index)
      : this.renderDefaultCard(item);

    return html`
      <div class="card list-card">
        ${content}
      </div>
    `;
  }

  private renderDefaultCard(item: DataItem) {
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

  private getCellContent(item: DataItem, column: DataColumn, index: number): TemplateResult | string {
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

  private formatValue(value: unknown): string {
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