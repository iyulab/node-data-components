# @iyulab/data-components

데이터 표시 및 관리를 위한 웹 컴포넌트 라이브러리

## Installation

```bash
npm install @iyulab/data-components
```

## Components

### UDataView (Lit)

3가지 레이아웃(grid, list, table)으로 데이터를 표시하는 경량 컴포넌트입니다.

```html
<u-data-view
  .items=${myData}
  mode="grid"
  gridMinWidth="200px"
  gap="1rem"
  @select=${handleSelect}
></u-data-view>
```

**주요 속성:**
- `items` - 표시할 데이터 배열
- `mode` - 레이아웃 모드: `'grid'` | `'list'` | `'table'`
- `columns` - 컬럼 정의 (선택사항, 자동 감지)
- `gridMinWidth` - 그리드 아이템 최소 너비 (기본: `'200px'`)
- `gap` - 아이템 간격 (기본: `'1rem'`)
- `renderCard` - 커스텀 카드 렌더 함수
- `renderCell` - 커스텀 테이블 셀 렌더 함수

**이벤트:**
- `select` - 아이템 선택 시 발생 `{ item, index }`
- `mode-change` - 뷰 모드 변경 시 발생 `{ mode }`

**컬럼 정의 예시:**

```typescript
const columns = [
  { key: 'id', label: 'ID', width: '100px' },
  { key: 'name', label: '이름' },
  { key: 'status', label: '상태' }
];
```

**커스텀 렌더링:**

```typescript
// 카드 커스터마이징
<u-data-view
  .items=${items}
  .renderCard=${(item, index) => html`
    <div class="custom-card">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </div>
  `}
></u-data-view>

// 테이블 셀 커스터마이징
<u-data-view
  mode="table"
  .items=${items}
  .renderCell=${(item, column, index) => {
    if (column.key === 'status') {
      return html`<span class="badge">${item.status}</span>`;
    }
    return item[column.key];
  }}
></u-data-view>
```

### UDataGrid (React)

DevExtreme 기반의 강력한 데이터 그리드 컴포넌트입니다. OData 프로토콜을 통해 서버 측 페이징, 필터링, 정렬을 지원합니다.

```tsx
import { UDataGrid } from '@iyulab/data-components';

<UDataGrid
  dataSourceUrl="https://api.example.com/odata/products"
  keyField="id"
  columns={[
    { dataField: 'name', caption: '상품명' },
    { dataField: 'price', caption: '가격', dataType: 'number' },
    { dataField: 'stock', caption: '재고', dataType: 'number' }
  ]}
  pageSize={25}
  onRowClick={(e) => console.log(e.data)}
/>
```

**주요 속성:**
- `dataSourceUrl` - OData 엔드포인트 URL
- `keyField` - 행의 고유 키 필드명
- `columns` - 컬럼 정의 배열
- `pageSize` - 페이지당 행 수 (기본: 25)
- `showBorders` - 테두리 표시 (기본: true)
- `allowColumnReordering` - 컬럼 재정렬 허용 (기본: true)
- `allowColumnResizing` - 컬럼 크기 조정 허용 (기본: true)
- `showGroupPanel` - 그룹 패널 표시 (기본: true)
- `showSearchPanel` - 검색 패널 표시 (기본: true)
- `showFilterRow` - 필터 행 표시 (기본: true)
- `showHeaderFilter` - 헤더 필터 표시 (기본: true)
- `allowExport` - 엑셀 내보내기 허용 (기본: true)

**이벤트:**
- `onDataLoaded` - 데이터 로드 완료 시
- `onDataLoadError` - 데이터 로드 오류 시
- `onRowClick` - 행 클릭 시
- `onExporting` - 내보내기 시작 시

## Theming

이 패키지는 `@iyulab/components`의 테마 시스템을 사용합니다. UDataView는 자동으로 다크 모드를 지원합니다.

```typescript
import { Theme } from '@iyulab/components';

// 테마 초기화
Theme.init({
  default: 'system',
  useBuiltIn: true
});

// 테마 변경
Theme.set('dark');  // 'light' | 'dark' | 'system'
```

## CSS Custom Properties

UDataView는 다음 CSS 변수를 사용합니다:

- `--u-bg-color` - 배경색
- `--u-txt-color` - 텍스트 색상
- `--u-border-color` - 테두리 색상
- `--u-blue-600` - 강조 색상
- `--u-neutral-*` - 중립 색상 팔레트
- `--u-shadow-color-weak` - 그림자 색상

## License

MIT
