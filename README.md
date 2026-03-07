# @iyulab/data-components

데이터 표시 및 입력을 위한 웹 컴포넌트 라이브러리.

**[Live Demo](https://iyulab.github.io/node-data-components/)**

- **USimpleSheet** — 엑셀 호환 스프레드시트 입력 컴포넌트 (Lit)
- **UDataView** — Grid / List / Table 뷰 전환 컴포넌트 (Lit)
- **UDataGrid** — OData 기반 서버 사이드 데이터 그리드 (React + DevExtreme)

## Installation

```bash
npm install @iyulab/data-components
```

## Quick Start

### USimpleSheet

```html
<u-simple-sheet
  style="height: 300px;"
  .rows=${20}
  .cols=${8}
  @change=${(e) => console.log(e.detail.data)}
></u-simple-sheet>
```

컬럼 정의 + 초기 데이터:

```html
<u-simple-sheet
  style="height: 400px;"
  .columns=${[
    { key: 'name',  label: '이름',   width: 150 },
    { key: 'email', label: '이메일', width: 220 },
  ]}
  .data=${[
    ['홍길동', 'hong@example.com'],
    ['김철수', 'kim@example.com'],
  ]}
  @change=${(e) => console.log(e.target.getDataAsObjects())}
></u-simple-sheet>
```

### UDataView

```html
<u-data-view
  .items=${myData}
  mode="grid"
  @select=${(e) => console.log(e.detail)}
></u-data-view>
```

### UDataGrid (React)

```tsx
import { UDataGrid } from '@iyulab/data-components';

<UDataGrid
  dataSourceUrl="https://api.example.com/odata/products"
  keyField="id"
  columns={[
    { dataField: 'name',  caption: '상품명' },
    { dataField: 'price', caption: '가격', dataType: 'number' },
  ]}
/>
```

## Documentation

- [USimpleSheet](./docs/USimpleSheet.md)
- [UDataView](./docs/UDataView.md)
- [UDataGrid](./docs/UDataGrid.md)

## Theming

`@iyulab/components`의 테마 시스템을 사용합니다. 라이트/다크 모드 자동 지원.

```typescript
import { Theme } from '@iyulab/components';

Theme.init({ default: 'system' });
Theme.set('dark'); // 'light' | 'dark' | 'system'
```

## License

MIT
