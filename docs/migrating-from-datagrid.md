# UDataGrid에서 flex-table로 마이그레이션

`UDataGrid`(DevExtreme 기반)는 v0.4.0에서 제거되었습니다. 서버 페이징 목록은 `@iyulab/flex-table`의
`useODataSource` 훅과 `FlexTableReact`로 옮깁니다. 이 문서는 옮길 때의 대응만 다루고, 각 API의 정본은
[flex-table README](https://github.com/iyulab/flex-table#readme)입니다.

```bash
npm install @iyulab/flex-table
```

## 기본 패턴

### UDataGrid (제거됨)

```tsx
<UDataGrid
  dataSourceUrl="/api/odata/products"
  keyField="id"
  columns={[
    { dataField: 'name',  caption: '상품명' },
    { dataField: 'price', caption: '가격', dataType: 'number', alignment: 'right' },
  ]}
/>
```

### flex-table

```tsx
import { FlexTableReact, useODataSource } from '@iyulab/flex-table/react';
import type { ColumnDefinition } from '@iyulab/flex-table';

const columns: ColumnDefinition[] = [
  { key: 'name',  label: '상품명' },
  { key: 'price', label: '가격', type: 'number', align: 'end' },
];

export function ProductList() {
  const source = useODataSource('/api/odata/products', { pageSize: 20 });
  return (
    <FlexTableReact
      dataMode="server"
      columns={columns}
      data={source.data}
      loading={source.loading}
      onSortChange={source.onSortChange}
    />
  );
}
```

`dataMode="server"` 이면 표는 정렬·필터를 다시 계산하지 않고 이벤트만 냅니다 — 훅이 그 조건으로 다시 조회합니다.

## 대응표

| UDataGrid (DevExtreme) | flex-table |
|---|---|
| `dataSourceUrl` · `keyField` | `useODataSource(url, options)` + `<FlexTableReact dataMode="server">` |
| `columns[].dataField` | `columns[].key` |
| `columns[].caption` | `columns[].label` |
| `columns[].dataType` | `columns[].type` |
| `columns[].alignment` | `columns[].align` — `'start' \| 'center' \| 'end'`(`'right'` 가 아니다 · 머리글은 `headerAlign`) |
| `columns[].cellRender`(React JSX) | `columns[].render(value, row, col)` — Lit `html` 템플릿을 돌려준다 |
| 내장 페이지네이션 | 없음 — `source.page` · `source.setPage` · `source.totalCount` 로 그린다 |
| 내장 검색 패널 | 없음 — 입력을 `source.setSearch` 에 잇는다 |
| 고정 필터 | `useODataSource(url, { fixedFilter: { IsActive: true } })` |

```ts
import { html } from 'lit';
import type { ColumnDefinition } from '@iyulab/flex-table';

const status: ColumnDefinition = {
  key: 'status',
  label: '상태',
  render: (value) => html`<span class="badge--${String(value)}">${value}</span>`,
};
```

## 체크리스트

- [ ] `@iyulab/flex-table` 설치, `UDataGrid` import 제거
- [ ] `dataSourceUrl`/`keyField` → `useODataSource(url)` + `dataMode="server"`
- [ ] 열 정의: `dataField`→`key` · `caption`→`label` · `dataType`→`type` · `alignment`→`align`(`'end'`) · `cellRender`→`render`
- [ ] 페이지네이션·검색 UI를 훅 상태로 직접 그리기
- [ ] DevExtreme 라이선스·CSS 제거
