import { html } from 'lit';
import { property, state } from "lit/decorators.js";
import { styleMap } from 'lit/directives/style-map.js';

import { BaseElement } from '@iyulab/components/dist/components/BaseElement.js';
import { styles } from './DataView.styles.js';

// 이미지 사이즈 변수 정의
const IMAGE_SIZE_LIST = 128;
const IMAGE_SIZE_TABLE = 64;
const IMAGE_SIZE_GRID = 128;

interface DataViewColumnDefinition {
  name: string;
  display?: string;
}

/**
 * Data View Component
 */
export class DataView extends BaseElement {
  static styles = [ styles ];
  static dependencies: Record<string, typeof BaseElement> = {};

  /** 표시할 데이터 배열을 지정합니다. */
  @property({ type: Array }) data: any[] = [];
  /** 데이터 뷰의 레이아웃을 지정합니다. ('list', 'grid' 또는 'table') */
  @property({ type: String }) layout: "list" | "grid" | "table" = "grid";
  /** 각 아이템을 렌더링하는 함수를 지정합니다. */
  @property({ type: Object }) renderItem?: (item: any) => HTMLElement;
  /** 각 아이템의 이미지를 렌더링하는 함수를 지정합니다. */
  @property({ type: Object }) renderImage?: (item: any) => HTMLElement;
  /** 각 아이템의 필드를 렌더링하는 함수를 지정합니다. */
  @property({ type: Object }) renderFields?: (item: any) => HTMLElement;
  /** 페이지당 표시할 아이템 수를 지정합니다. */
  @property({ type: Number }) itemsPerPage?: number;
  /** 아이템의 이미지 필드 이름을 지정합니다. */
  @property({ type: String }) imageField: string = 'image';
  /** 아이템 간 마진을 지정합니다. */
  @property({ type: String }) itemMargin: string = '1rem';
  /** 그리드 레이아웃에서 아이템의 최소 너비를 지정합니다. */
  @property({ type: String }) minItemWidth: string = '250px';
  /** 표시할 열 정보를 지정합니다. 지정하지 않으면 이미지를 제외한 모든 필드가 표시됩니다. */
  @property({ type: Array }) columns?: DataViewColumnDefinition[];

  /** 아이템 선택 시 호출되는 콜백 함수를 지정합니다. */
  @property({ type: Object }) onItemSelect?: (item: any) => void;
  /** 아이템 더블 클릭 시 호출되는 콜백 함수를 지정합니다. */
  @property({ type: Object }) onItemDoubleClick?: (item: any) => void;

  @state() private selectedItem: any = null;
  @state() private currentLayout: "list" | "grid" | "table" = "grid";
  @state() private loading: boolean = true;
  @state() private imageLoadErrors: Set<string> = new Set();
  @state() private randomColors: Map<string, string> = new Map();
  
  connectedCallback() {
    super.connectedCallback();
    // 데이터 로딩 시뮬레이션
    setTimeout(() => {
      this.loading = false;
      this.requestUpdate();
    }, 2000); // 2초 후 로딩 완료
  }

  private handleImageError(item: any) {
    this.imageLoadErrors.add(item[this.imageField]);
    this.requestUpdate();
  }

