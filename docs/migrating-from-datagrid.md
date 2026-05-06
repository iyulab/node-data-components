# UDataGrid에서 flex-table로 마이그레이션

UDataGrid(DevExtreme 기반)를 `@iyulab/flex-table`로 전환하는 가이드입니다.

yesung-oms에서 9개 리스트 페이지를 성공적으로 전환한 실증 기록을 기반으로 작성되었습니다.

## 왜 전환하는가

| | UDataGrid (DevExtreme) | flex-table |
|---|---|---|
| 라이선스 | 상용 라이선스 필요 | MIT |
| 번들 크기 | CSS+JS 수백 KB | ~74 KB |
| 렌더러 | React JSX | Lit html 템플릿 |
| 서버 사이드 페이징 | OData DataSource | `useODataSource` 훅 + odata-query |

## 설치

```bash
npm install @iyulab/flex-table
```

OData 서버 사이드 페이징이 필요한 경우:

```bash
npm install @iyulab/flex-table odata-query
```

## 기본 패턴 비교

### UDataGrid (기존)

```tsx
import { UDataGrid } from '@iyulab/data-components';

<UDataGrid
  dataSourceUrl="/api/odata/products"
  keyField="id"
  columns={[
    { dataField: 'name',  caption: '상품명' },
    { dataField: 'price', caption: '가격', dataType: 'number', alignment: 'right' },
  ]}
  onRowClick={(e) => handleRowClick(e.data)}
/>
```

### flex-table (전환 후)

```tsx
import { FlexTableReact, useODataSource } from '@iyulab/flex-table/odata';
import { html } from 'lit';

function ProductList() {
  const source = useODataSource('/api/odata/products', { key: 'id' });

  return (
    <FlexTableReact
      source={source}
      columns={[
        { field: 'name',  label: '상품명' },
        { field: 'price', label: '가격',
          renderer: (value) => html`<span style="text-align:right">${value?.toLocaleString()}원</span>` },
      ]}
      onRowClick={(row) => handleRowClick(row)}
    />
  );
}
```

## 주요 차이점과 대응

### 1. 렌더러: React JSX → Lit html 템플릿

DevExtreme의 `cellRender`는 React 컴포넌트를 반환했지만, flex-table의 `renderer`는 **Lit `html` 태그 템플릿**을 반환합니다.

```tsx
// DevExtreme cellRender
cellRender: (cell) => <span className={`badge--${cell.value}`}>{cell.value}</span>

// flex-table renderer
import { html } from 'lit';
renderer: (value) => html`<span class="badge--${value}">${value}</span>`
```

### 2. 서버 사이드 페이징/정렬/검색

`useODataSource` 훅과 `FlexTableReact`를 조합합니다.

```tsx
import { FlexTableReact, useODataSource } from '@iyulab/flex-table/odata';

const source = useODataSource('/api/odata/items', {
  key: 'Id',
  // 추가 필터 (선택)
  filter: ['IsActive', '=', true],
});
```

### 3. 열 정렬 (alignment)

DevExtreme의 `alignment` prop은 flex-table에 없습니다. renderer에서 인라인 스타일로 처리합니다.

```tsx
// DevExtreme
{ dataField: 'amount', caption: '금액', alignment: 'right' }

// flex-table
{ field: 'amount', label: '금액',
  renderer: (v) => html`<span style="display:block;text-align:right">${v}</span>` }
```

### 4. 페이지네이션 UI

flex-table에는 내장 페이지네이션 UI가 없습니다. `useODataSource`가 반환하는 상태를 이용해 직접 구현합니다.

```tsx
const source = useODataSource('/api/odata/items', { key: 'Id' });

// source.page, source.totalCount, source.setPage 등을 활용
<FlexTableReact source={source} columns={columns} />
<Pagination
  page={source.page}
  total={source.totalCount}
  onChange={source.setPage}
/>
```

### 5. 검색 패널

내장 검색 패널이 없습니다. SearchBar + debounce를 직접 구현하고 `source`의 필터에 주입합니다.

```tsx
const [search, setSearch] = useState('');
const source = useODataSource('/api/odata/items', {
  key: 'Id',
  filter: search ? [['Name', 'contains', search], 'or', ['Description', 'contains', search]] : undefined,
});
```

### 6. `dataSourceUrl` 단일 prop → `useODataSource` 훅 조합

DevExtreme의 `dataSourceUrl` 단일 prop 패턴이 `useODataSource(url, options)` + `FlexTableReact` 2단계로 분리됩니다. 이는 소비자가 데이터 소스 상태에 직접 접근할 수 있어 유연성이 높습니다.

## 마이그레이션 체크리스트

- [ ] `@iyulab/flex-table` 설치 (OData 필요 시 `/odata` 서브패키지 포함)
- [ ] `UDataGrid` import → `FlexTableReact` + `useODataSource` import
- [ ] `dataSourceUrl` + `keyField` → `useODataSource(url, { key })` 훅
- [ ] `columns[].dataField` → `columns[].field`
- [ ] `columns[].caption` → `columns[].label`
- [ ] `columns[].cellRender` → `columns[].renderer` (JSX → Lit html)
- [ ] `columns[].alignment` → renderer 인라인 스타일
- [ ] 페이지네이션 UI 직접 구현
- [ ] 검색 패널 직접 구현 (필요 시)
- [ ] DevExtreme 라이선스 및 CSS 제거

## 참고

- [flex-table GitHub](https://github.com/iyulab/flex-table)
- DevExtreme CSS 제거 후 `@iyulab/data-components/init` import도 제거 가능
