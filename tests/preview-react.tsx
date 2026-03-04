import React from 'react';
import { createRoot } from 'react-dom/client';
import { UDataGrid } from '../src/components/data-grid/UDataGrid';
import type { UDataGridColumn } from '../src/components/data-grid/UDataGrid.types';
import '../src/init';

import 'devextreme/dist/css/dx.light.css';

const PreviewReactApp: React.FC = () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';

  const columns: UDataGridColumn[] = [
    { dataField: 'ProductID', caption: '제품 ID', width: 100, dataType: 'number' },
    { dataField: 'ProductName', caption: '제품명', width: 250 },
    { dataField: 'CategoryID', caption: '카테고리 ID', width: 120, dataType: 'number' },
    { 
      dataField: 'UnitPrice', 
      caption: '단가', 
      width: 120, 
      dataType: 'number',
      format: 'currency'
    },
    { dataField: 'UnitsInStock', caption: '재고', width: 100, dataType: 'number' },
    { dataField: 'UnitsOnOrder', caption: '주문중', width: 100, dataType: 'number' },
    { dataField: 'Discontinued', caption: '단종', width: 100, dataType: 'boolean' }
  ];

  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#000000'
    }}>
      <div style={{
        marginBottom: '3rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>
          📊 Data Components - React Preview
        </h1>
      </div>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 500 }}>
          UDataGrid Component
        </h2>
        <p style={{ margin: '0 0 2rem 0', color: '#666', fontSize: '0.95rem' }}>
          DevExtreme DataGrid를 래핑한 React 컴포넌트입니다. OData 프로토콜을 사용하여 서버 데이터를 표시합니다.
        </p>

        <UDataGrid
          dataSourceUrl="https://js.devexpress.com/Demos/DevAV/odata/Products"
          keyField="ProductID"
          columns={columns}
          pageSize={20}
          showBorders={true}
          allowColumnReordering={true}
          allowColumnResizing={true}
          showGroupPanel={true}
          showSearchPanel={true}
          showFilterRow={true}
          showHeaderFilter={true}
          allowExport={true}
          exportFileName="products"
          onDataLoaded={(data) => {
            console.log('데이터 로드 완료:', data);
          }}
          onDataLoadError={(error) => {
            console.error('데이터 로드 오류:', error);
          }}
          onRowClick={(e) => {
            console.log('행 클릭:', e.data);
          }}
        />
      </section>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 500 }}>
          Features
        </h2>
        <ul style={{ margin: '0', padding: '0 0 0 1.5rem', color: '#666' }}>
          <li>OData 프로토콜 지원</li>
          <li>서버 사이드 필터링, 정렬, 페이징</li>
          <li>컬럼 재정렬 및 크기 조정</li>
          <li>그룹핑 및 검색 기능</li>
          <li>Excel 내보내기</li>
          <li>헤더 필터</li>
        </ul>
      </section>
    </div>
  );
};

// React 18 방식으로 마운트
const container = document.getElementById('react-root');
if (container) {
  const root = createRoot(container);
  root.render(<PreviewReactApp />);
}

export { PreviewReactApp };
