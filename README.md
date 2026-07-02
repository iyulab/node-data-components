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

## React

`@lit/react` 기반 일급 래퍼를 `/react` 서브패스로 제공합니다. rich property(`data`, `columns` 등)를
JSX props로 직접 전달할 수 있고, 커스텀 이벤트는 `onXxx` props로 받습니다 — ref + `useEffect`
브리지가 필요 없습니다.

```bash
npm install @iyulab/data-components @lit/react react
```

```tsx
import { USimpleSheetReact, type SheetColumn } from '@iyulab/data-components/react';

const columns: SheetColumn[] = [
  { key: 'name',  label: '이름',   width: 150 },
  { key: 'email', label: '이메일', width: 220 },
];

export function MySheet() {
  return (
    <USimpleSheetReact
      style={{ height: 400 }}
      columns={columns}
      data={[['홍길동', 'hong@example.com']]}
      rows={25}
      onChange={(e) => console.log(e.detail.data)}
    />
  );
}
```

`URichTableReact`는 `RichTableEventMap`의 모든 이벤트(`onRowUpdate`, `onSortChange`,
`onSelectionChange` 등)를 타입드 props로 노출합니다. `UDataViewReact`도 동일하게 제공됩니다.

타입스크립트만 필요하다면 래퍼 없이도 엘리먼트 클래스와 `HTMLElementTagNameMap` 증강이
메인 엔트리에서 제공됩니다:

```typescript
import type { USimpleSheet } from '@iyulab/data-components';

const sheet = document.querySelector('u-simple-sheet'); // USimpleSheet | null 로 추론
```

## Documentation

- [USimpleSheet](./docs/USimpleSheet.md)
- [UDataView](./docs/UDataView.md)
- URichTable — 문서 작성 예정([types.ts](./src/components/u-rich-table/types.ts) 참고)
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
