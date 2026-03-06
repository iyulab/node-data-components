import { useMemo } from 'react';
import '../../utilities/devExtremeCssInjection.js';
import 'devextreme/data/odata/store';
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  HeaderFilter,
  Selection,
  Export,
  Grouping,
  GroupPanel,
  SearchPanel,
  ColumnChooser,
  Toolbar,
  Item,
  LoadPanel
} from 'devextreme-react/data-grid';
import { UDataGridColumn, UDataGridProps } from './UDataGrid.types.js';

export function UDataGrid({
  dataSourceUrl,
  keyField,
  selectFields,
  columns,
  pageSize = 25,
  showBorders = true,
  allowColumnReordering = true,
  allowColumnResizing = true,
  showGroupPanel = true,
  showSearchPanel = true,
  showFilterRow = true,
  showHeaderFilter = true,
  allowExport = true,
  exportFileName,
  isDevelopment = false,
  onDataLoaded,
  onDataLoadError,
  onExporting,
  onRowClick,
  beforeSend
}: UDataGridProps) {

  // 기본 beforeSend 함수
  const defaultBeforeSend = (operation: string, ajaxOptions: any) => {
    try {
      if (!ajaxOptions) {
        console.warn('ajaxOptions가 undefined입니다'); // eslint-disable-line no-console
        return;
      }

      // headers 객체 초기화
      if (!ajaxOptions.headers || typeof ajaxOptions.headers !== 'object') {
        ajaxOptions.headers = {};
      }

      ajaxOptions.headers['Accept'] = 'application/json';
      ajaxOptions.headers['Content-Type'] = 'application/json';

      if (isDevelopment) {
        ajaxOptions.crossDomain = true;
        ajaxOptions.headers['Access-Control-Allow-Origin'] = '*';
      }

			// eslint-disable-next-line no-console
      console.log(`U-DataGrid ${operation} 요청:`, {
        url: ajaxOptions.url,
        headers: ajaxOptions.headers,
        method: ajaxOptions.type || 'GET'
      });
    } catch (error) {
      console.error('beforeSend 처리 중 오류:', error); // eslint-disable-line no-console
    }
  };

  // 기본 오류 처리
  const defaultOnLoadError = (error: any) => {
    console.error('U-DataGrid 데이터 로딩 오류:', error); // eslint-disable-line no-console

    let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';

    try {
      if (error && typeof error === 'object') {
        if (error.status === 404) {
          errorMessage = 'API 엔드포인트를 찾을 수 없습니다. 서버가 실행중인지 확인해주세요.';
        } else if (error.status === 0) {
          errorMessage = 'CORS 오류 또는 네트워크 연결 문제입니다. 서버 설정을 확인해주세요.';
        } else if (error.status >= 500) {
          errorMessage = '서버 내부 오류입니다. 서버 로그를 확인해주세요.';
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      }
    } catch (parseError) {
      console.error('오류 메시지 파싱 중 문제:', parseError); // eslint-disable-line no-console
    }

    alert(`${errorMessage}\n\n요청 URL: ${dataSourceUrl}`);
  };

  // OData 데이터 소스 설정
  const dataSource = useMemo(() => {
    return {
      store: {
        type: 'odata' as const,
        version: 4,
        url: dataSourceUrl,
        key: keyField,
        beforeSend: beforeSend || defaultBeforeSend,
        onLoading: () => {
          console.log('U-DataGrid 데이터 로딩 시작...'); // eslint-disable-line no-console
        },
        onLoaded: (data: any) => {
          console.log('U-DataGrid 데이터 로딩 완료:', data); // eslint-disable-line no-console
          onDataLoaded?.(data);
        },
        onLoadError: onDataLoadError || defaultOnLoadError
      },
      select: selectFields
    };
  }, [dataSourceUrl, keyField, selectFields, beforeSend, onDataLoaded, onDataLoadError]);

  // Export 핸들러
  const handleExporting = (e: any) => {
    if (exportFileName) {
      e.fileName = exportFileName;
    } else {
      e.fileName = `DataGrid_Export_${new Date().toISOString().slice(0, 10)}`;
    }
    onExporting?.(e);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      contain: 'layout style',
      isolation: 'isolate',
      overflow: 'hidden'
    }}>
      <DataGrid
        dataSource={dataSource as any}
        showBorders={showBorders}
        allowColumnReordering={allowColumnReordering}
        allowColumnResizing={allowColumnResizing}
        columnAutoWidth={false}
        showColumnLines={true}
        showRowLines={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
        height="100%"
        width="100%"
        wordWrapEnabled={true}
        columnResizingMode="widget"
        remoteOperations={true}
        onExporting={handleExporting}
        onRowClick={onRowClick}
      >
        <LoadPanel enabled={true} />

        <Selection mode="multiple" />
        {showFilterRow && <FilterRow visible={true} />}
        {showHeaderFilter && <HeaderFilter visible={true} />}
        {showSearchPanel && <SearchPanel visible={true} placeholder="검색..." />}
        <Grouping autoExpandAll={false} />
        {showGroupPanel && <GroupPanel visible={true} />}
        <ColumnChooser enabled={true} />
        <Paging defaultPageSize={pageSize} />
        {allowExport && <Export enabled={true} />}

        <Toolbar>
          {showGroupPanel && <Item name="groupPanel" />}
          {allowExport && <Item name="exportButton" />}
          <Item name="columnChooserButton" />
          {showSearchPanel && <Item name="searchPanel" />}
        </Toolbar>

        {columns.map((col: UDataGridColumn, index: number) => (
          <Column
            key={col.dataField || `column-${index}`}
            dataField={col.dataField}
            caption={col.caption}
            width={col.width}
            minWidth={col.minWidth}
            dataType={col.dataType}
            format={col.format}
            alignment={col.alignment}
            fixed={col.fixed}
            fixedPosition={col.fixedPosition}
            allowHiding={col.allowHiding}
            allowSorting={col.allowSorting}
            allowFiltering={col.allowFiltering}
            allowGrouping={col.allowGrouping}
            sortOrder={col.sortOrder}
            cellRender={col.cellRender}
            visible={col.visible}
          />
        ))}
      </DataGrid>
    </div>
  );
}