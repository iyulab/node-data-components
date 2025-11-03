// 컬럼 정의 인터페이스
export interface UDataGridColumn {
    dataField?: string;
    caption: string;
    width?: number;
    minWidth?: number;
    dataType?: 'string' | 'number' | 'date' | 'datetime' | 'boolean';
    format?: string;
    alignment?: 'left' | 'center' | 'right';
    fixed?: boolean;
    fixedPosition?: 'left' | 'right';
    allowHiding?: boolean;
    allowSorting?: boolean;
    allowFiltering?: boolean;
    allowGrouping?: boolean;
    sortOrder?: 'asc' | 'desc';
    cellRender?: (cellData: any) => React.ReactNode;
    visible?: boolean;
}

// DataGrid 옵션 인터페이스
export interface UDataGridProps {
    // 데이터 소스 옵션
    dataSourceUrl: string;
    keyField: string;
    selectFields?: string[];

    // 컬럼 정의
    columns: UDataGridColumn[];

    // UI 옵션
    pageSize?: number;
    showBorders?: boolean;
    allowColumnReordering?: boolean;
    allowColumnResizing?: boolean;
    showGroupPanel?: boolean;
    showSearchPanel?: boolean;
    showFilterRow?: boolean;
    showHeaderFilter?: boolean;
    allowExport?: boolean;
    exportFileName?: string;

    // 환경 설정
    isDevelopment?: boolean;

    // 이벤트 핸들러
    onDataLoaded?: (data: any) => void;
    onDataLoadError?: (error: any) => void;
    onExporting?: (e: any) => void;

    // CORS 및 헤더 설정
    beforeSend?: (operation: string, ajaxOptions: any) => void;
}