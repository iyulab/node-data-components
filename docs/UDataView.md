# UDataView

데이터 배열을 Grid / List / Table 세 가지 레이아웃으로 표시하는 컴포넌트.
우측 상단 툴바 버튼으로 뷰를 전환할 수 있습니다.

## 설치 및 등록

```typescript
import '@iyulab/data-components';
```

## 기본 사용

```html
<u-data-view
  .items=${myData}
  mode="grid"
  @select=${(e) => console.log(e.detail)}
></u-data-view>
```

## 속성 (Properties)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `items` | `any[]` | `[]` | 표시할 데이터 배열 |
| `mode` | `'grid' \| 'list' \| 'table'` | `'grid'` | 뷰 모드 |
| `columns` | `Column[]` | `undefined` | 컬럼 정의. 미설정 시 첫 번째 아이템의 키로 자동 감지 |
| `gridMinWidth` | `string` | `'200px'` | Grid 모드 아이템 최소 너비 |
| `gap` | `string` | `'1rem'` | 아이템 간격 |
| `renderCard` | `(item, index) => TemplateResult` | `undefined` | 카드 커스텀 렌더 함수 |
| `renderCell` | `(item, column, index) => TemplateResult \| string` | `undefined` | 테이블 셀 커스텀 렌더 함수 |

## Column 타입

```typescript
interface Column {
  key:     string;   // 데이터 객체의 키
  label?:  string;   // 헤더 표시 텍스트 (미설정 시 key를 camelCase → Title Case 변환)
  width?:  string;   // 열 너비 (CSS 값, 예: '120px', '20%')
}
```

## 이벤트 (Events)

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `select` | `{ item: any, index: number }` | 아이템 선택 시 |
| `mode-change` | `{ mode: ViewMode }` | 뷰 모드 변경 시 |

## 예시

### 컬럼 직접 지정

```html
<u-data-view
  mode="table"
  .items=${products}
  .columns=${[
    { key: 'name',     label: '상품명' },
    { key: 'category', label: '카테고리' },
    { key: 'price',    label: '가격',  width: '100px' },
    { key: 'stock',    label: '재고',  width: '80px'  },
  ]}
></u-data-view>
```

### 커스텀 카드 렌더링 (Grid / List)

```typescript
<u-data-view
  .items=${products}
  .renderCard=${(item, index) => html`
    <div class="product-card">
      <img src=${item.imageUrl} alt=${item.name} />
      <h3>${item.name}</h3>
      <p>${item.price.toLocaleString()}원</p>
    </div>
  `}
></u-data-view>
```

### 커스텀 셀 렌더링 (Table)

```typescript
<u-data-view
  mode="table"
  .items=${products}
  .renderCell=${(item, column, index) => {
    if (column.key === 'price') {
      return html`<strong>${item.price.toLocaleString()}원</strong>`;
    }
    if (column.key === 'status') {
      return html`<span class="badge badge--${item.status}">${item.status}</span>`;
    }
    return item[column.key];
  }}
></u-data-view>
```

### 이벤트 처리

```typescript
const view = document.querySelector('u-data-view');

view.addEventListener('select', (e) => {
  const { item, index } = e.detail;
  console.log('선택된 아이템:', item);
});

view.addEventListener('mode-change', (e) => {
  console.log('현재 모드:', e.detail.mode); // 'grid' | 'list' | 'table'
});
```

## 값 자동 포맷

렌더 함수를 지정하지 않으면 아래 규칙으로 자동 포맷됩니다:

| 타입 | 출력 |
|------|------|
| `null / undefined` | `—` |
| `boolean` | `✓` / `✗` |
| `Date` | `toLocaleString()` |
| `object` | `JSON.stringify()` |
| 그 외 | `String()` |
