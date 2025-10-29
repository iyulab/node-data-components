import { LitElement, TemplateResult, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
// import { convertReact } from "@iyulab/components";
import { styles as componentStyles } from './UTable.styles';

import { TableTooltip } from "./TableTooltip";
import { TableSearchMenu } from "./TableSearchMenu";
import { TableSortMenu } from "./TableSortMenu";
import { TableFilterMenu } from "./TableFilterMenu";

import type { 
  UTableModel,
  TableOption,
  ButtonDefinition, 
  ColumnDefinition, 
  SearchOption,
  SearchColumn,
  BasicColumn,
  BadgeColumn,
  ImgColumn, 
} from "./UTableModel";
import { UTableIcons } from "./UTableModel";

/*
- 올려야할 이벤트
select: 선택된 아이템(외부 액션 활용)
search: 검색 이벤트(필터, 정렬)
filter: 필터 이벤트(검색, 범위, 선택)
sort: 정렬 이벤트(오름차순, 내림차순)
*/
@customElement("u-table")
export class UTableElement extends LitElement implements UTableModel {
  static styles = [componentStyles];

  private tooltip = new TableTooltip();
  private searchMenu = new TableSearchMenu();
  private sortMenu = new TableSortMenu();
  private filterMenu = new TableFilterMenu();

  @query('.table')
  table!: HTMLTableElement;

  @query('.header-checkbox')
  headerCheckbox!: HTMLInputElement;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Number })
  total?: number;

  @property({ type: Object })
  search: SearchOption = {
    limit: 20,
    offset: 0,
    columns: [],
  };

  @property({ type: Array })
  selectedItems: any[] = [];

  @property({ type: Array })
  data: any[] = [];

  @property({ type: Object })
  option?: TableOption;

  @property({ type: Array })
  columns: ColumnDefinition[] = [];

  @property({ type: Array })
  buttons: ButtonDefinition[] = [];

  connectedCallback() {
    super.connectedCallback();
    document.body.appendChild(this.tooltip);
    document.body.appendChild(this.searchMenu);
    document.body.appendChild(this.sortMenu);
    document.body.appendChild(this.filterMenu);
    this.searchMenu.addEventListener('search', (e: any) => this.handleSearchEvent(e));
    this.sortMenu.addEventListener('orderby', (e: any) => this.handleSortEvent(e));
    this.filterMenu.addEventListener('filter', (e: any) => this.handleFilterEvent(e));
  }

  disconnectedCallback() {
    document.body.removeChild(this.tooltip);
    document.body.removeChild(this.searchMenu);
    document.body.removeChild(this.sortMenu);
    document.body.removeChild(this.filterMenu);
    super.disconnectedCallback();
  }

  protected async firstUpdated(_changedProperties: any) {
    super.firstUpdated(_changedProperties);
    await this.updateComplete;

    // 컬럼 정렬
    this.columns.sort((a, b) => a.order - b.order);
    // 검색 옵션 초기화
    this.columns.forEach((column) => {
      let option: SearchColumn | undefined = undefined;

      if (column.useSort)
        option = { name: column.name, type: undefined };

      if (column.useFilter === 'text')
        option = { name: column.name, type: 'text', value: undefined };
      else if (column.useFilter === 'numberRange')
        option = { name: column.name, type: 'numberRange', numberFrom: undefined, numberTo: undefined };
      else if (column.useFilter === 'dateRange')
        option = { name: column.name, type: 'dateRange', dateFrom: undefined, dateTo: undefined };
      else if (column.useFilter === 'select')
        option = { name: column.name, type: 'select', list: [] };

      if (option) this.search.columns.push(option);
    });
    // 첫 데이터 로드
    if (this.option?.firstLoad) {
      this.loading = true;
      const result = await this.option.firstLoad(this.search);
      this.data = result?.data ?? [];
      this.total = result?.total ?? this.total;
      this.loading = false;
    }
    // 페이징 제한 설정
    if (this.option?.limit) {
      this.search.limit = this.option.limit;
    }
  }

  protected async updated(_changedProperties: any) {
    super.updated(_changedProperties);
    await this.updateComplete;

    if (_changedProperties.has('data')) {
      // 선택 아이템 초기화
      this.selectedItems = [];

      // 헤더 체크박스 초기화
      if (this.headerCheckbox) {
        this.headerCheckbox.checked = false;
        this.headerCheckbox.indeterminate = false;
      }
    }

    // 테이블 높이에 맞춰 컬럼 너비조절기 높이 변경
    this.adjustWidthControlHeight();
  }

  render() {
    if (this.columns.length === 0) throw new Error('columns는 필수 속성입니다');

    return html`
      <div class="container">
        <div class="menu">
          ${this.renderTableMenu()}
        </div>
        <table class="table">
          <thead class="header">
            <tr class="header-row">
              ${this.renderHeader(this.columns)}
              ${this.renderLoadingSpinner()}
            </tr>
          </thead>
          <tbody class="body">
            ${this.renderBody(this.data)}
          </tbody>
        </table>
        <div class="footer">
          ${this.option?.usePaging ? this.renderPageNation() : null}
        </div>
      </div>
    `;
  }

  // 데이터 로드
  public async loadDataAsync() {
    if (!this.option?.load) return;

    this.loading = true;
    const result = await this.option.load(this.search);
    this.data = result?.data ?? this.data;
    this.total = result?.total ?? this.total;
    this.loading = false;
  }

  // 데이터 삭제
  private async deleteDataAsync(items: any[]) {
    if (!this.option?.delete) return;

    const result = await this.option.delete(items);
    if (result) this.loadDataAsync();
  }

  // 로딩 스피너 렌더링
  private renderLoadingSpinner() {
    return html`
      <div class="loading-container ${this.loading ? 'active' : ''}">
        <div class="spinner"></div>
      </div>
    `;
  }

  // 테이블 메뉴 렌더링(선택된 아이템 수, 필터리스트, 새로고침, 삭제, 추가)
  private renderTableMenu() {
    return html`
      <div class="item-count">
        [ ${this.selectedItems.length} / ${this.data.length} ] Selected
      </div>
      <div class="table-buttons">
        ${this.renderTableButtons()}
      </div>
    `;
  }

  // 테이블 메뉴버튼 렌더링
  private renderTableButtons() {
    const buttons: TemplateResult[] = [];
    if (this.search.columns.length > 0) {
      buttons.push(this.renderButton(
        UTableIcons.search,
        (e: any) => this.searchMenu.showSearchAsync(e, this.columns, this.search),
        "Search List"
      ));
    }
    if (this.option?.load) {
      buttons.push(this.renderButton(
        UTableIcons.refresh,
        () => this.loadDataAsync(),
        "Refresh"
      ));
    }
    if (this.option?.delete) {
      buttons.push(this.renderButton(
        UTableIcons.trash,
        () => this.deleteDataAsync(this.selectedItems),
        `Delete(${this.selectedItems.length})`
      ));
    }
    if (this.option?.create) {
      buttons.push(this.renderButton(
        UTableIcons.plus,
        () => this.option?.create?.(),
        "Create New"
      ));
    }
    if (this.buttons.find(b => b.type === 'table')) {
      this.buttons.forEach(button => {
        if (button.type === 'item') return;
        buttons.push(this.renderButton(
          button.svgData,
          () => button.action(this.selectedItems, this),
          button.display,
          button.color,
          button.svgViewBox
        ));
      });
    }

    return buttons;
  }

  // 테이블 헤더 셀 렌더링
  private renderHeader(columns: ColumnDefinition[]) {
    const header: TemplateResult[] = [];
    let initialIndex = 0;

    if (this.option?.useCheckbox) {
      header.push(html`
        <th class="header-content">
          <input class="header-checkbox" type="checkbox"
              @change=${this.handleHeaderCheckbox} />
        </th>
      `);
      initialIndex += 1;
    }

    if (this.option?.useCount) {
      header.push(html`
        <th class="header-content">
          <div class="header-number">No.</div>
        </th>
      `);
      initialIndex += 1;
    }

    columns.map((column, index) => {
      const ratio = column.widthRatio;
      if (ratio && (ratio > 1 || ratio < 0))
        throw new Error('width ratio는 0에서 1 사이의 값이어야 합니다');

      const width = ratio ? `${ratio * 100}%` : 'auto';
      const adjustIndex = index + initialIndex;

      header.push(html`
        <th class="header-content" style="width: ${width}">
          <div class="header-flex">
            ${column.useSort ? this.renderSortMenu(column.name) : null}
            <div class="header-title" style="text-align: ${column.headAlign ?? 'left'}">
              ${column.title}
            </div>
            ${column.useFilter ? this.renderFilterMenu(column) : null}
          </div>
          ${index < columns.length - 1 ? html`
              <div class="width-control" 
                  @mousedown=${(e:any) => this.handleAdjustWidth(e, adjustIndex)}>
              </div>` : null}
        </th>
      `)
    });

    if (this.buttons.length > 0 && this.buttons.find(b => b.type === 'item') ||
      this.option?.update || this.option?.delete) {
      header.push(html`<th class="header-content"></th>`);
    }

    return header;
  }

  // 테이블 헤더 정렬 메뉴 렌더링
  private renderSortMenu(name: string) {
    const target = this.search.columns.find(s => s.name === name);
    const order = target?.orderby;

    return html`
      <svg class="sort-menu ${order === 'asc' ? 'trans' : ''}" viewBox="0 0 24 24"
          @click=${(e: any) => this.sortMenu.showSortAsync(e, target)}>
        <path d=${order ? UTableIcons.desc : UTableIcons.sort}></path>
      </svg>
    `;
  }

  // 테이블 헤더 필터 메뉴 렌더링
  private renderFilterMenu(column: ColumnDefinition) {
    const target = this.search.columns.find(c => c.name === column.name);
    const selected = (target?.type === 'text' && target?.value !== undefined) ||
      (target?.type === 'select' && target?.list.length > 0) ||
      (target?.type === 'numberRange' && (target?.numberFrom !== undefined || target?.numberTo !== undefined)) ||
      (target?.type === 'dateRange' && (target?.dateFrom !== undefined || target?.dateTo !== undefined));

    return html`
      <svg class="filter-menu ${selected ? 'selected' : ''}" viewBox="0 -960 960 960"
          @click=${(e:any) => this.filterMenu.showFilterAsync(e, column, target)}>
        <path d=${UTableIcons.filter}></path>
      </svg>
    `
  }

  // 테이블 바디 아이템 렌더링
  private renderBody(data: any[]) {
    if (data.length === 0) {
      let colspan = this.columns.length;
      if (this.option?.useCheckbox) colspan += 1;
      if (this.option?.useCount) colspan += 1;
      if (this.option?.update || this.option?.delete || this.buttons.length > 0) colspan += 1;

      return html`
        <tr class="body-row">
          <td class="body-none" colspan=${colspan}>
            <div class="not-found">
              <svg class="icon" viewBox="0 -960 960 960">
                <path d=${UTableIcons.notFound}></path>
              </svg>
              <span>Not Found Data</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      return data.map((item: any, index: number) => {
        const selected = this.selectedItems.includes(item);
        return html`
          <tr class="body-row ${selected ? 'select' : ''}"
              @click=${(e: Event) => this.handleRowClick(e, item)}>
            ${this.option?.useCheckbox ? html`
              <td class="body-content">
                  <input class="body-checkbox" type="checkbox" 
                    .checked=${this.selectedItems.includes(item)}
                    @change=${(e:any) => this.handleBodyCheckbox(e, item)} />
              </td>
            ` : null}
            ${this.option?.useCount ? html`
              <td class="body-content">
                <div class="body-number">
                  ${this.total ? this.total - (index + 1) : this.data.length - index}
                </div>
              </td>
            ` : null}
            ${this.columns.map(column => html`
              <td class="body-content">
                <div style="display:flex; justify-content:${column.bodyAlign ?? 'left'}">
                  ${this.renderBodyItem(column, item)}
                </div>
              </td>
            `)}
            ${(this.buttons.length > 0 && this.buttons.find(b => b.type === 'item') ||
              this.option?.update || this.option?.delete) ? html`
                <td class="body-content">
                  <div class="button-cell">
                    ${this.renderButtonCell(item)}
                  </div>
                </td>
            ` : null}
            ${index < data.length ? html`
              <div class="height-control" 
                @mousedown=${(e:any) => this.handleAdjustHeight(e, index)}>
              </div>
            ` : null}
          </tr>
        `});
    }
  }

  // 테이블 바디 셀 데이터 렌더링
  private renderBodyItem(column: ColumnDefinition, item: any) {
    switch (column.type) {
      case 'basic':
        return this.renderBasicCell(column, item);
      case 'badge':
        return this.renderBadgeCell(column, item);
      case 'img':
        return this.renderImgCell(column, item);
    }
  }

// 테이블 바디 기본 셀 렌더링
private renderBasicCell(column: BasicColumn, item: any) {
  let value;
  if (column.name in item) value = item[column.name];
  else value = undefined;

  const content = column.render ? column.render(item) : value;
  return html`
    <span class="basic-cell ${column.action ? 'action' : ''}"
      @click=${column.action ? () => column.action?.(item) : undefined}
      @mouseenter=${column.tooltip
        ? (e:any) => this.tooltip.hoverData(e, item, column.tooltip)
        : undefined}>
      ${typeof content === 'object' && content instanceof HTMLElement
        ? content // DOM 요소 그대로 렌더링
        : typeof content === 'object' ? JSON.stringify(content,null,2) : content}
    </span>
  `;
}

  // 테이블 바디 배지 셀 렌더링
  private renderBadgeCell(column: BadgeColumn, item: any) {
    const { text, color } = column.render(item);
    return html`
        <div class="badge-cell" style="background-color:${color}"
          @click=${column.action ? () => column.action?.(item) : undefined}
          @mouseenter=${column.tooltip
          ? (e:any) => this.tooltip.hoverData(e, item, column.tooltip)
          : undefined}>
          ${text}
        </div>
    `;
  }

  // 테이블 바디 이미지 셀 렌더링
  private renderImgCell(column: ImgColumn, item: any) {
    const { src, width, height } = column.render(item);
    return html`
      <img class="img-cell" src=${src}
        width=${width ? `${width}px` : "30px"} height=${height ? `${height}px` : "30px"}
        @click=${column.action ? () => column.action?.(item) : undefined}
        @mouseenter=${column.tooltip
        ? (e:any) => this.tooltip.hoverData(e, item, column.tooltip)
        : undefined}>
    `;
  }

  // 테이블 아이템 버튼 렌더링
  private renderButtonCell(item: any) {
    const buttons = [] as TemplateResult[];
    if (this.option?.update) {
      buttons.push(this.renderButton(
        UTableIcons.edit,
        () => this.option?.update?.(item),
        "UPDATE",
        "#007FFF",
      ));
    }
    if (this.option?.delete) {
      buttons.push(this.renderButton(
        UTableIcons.trash,
        () => this.deleteDataAsync([item]),
        "DELETE",
        "#FF0000"
      ));
    }
    if (this.buttons.length > 0) {
      this.buttons.forEach(button => {
        if (button.type === 'table') return;
        buttons.push(this.renderButton(
          button.svgData,
          () => button.action(item, this),
          button.display,
          button.color,
          button.svgViewBox
        ));
      });
    }
    return buttons;
  }

  // 버튼 렌더링
  private renderButton(icon: string, handler: any, tooltip: string, color?: string, viewBox?: string) {
    return html`
      <svg class="button"
        viewBox=${viewBox ?? "0 -960 960 960"}
        fill=${color ?? "var(--primary-text)"}
        @click=${handler}
        @mouseenter=${(e:any) => this.tooltip.hoverButton(e, tooltip)}>
        <path d=${icon}></path>
      </svg>
    `;
  }

  // 페이지네이션 렌더링(작업중)
  private renderPageNation() {
    const total = this.total ?? this.data.length;
    const itemsPerPage = this.search.limit;
    const totalPages = Math.ceil(total / itemsPerPage);
    const currentPage = Math.ceil((this.search.offset + 1) / this.search.limit);

    return html`
      <div class="pagination">
        <div class="per-page">
          <span class="text">Rows per page</span>
          <div class="page-info">
            <input class="page-input" min="1" type="number"
              @change=${this.handleChangePerPage}
              .value=${itemsPerPage.toString()} />
            <div class="button"
              @click=${this.loadDataAsync}>
              &#x276F;</div>
          </div>
        </div>
        <div class="navigate-page">
          <svg class="first-page" viewBox="0 -960 960 960"
            @click=${() => this.handlePageLoadClick('first')}>
            <path d=${UTableIcons.firstPage}></path>
          </svg>
          <svg class="before-page" viewBox="0 -960 960 960"
            @click=${() => this.handlePageLoadClick('before')}>
            <path d=${UTableIcons.beforePage}></path>
          </svg>
          <div class="page-info">
            <input class="page-input" min="1" type="number"
              @change=${this.handleChangePage}
              .value=${currentPage.toString()} />
            <span class="button">&#x276F;</span>
          </div>
          <span class="text">of ${this.total ? totalPages : '??'}</span>
          <svg class="next-page" viewBox="0 -960 960 960"
            @click=${() => this.handlePageLoadClick('next')}>
            <path d=${UTableIcons.nextPage}></path>
          </svg>
          <svg class="last-page" viewBox="0 -960 960 960"
            @click=${() => this.handlePageLoadClick('last')}>
            <path d=${UTableIcons.lastPage}></path>
          </svg>
        </div>
      </div>
    `;
  }

  // 페이지당 아이템 수 변경 처리
  private async handleChangePerPage(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = Number(input.value);
    if (value < 1) value = 1;

    this.search.limit = value;
  }

  // 페이지 변경 처리
  private async handleChangePage(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (value < 1) {
      this.search.offset = 0;
    } else {
      this.search.offset = (value - 1) * this.search.limit - 1;
    }
  }

  // 페이지 변경 이벤트 처리
  private async handlePageLoadClick(step: 'first' | 'last' | 'before' | 'next') {
    setTimeout(() => {
      const total = this.total ?? this.data.length;
      const itemsPerPage = this.search.limit;
      const totalPages = Math.ceil(total / itemsPerPage);

      if (step === 'first') {
        this.search.offset = 0;
      } else if (step === 'last') {
        this.search.offset = ((totalPages - 1) * this.search.limit);
      } else if (step === 'before') {
        this.search.offset -= this.search.limit;
      } else if (step === 'next') {
        this.search.offset += this.search.limit;
      }

      this.loadDataAsync();
    }, 100);
  }

  // 정렬 이벤트 처리
  private async handleSortEvent(event: CustomEvent) {
    const { name, orderby } = event.detail;
    const target = this.search.columns.find(s => s.name === name);
    if (!target) return;

    target.orderby = orderby;
    this.loadDataAsync();
  }

  // 필터 이벤트 처리
  private async handleFilterEvent(event: CustomEvent) {
    const search = event.detail;
    const targetIndex = this.search.columns.findIndex(s => s.name === search.name);
    if (targetIndex === -1) return;

    this.search.columns[targetIndex] = search;
    this.loadDataAsync();
  }

  // 검색 이벤트 처리
  private async handleSearchEvent(event: CustomEvent) {
    const search = event.detail;
    this.search.columns = search.columns;
    this.loadDataAsync();
  }

  // 헤더 체크박스 상태 변경 처리
  private async handleHeaderCheckbox(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedItems = this.data;
    } else {
      this.selectedItems = [];
    }
  }

  // 바디 체크박스 상태 변경 처리
  private async handleBodyCheckbox(event: Event, item: any) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked && !this.selectedItems.includes(item)) {
      this.selectedItems = [...this.selectedItems, item];
    } else {
      this.selectedItems = this.selectedItems.filter(selectedItem => selectedItem !== item);
    }

    // 헤더 체크박스 상태 계산
    if (this.selectedItems.length === this.data.length) {
      this.headerCheckbox.indeterminate = false;
      this.headerCheckbox.checked = true;
    } else if (this.selectedItems.length === 0) {
      this.headerCheckbox.indeterminate = false;
      this.headerCheckbox.checked = false;
    } else {
      this.headerCheckbox.indeterminate = true;
      this.headerCheckbox.checked = false;
    }
  }

  // Row 클릭 이벤트 처리
  private async handleRowClick(event: Event, item: any) {
    
    const target = event.target as HTMLElement;
    if (target.tagName != 'DIV') {
      // 버튼이나 아이콘이 클릭된 경우 다른 이벤트 처리를 위해 중단
      return; 
    }
    
    // DIV 태그가 클릭된 경우만 선택 이벤트 발생
    this.dispatchEvent(new CustomEvent('select', {
      detail: { 
        selectedItem: item, 
        selectedItems: this.selectedItems 
      },
      bubbles: true,
      composed: true,
    }));
  }

  // 컬럼 조절기 선택(컬럼 너비 조절)
  private async handleAdjustWidth(event: MouseEvent, index: number) {
    if (index < 0) return;

    const headers = this.table.querySelectorAll('.header-content');
    if (headers.length === 0) return;
    const leftColumn = headers[index] as HTMLElement;
    const rightColumn = headers[index + 1] as HTMLElement;
    if (!leftColumn || !rightColumn) return;
    const leftInitWidth = leftColumn.offsetWidth;
    const rightInitWidth = rightColumn.offsetWidth;
    const leftminWidth = leftInitWidth - 25;
    const rightminWidth = rightInitWidth - 25;

    const controller = event.currentTarget as HTMLElement;
    controller.classList.add('active');

    // 마우스 이동
    let moveX = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (moveX === 0) {
        moveX += e.movementX;
        adjustWidth();
      } else if (moveX < 0 && -moveX > leftminWidth) {
        moveX += e.movementX;
        return;
      } else if (moveX > 0 && moveX > rightminWidth) {
        moveX += e.movementX;
        return;
      } else {
        moveX += e.movementX;
        adjustWidth();
      }
    };

    // 이벤트 종료
    const handleMouseUp = () => {
      // 마우스 이벤트 리스너 제거
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 컬럼 너비 조절
      adjustWidth();

      // 컨트롤러 초기화
      controller.classList.remove('active');
    };

    const adjustWidth = () => {
      // 컬럼 너비 조절
      const totalWidth = this.table.offsetWidth;
      const adjustLeftWidth = leftInitWidth + moveX;
      const adjustRightWidth = rightInitWidth - moveX;
      const leftWidth = adjustLeftWidth / totalWidth * 100;
      const rightWidth = adjustRightWidth / totalWidth * 100;
      leftColumn.style.width = `${leftWidth}%`;
      rightColumn.style.width = `${rightWidth}%`;
    }

    // 마우스 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // 컬럼 조절기 높이 조절
  private async adjustWidthControlHeight() {
    const controls = this.table.querySelectorAll('.width-control');
    controls.forEach((control) => {
      const target = control as HTMLElement;
      target.style.height = `${this.table.offsetHeight}px`;
    });
  }

  // 로우 조절기 선택(로우 높이 조절)
  private async handleAdjustHeight(event: MouseEvent, index: number) {
    if (index < 0) return;

    const bodys = this.table.querySelectorAll('.body-row');
    if (bodys.length === 0) return;
    const row = bodys[index] as HTMLElement;
    if (!row) return;
    const rowHeight = row.offsetHeight;

    const controller = event.currentTarget as HTMLElement;
    controller.classList.add('active');

    // 마우스 이동
    let moveY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (rowHeight + moveY < 20) {
        moveY += e.movementY;
        return;
      } else {
        moveY += e.movementY;
        row.style.height = `${rowHeight + moveY}px`;
      }
    };

    // 이벤트 종료
    const handleMouseUp = () => {
      // 마우스 이벤트 리스너 제거
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      row.style.height = `${rowHeight + moveY}px`;

      // 컨트롤러 초기화
      controller.classList.remove('active');
      this.adjustWidthControlHeight();
    };

    // 마우스 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
}

// export const UTable = convertReact({
//   elementClass: UTableElement,
//   tagName: 'u-table',
// });
