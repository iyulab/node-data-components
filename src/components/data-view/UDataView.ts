import { html, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import '@iyulab/components/dist/components/button/UButton.js';
import { UElement } from '@iyulab/components/dist/components/UElement.js';
import { messages } from '../../utilities/messages.js';
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
  /** Column width — a number is pixels, a string is any CSS length (same as `u-rich-table`). */
  width?: number | string;
}

/**
 * 보기 전환 아이콘 — 이 컴포넌트 자신의 크롬이라 직접 그린다. 종전에는 Bootstrap Icons 를
 * CDN 에서 읽어, 공용 인터넷에 닿지 않는 망에서는 버튼이 비었다.
 */
const VIEW_ICONS = {
  grid: svg`<rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>`,
  list: svg`<rect x="1" y="2" width="2" height="2" rx="1"/><rect x="5" y="2" width="10" height="2" rx="1"/><rect x="1" y="7" width="2" height="2" rx="1"/><rect x="5" y="7" width="10" height="2" rx="1"/><rect x="1" y="12" width="2" height="2" rx="1"/><rect x="5" y="12" width="10" height="2" rx="1"/>`,
  table: svg`<path d="M2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm0 1v3h12V2H2Zm0 4v3h5V6H2Zm6 0v3h6V6H8Zm-6 4v4h5v-4H2Zm6 0v4h6v-4H8Z" fill-rule="evenodd"/>`,
};

/**
 * Data View Component
 * 데이터를 3가지 레이아웃(grid, list, table)으로 표시하는 컴포넌트
 *
 * 두 표(`flex-table` · `u-rich-table`)와 **같은 뷰 어휘**를 받는다 — `data` · `totalCount` · `loading` · `error` ·
 * `emptyMessage` · `loadingMessage`. 같은 데이터 소스(`createODataSource`·`createArraySource`)의 상태를 그대로 넘기면
 * 표 대신 카드로 같은 목록을 그린다(목록 키트의 «표 ↔ 카드» 가 속성 하나로 바뀌는 근거).
 */
@customElement('u-data-view')
export class UDataView extends UElement {
  static styles = [super.styles, styles];

  /** 표시할 레코드 — 두 표의 `data` 와 같은 이름·같은 뜻(서버 페이지 목록이면 지금 페이지). */
  @property({ type: Array }) data: DataItem[] = [];
  /**
   * 전체 건수 — 툴바의 «N items» 가 이것을 센다. 서버 페이지 목록은 `data` 가 한 페이지라 소스의 `totalCount` 를 준다.
   * 주지 않으면 `data.length`.
   */
  @property({ type: Number, attribute: 'total-count' }) totalCount?: number;
  /** 불러오는 중 — 내용 대신 `loadingMessage` 를 그린다(지난 결과를 «지금 결과» 로 보이지 않게). */
  @property({ type: Boolean }) loading = false;
  /** 불러오는 중 문구. 비우면 로케일 문장(`loading`). */
  @property({ type: String, attribute: 'loading-message' }) loadingMessage = '';
  /**
   * 마지막 불러오기의 실패, 없으면 `null`. 있는 동안(그리고 `loading` 이 아닌 동안) 내용 대신 `error.message` 를 경보로
   * 그린다 — 실패한 조회가 «데이터 없음» 으로 보이지 않게. 데이터 소스의 `error` 를 그대로 받는다(`{ message }` 면 된다).
   */
  @property({ attribute: false }) error: { message: string } | null = null;
  /** `data` 가 비었을 때의 문구. 비우면 로케일 문장(`empty`). */
  @property({ type: String, attribute: 'empty-message' }) emptyMessage = '';
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
          ${this.renderViewButton('grid', VIEW_ICONS.grid, messages.text('viewGrid'))}
          ${this.renderViewButton('list', VIEW_ICONS.list, messages.text('viewList'))}
          ${this.renderViewButton('table', VIEW_ICONS.table, messages.text('viewTable'))}
        </div>
        <div class="info">
          ${messages.text('itemCount', { count: this.totalCount ?? this.data.length })}
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
  private renderViewButton(mode: ViewMode, icon: SVGTemplateResult, label: string) {
    const selected = this.mode === mode;
    return html`
      <u-button
        appearance=${selected ? 'solid' : 'plain'}
        color=${selected ? 'primary' : 'neutral'}
        title=${label}
        aria-label=${label}
        aria-pressed=${selected ? 'true' : 'false'}
        @click=${() => { this.mode = mode; }}
      >
        <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true">${icon}</svg>
      </u-button>
    `;
  }

  private renderContent() {
    // 표와 같은 순서 — 불러오는 중이 먼저(지난 오류·지난 결과를 지금 것으로 보이지 않게), 그다음 실패, 그다음 빈 결과.
    if (this.loading) {
      return html`<div class="state loading" aria-busy="true">${this.loadingMessage || messages.text('loading')}</div>`;
    }
    if (this.error) {
      return html`<div class="state error" role="alert">${this.error.message}</div>`;
    }
    if (!this.data?.length) {
      return html`<div class="state empty">${this.emptyMessage || messages.text('empty')}</div>`;
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
        ${this.data.map((item, index) => this.renderGridItem(item, index))}
      </div>
    `;
  }

  private renderList() {
    return html`
      <div class="list" style="--gap: ${this.gap};">
        ${this.data.map((item, index) => this.renderListItem(item, index))}
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
                <th style=${col.width != null ? `width: ${typeof col.width === 'number' ? `${col.width}px` : col.width}` : ''}>
                  ${col.label || this.formatLabel(col.key)}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${this.data.map((item, index) => html`
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
    if (this.data.length > 0) {
      const firstItem = this.data[0];
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