export interface UTableModel {
  loading: boolean;
  total?: number;
  search: SearchOption
  selectedItems: any[];
  data: any[];
  option?: TableOption;
  columns: ColumnDefinition[],
  buttons: ButtonDefinition[];
  loadDataAsync: () => Promise<void>;
}

export interface TableOption {
  useCount?: boolean;
  useCheckbox?: boolean;
  usePaging?: boolean;
  limit?: number;
  firstLoad?: (search?:SearchOption) => Promise<{ data: any[], total?:number }>;
  load?: (search?:SearchOption) => Promise<{ data: any[], total?:number }>;
  delete?: (items: any[]) => Promise<boolean>;
  update?: (item: any) => Promise<void>;
  create?: () => Promise<void>;
}

export type ColumnDefinition = BasicColumn | BadgeColumn | ImgColumn;

export interface ColumnBase {
  name: string;
  title: string;
  order: number;
  widthRatio?: number;
  headAlign?: 'left' | 'center' | 'right';
  bodyAlign?: 'left' | 'center' | 'right';
  useSort?: boolean;
  useFilter?: 'text' | 'numberRange'| 'dateRange' | 'select';
  selectList?: string[];
  tooltip?: (item: any) => string | HTMLElement;
  action?: (item: any) => Promise<void>;
}

export interface BasicColumn extends ColumnBase {
  type: 'basic';
  render?: (item: any) => string | HTMLElement;
}

export interface BadgeColumn extends ColumnBase {
  type: 'badge';
  render: (item: any) => { text: string; color: string; };
}

export interface ImgColumn extends ColumnBase {
  type: 'img';
  render: (item: any) => { src: string; width?: number; height?: number; };
}

export type ButtonDefinition = TableButton | ItemButton;

export interface ButtonBase {
  display: string;
  svgData: string;
  svgViewBox: string;
  color?: string;
}

export interface TableButton extends ButtonBase {
  type: 'table';
  action: (items: any[], table: UTableModel) => Promise<void>;
}

export interface ItemButton extends ButtonBase {
  type: 'item';
  action: (item: any, table: UTableModel) => Promise<void>;
}

export type SearchColumn = SearchNotFilter | SearchTextFilter | SearchNumberRangeFilter | SearchDateRangeFilter | SearchSelectFilter;

export interface SearchBase {
  name: string;
  orderby?: 'asc' | 'desc';
}

export interface SearchNotFilter extends SearchBase {
  type: undefined;
}

export interface SearchTextFilter extends SearchBase {
  type: 'text';
  value?: string;
}

export interface SearchNumberRangeFilter extends SearchBase {
  type: 'numberRange';
  numberFrom?: number;
  numberTo?: number;
}

export interface SearchDateRangeFilter extends SearchBase {
  type: 'dateRange';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchSelectFilter extends SearchBase {
  type: 'select';
  list: string[];
}

export interface SearchOption {
  limit: number; // 페이지당 아이템 수
  offset: number; // 페이지 오프셋
  columns: SearchColumn[];
}

export const UTableIcons = {
  search: "M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z",
  trash: "M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z",
  refresh: "M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z",
  plus: "M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z",
  edit: "M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z",
  sort: "M22.243,10.021H1.757l8.4-9.183a2.572,2.572,0,0,1,3.69.007Z M12,24.011a2.488,2.488,0,0,1-1.849-.826L1.757,14.011H22.243l-8.4,9.181A2.476,2.476,0,0,1,12,24.011Z",
  desc: "M11.973,18c-.704,0-1.378-.301-1.848-.824L1.729,8H22.216l-8.401,9.183c-.464,.517-1.138,.817-1.842,.817Z",
  filter: "M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z",
  firstPage: "M240-240v-480h80v480h-80Zm440 0L440-480l240-240 56 56-184 184 184 184-56 56Z",
  lastPage: "m280-240-56-56 184-184-184-184 56-56 240 240-240 240Zm360 0v-480h80v480h-80Z",
  beforePage: "M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z",
  nextPage: "M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z",
  notFound: "M270-80q-78 0-134-56T80-270q0-78 56-134t134-56q78 0 134 56t56 134q0 78-56 134T270-80Zm566-40L573-383q-14 11-31.5 21.5T508-344q-5-14-11-28.5T483-399q54-21 91.5-69.5T612-584q0-81-57-138.5T417-780q-82 0-139.5 57.5T220-584q0 17 3.5 35.5T232-517q-13 2-29 6.5T174-500q-7-18-10.5-40t-3.5-44q0-107 75-181.5T417-840q106 0 180.5 75T672-584q0 43-15 85t-41 73l264 262-44 44Zm-635-56 69-69 68 68 23-23-69-69 71-71-23-23-70 70-70-70-23 23 70 70-70 70 24 24Z"
};