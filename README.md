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
- [URichTable](./docs/URichTable.md)
- [UDataGrid 마이그레이션 가이드](./docs/migrating-from-datagrid.md)

## Theming

`@iyulab/components`의 디자인 토큰을 읽습니다. **토큰 시트가 문서에 있어야 테마가 동작합니다.**

```typescript
import { Theme } from '@iyulab/components';

Theme.init({ default: 'system' });
Theme.set('dark'); // 'light' | 'dark' | 'system'
```

`Theme.init()`을 쓰지 않는다면 정적 진입점을 대신 임포트하세요:

```typescript
import '@iyulab/components/styles/tokens.css';
```

### 토큰 시트가 없으면

컴포넌트는 렌더되지만 **라이트 기준 고정값**으로 그려지며, 다크 테마와 테마 변수
오버라이드가 적용되지 않습니다. 이는 의도된 폴백 규약입니다.

### 브랜드 색 바꾸기

색은 역할 토큰을 통해 읽으므로, 주색 한 줄로 버튼·선택 강조·포커스가 함께 따라옵니다:

```css
:root { --u-primary-color: #7B1FA2; }
```

### 알려진 제약

- **`--u-txt-color-weak`가 라이트에서 WCAG AA에 미달합니다** — 흰 배경 대비 **2.68**
  (AA 기준 4.5). 다크는 5.43으로 정상이라 라이트 한쪽만의 문제입니다. 그래서 이 패키지의
  보조 텍스트 일부는 AA를 통과하는 고정값을 유지하며, 그만큼 테마 오버라이드를 따르지
  않습니다. 업스트림에서 해소되면 함께 정리됩니다.
- **일부 다크 규칙은 Chromium 전용입니다** — 유채색 표면과 표면 높이는 역할 층에
  대응 토큰이 없어 `:host-context()`로 보정하며, 이 선택자는 Firefox/Safari에서
  동작하지 않습니다. 그 외의 색은 전 브라우저에서 테마를 따릅니다.

## License

MIT
