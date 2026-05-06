# @iyulab/data-components

데이터 표시 및 입력을 위한 웹 컴포넌트 라이브러리.

**[Live Demo](https://iyulab.github.io/node-data-components/)**

- **USimpleSheet** — 엑셀 호환 스프레드시트 입력 컴포넌트 (Lit, compute 자동 계산 지원)
- **UDataView** — Grid / List / Table 뷰 전환 컴포넌트 (Lit)
- **URichTable** — 정렬/필터/편집/페이지네이션 지원 테이블 (Lit)

> **UDataGrid (DevExtreme)는 v0.4.0에서 제거되었습니다.**
> OData 서버 사이드 그리드가 필요하면 `@iyulab/flex-table`을 사용하세요.
> → [마이그레이션 가이드](./docs/migrating-from-datagrid.md)

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

자동 계산 열 (compute):

```html
<u-simple-sheet
  .columns=${[
    { key: 'item',  label: '품목', width: 150 },
    { key: 'qty',   label: '수량', width: 80 },
    { key: 'price', label: '단가', width: 100 },
    { key: 'total', label: '합계', width: 100,
      compute: (r, data) => {
        const qty = Number(data[r][1]) || 0;
        const price = Number(data[r][2]) || 0;
        return String(qty * price);
      }
    },
  ]}
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

## Documentation

- [USimpleSheet](./docs/USimpleSheet.md)
- [UDataView](./docs/UDataView.md)
- [URichTable](./docs/URichTable.md)
- [UDataGrid 마이그레이션 가이드](./docs/migrating-from-datagrid.md)

## Theming

`@iyulab/components`의 테마 시스템을 사용합니다. 라이트/다크 모드 자동 지원.

```typescript
import { Theme } from '@iyulab/components';

Theme.init({ default: 'system' });
Theme.set('dark'); // 'light' | 'dark' | 'system'
```

## License

MIT
