# UDataGrid

> **DevExtreme 라이선스 없이 서버 사이드 그리드가 필요하다면** → [flex-table 마이그레이션 가이드](./migrating-from-datagrid.md)를 참고하세요.

DevExtreme 기반의 서버 사이드 데이터 그리드 (React 컴포넌트).
OData v4 프로토콜을 통해 서버 사이드 페이징/필터링/정렬/그룹을 지원합니다.

## 요구사항

- React 환경
- OData v4 API 엔드포인트

## 설치

```bash
npm install @iyulab/data-components
```

> DevExtreme 라이선스가 필요합니다.

## 기본 사용

```tsx
import { UDataGrid } from '@iyulab/data-components';

function ProductList() {
  return (
    <div style={{ height: '600px' }}>
      <UDataGrid
        dataSourceUrl="https://api.example.com/odata/products"
        keyField="id"
        columns={[
          { dataField: 'name',     caption: '상품명' },
          { dataField: 'category', caption: '카테고리' },
          { dataField: 'price',    caption: '가격',  dataType: 'number' },
          { dataField: 'stock',    caption: '재고',  dataType: 'number' },
          { dataField: 'createdAt',caption: '등록일', dataType: 'date' },
        ]}
        onRowClick={(e) => console.log(e.data)}
      />
    </div>
  );
}
```

## Props

### 데이터 소스

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `dataSourceUrl` | `string` | ✓ | OData v4 엔드포인트 URL |
| `keyField` | `string` | ✓ | 행 고유 키 필드명 |
| `selectFields` | `string[]` | | 조회할 필드 목록 ($select) |

### 컬럼

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `columns` | `UDataGridColumn[]` | ✓ | 컬럼 정의 배열 |

### UI 옵션

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `pageSize` | `number` | `25` | 페이지당 행 수 |
| `showBorders` | `boolean` | `true` | 테두리 표시 |
| `allowColumnReordering` | `boolean` | `true` | 열 순서 변경 허용 |
| `allowColumnResizing` | `boolean` | `true` | 열 너비 조절 허용 |
| `showGroupPanel` | `boolean` | `true` | 그룹 패널 표시 |
| `showSearchPanel` | `boolean` | `true` | 검색 패널 표시 |
| `showFilterRow` | `boolean` | `true` | 필터 행 표시 |
| `showHeaderFilter` | `boolean` | `true` | 헤더 필터 표시 |
| `allowExport` | `boolean` | `true` | 엑셀 내보내기 허용 |
| `exportFileName` | `string` | | 내보내기 파일명 (미설정 시 자동 생성) |

### 환경

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `isDevelopment` | `boolean` | `false` | `true` 시 CORS 헤더 추가 |

### 이벤트

| Prop | 타입 | 설명 |
|------|------|------|
| `onDataLoaded` | `(data: any[]) => void` | 데이터 로드 완료 시 |
| `onDataLoadError` | `(error: any) => void` | 데이터 로드 오류 시 |
| `onRowClick` | `(e: { data: Record<string, unknown> }) => void` | 행 클릭 시 |
| `onExporting` | `(e: any) => void` | 엑셀 내보내기 시작 시 |
| `beforeSend` | `(operation: string, ajaxOptions: any) => void` | 요청 전 커스텀 헤더/옵션 설정 |

## UDataGridColumn

```typescript
interface UDataGridColumn {
  dataField?:     string;                               // 데이터 키
  caption:        string;                               // 헤더 텍스트 (필수)
  width?:         number;                               // 열 너비 (px)
  minWidth?:      number;                               // 최소 너비 (px)
  dataType?:      'string' | 'number' | 'date' | 'datetime' | 'boolean';
  format?:        string;                               // 표시 형식
  alignment?:     'left' | 'center' | 'right';
  fixed?:         boolean;                              // 열 고정
  fixedPosition?: 'left' | 'right';
  allowHiding?:   boolean;                              // 숨기기 허용
  allowSorting?:  boolean;
  allowFiltering?: boolean;
  allowGrouping?: boolean;
  sortOrder?:     'asc' | 'desc';                       // 초기 정렬
  cellRender?:    (cellData: any) => React.ReactNode;   // 커스텀 셀 렌더
  visible?:       boolean;
}
```

## 예시

### 커스텀 셀 렌더링

```tsx
columns={[
  { dataField: 'name', caption: '이름' },
  {
    dataField: 'status',
    caption: '상태',
    cellRender: (cell) => (
      <span className={`badge badge--${cell.value}`}>
        {cell.value}
      </span>
    ),
  },
  {
    dataField: 'price',
    caption: '가격',
    dataType: 'number',
    format: '#,##0원',
    alignment: 'right',
  },
]}
```

### 열 고정

```tsx
columns={[
  { dataField: 'id',   caption: 'ID',   width: 80,  fixed: true, fixedPosition: 'left' },
  { dataField: 'name', caption: '이름', width: 200, fixed: true, fixedPosition: 'left' },
  { dataField: 'description', caption: '설명' },
]}
```

### 커스텀 요청 헤더 (인증 등)

```tsx
<UDataGrid
  dataSourceUrl="/api/odata/users"
  keyField="id"
  columns={columns}
  beforeSend={(operation, ajaxOptions) => {
    ajaxOptions.headers['Authorization'] = `Bearer ${getToken()}`;
  }}
/>
```

### 특정 필드만 조회 ($select)

```tsx
<UDataGrid
  dataSourceUrl="/api/odata/products"
  keyField="id"
  selectFields={['id', 'name', 'price', 'stock']}
  columns={columns}
/>
```

## Shadow DOM과 함께 사용

`UDataGrid`는 React 컴포넌트이므로 Shadow DOM 내부에서 사용할 때 DevExtreme CSS 주입이 필요합니다.
`@iyulab/data-components`를 import하면 자동으로 처리됩니다.

```typescript
// UDataGrid를 사용하는 파일에서 이미 자동 처리됨
import { UDataGrid } from '@iyulab/data-components';
```

DevExtreme CSS가 Shadow DOM 밖에서 로드되는 앱에서는 `init` 진입점을 사용합니다:

```typescript
// 앱 진입점 최상단에
import '@iyulab/data-components/init';
```