  private renderTable() {
    const columns = this.columns || this.getDefaultColumns();
    return html`
      <table class="default-table">
        <thead>
          <tr>
            <th>Image</th>
            ${columns.map(column => html`<th>${this.getDisplayName(column)}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.loading 
            ? Array(5).fill(0).map(() => html`
                <tr>
                  <td><u-skeleton effect="sheen" width="64px" height="64px"></u-skeleton></td>
                  ${columns.map(() => html`
                    <td><u-skeleton effect="sheen" width="80%" height="1em"></u-skeleton></td>
                  `)}
                </tr>
              `)
            : this.data?.map(item => html`
                <tr class="default-item ${this.selectedItem === item ? 'selected' : ''}"
                    @click=${() => this.handleItemClick(item)}
                    @dblclick=${() => this.handleItemDoubleClick(item)}>
                  <td class="image-cell">
                    ${this.defaultRenderImage(item, 'table')}
                  </td>
                  ${columns.map(column => html`<td>${this.formatValue(item[column.name])}</td>`)}
                </tr>
              `)
          }
        </tbody>
      </table>
    `;
  }

  private getDefaultColumns(): DataViewColumnDefinition[] {
    if (this.data && this.data.length > 0) {
      return Object.keys(this.data[0])
        .filter(key => key !== this.imageField)
        .map(key => ({ name: key }));
    }
    return [];
  }

  private getDisplayName(column: DataViewColumnDefinition): string {
    return column.display || this.toPascalCase(column.name);
  }

  private toPascalCase(str: string): string {
    const words = str.split(/(?=[A-Z])|\s+|[-_]+/);
    
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private formatValue(value: any): string {
    if (value instanceof Date) {
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
    }
    return value;
  }

  private defaultRenderFields(item: any) {
    const columns = this.columns || this.getDefaultColumns();
    return html`
      <div class="default-fields">
        ${columns.map(column => html`
          <div class="field">
            ${this.loading 
              ? html`
                  <u-skeleton effect="sheen" width="30%" height="1em" class="field-title"></u-skeleton>
                  <u-skeleton effect="sheen" width="60%" height="1em" class="field-value"></u-skeleton>
                `
              : html`
                  <span class="field-title">${this.getDisplayName(column)}:</span>
                  <span class="field-value">${this.formatValue(item[column.name])}</span>
                `
            }
          </div>
        `)}
      </div>
    `;
  }
  
  private getRandomColor(key: string): string {
    if (!this.randomColors.has(key)) {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 60 + Math.floor(Math.random() * 20);
      this.randomColors.set(key, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return this.randomColors.get(key)!;
  }

  private defaultRenderImage(item: any, viewType: 'grid' | 'list' | 'table' = 'grid') {
    if (this.loading) {
      const skeletonSize = viewType === 'table' ? `${IMAGE_SIZE_TABLE}px` : 
                           viewType === 'list' ? `${IMAGE_SIZE_LIST}px` : 
                           `${IMAGE_SIZE_GRID}px`;
      return html`<u-skeleton effect="sheen" width=${skeletonSize} height=${skeletonSize} style="margin-bottom: 1em;"></u-skeleton>`;
    }
  
    const imageSrc = item[this.imageField];
    const imageClass = `default-image ${viewType}-image`;
    if (imageSrc && !this.imageLoadErrors.has(imageSrc)) {
      return html`
        <img 
          src=${imageSrc} 
          alt="Item image" 
          class=${imageClass}
          @error=${() => this.handleImageError(item)}
          style=${viewType !== 'grid' ? "" : "margin-bottom: 1em;"}
        />
      `;
    } else {
      const backgroundColor = this.getRandomColor(item.id || JSON.stringify(item));
      const textColor = this.getContrastColor(backgroundColor);
      const styles = {
        backgroundColor,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: viewType === 'table' ? '1.5rem' : '2rem',
        fontWeight: 'bold',
        width: viewType === 'table' ? `${IMAGE_SIZE_TABLE}px` : 
               viewType === 'list' ? `${IMAGE_SIZE_LIST}px` : '100%',
        height: viewType === 'table' ? `${IMAGE_SIZE_TABLE}px` : 
                viewType === 'list' ? `${IMAGE_SIZE_LIST}px` : `${IMAGE_SIZE_GRID}px`,
      };
      
      return html`
        <div class=${`${imageClass} placeholder-image`} style=${styleMap(styles)}>
          ${item.name ? item.name.charAt(0).toUpperCase() : 'N/A'}
        </div>
      `;
    }
  }

  private getContrastColor(backgroundColor: string): string {
    const rgb = this.hexToRgb(backgroundColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  protected render() {
    return html`
      <div class="u-data-view-container">
        <div class="layout-selector">
          <u-icon-button type="system" name="grid" size="24px"
            @click=${() => this.setLayout('grid')}
            color=${this.currentLayout === 'grid' ? `var(--sl-color-primary-600)` : `var(--sl-color-neutral-600)`}
          >
          </u-icon-button>
          <u-icon-button type="system" name="list-ul" size="24px"
            @click=${() => this.setLayout('list')}
            color=${this.currentLayout === 'list' ? `var(--sl-color-primary-600)` : `var(--sl-color-neutral-600)`}
          >
          </u-icon-button>
          <u-icon-button type="system" name="table" size="24px"
            @click=${() => this.setLayout('table')}
            color=${this.currentLayout === 'table' ? `var(--sl-color-primary-600)` : `var(--sl-color-neutral-600)`}
          >
          </u-icon-button>
        </div>
        <div class="u-data-view ${this.currentLayout}" style="--item-margin: ${this.itemMargin}; --min-item-width: ${this.minItemWidth};">
          ${this.currentLayout === 'table' ? this.renderTable() : this.renderItems()}
        </div>
      </div>
    `;
  }

  private renderItems() {
    if (this.loading) {
      return Array(5).fill(0).map(() => html`
        <div class="default-item" style="padding: 1em; border: 1px solid #eee; border-radius: 4px;">
          <u-skeleton effect="sheen" width="100%" height="${IMAGE_SIZE_GRID}px" style="margin-bottom: 1em;"></u-skeleton>
          <div class="default-fields">
            ${Array(3).fill(0).map(() => html`
              <div class="field" style="margin-bottom: 0.5em;">
                <u-skeleton effect="sheen" width="30%" height="1em" style="margin-right: 0.5em;"></u-skeleton>
                <u-skeleton effect="sheen" width="60%" height="1em"></u-skeleton>
              </div>
            `)}
          </div>
        </div>
      `);
    }

    return this.data?.map((item) =>
      this.renderItem
        ? this.renderItem(item)
        : html`
            <div class="default-item ${this.selectedItem === item ? 'selected' : ''}"
                 @click=${() => this.handleItemClick(item)}
                 @dblclick=${() => this.handleItemDoubleClick(item)}>
              ${this.renderImage ? this.renderImage(item) : this.defaultRenderImage(item, this.currentLayout as 'grid' | 'list' | 'table')}
              ${this.renderFields ? this.renderFields(item) : this.defaultRenderFields(item)}
            </div>
          `
    );
  }

  protected setLayout(newLayout: "list" | "grid" | "table") {
    this.currentLayout = newLayout;
    this.requestUpdate();
  }

  private handleItemClick(item: any) {
    this.selectedItem = item;
    if (this.onItemSelect) {
      this.onItemSelect(item);
    }
    this.requestUpdate();
  }

  private handleItemDoubleClick(item: any) {
    if (this.onItemDoubleClick) {
      this.onItemDoubleClick(item);
    }
  }
}