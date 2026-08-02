# URichTable

정렬·필터·인라인 편집·페이지네이션·엑셀식 클립보드를 지원하는 표 컴포넌트.

## 설치 및 등록

```typescript
import '@iyulab/data-components';
```

## 가장 먼저 알아야 할 두 가지

### 1. 데이터는 그대로 그려진다 — 정렬·필터·페이지는 소비자 책임

이 컴포넌트는 `data`를 **손대지 않고 그대로** 렌더합니다. 헤더를 클릭하면 정렬하는 것이
아니라 `sort-change` 이벤트를 **발생시킬 뿐**이며, 실제로 정렬된 데이터를 다시 넣어 주는
것은 소비자입니다. 필터·페이지도 같습니다.

서버 페이징·서버 정렬에 그대로 맞는 구조이며, 클라이언트에서 처리하고 싶다면 이벤트를
받아 직접 정렬한 배열을 `data`에 넣으세요.

```typescript
table.addEventListener('sort-change', (e) => {
  const { field, direction } = e.detail;   // direction: 'asc' | 'desc' | null
  table.data = mySort(rows, field, direction);
});
```

`totalCount`는 **전체 건수**입니다(현재 페이지 길이가 아닙니다). 이 값이 `0`이면
페이지네이션 영역이 렌더되지 않습니다.

### 2. 각 행에 `_id`를 주세요

선택·확장·행 오류 상태가 전부 `_id`로 추적됩니다.

```typescript
table.data = rows.map(r => ({ ...r, _id: r.userId }));
```

`_id`가 없으면 **위치(행 번호)로 대체**하고 콘솔에 경고를 냅니다. 동작은 하지만, 데이터가
재정렬·재페이징되면 선택 상태가 다른 행으로 옮겨갑니다 — 위 1번 때문에 재정렬은 흔한
일이므로 안전망으로만 여기세요.

## 기본 사용

```html
<u-rich-table
  .columns=${columns}
  .data=${rows}
  .totalCount=${total}
  selectable
  editable
  filterable
  @row-update=${onUpdate}
></u-rich-table>
```

## 속성 (Properties)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `columns` | `ColumnDef[]` | `[]` | 컬럼 정의 |
| `data` | `Record<string, unknown>[]` | `[]` | 현재 페이지에 표시할 행. 정렬·필터가 **이미 적용된** 상태여야 합니다 |
| `totalCount` | `number` | `0` | 전체 건수. `0`이면 페이지네이션 미표시 |
| `pageSize` | `number` | `25` | 페이지당 행 수 (선택 UI: 25 / 50 / 100) |
| `currentPage` | `number` | `1` | 현재 페이지 (1-based) |
| `loading` | `boolean` | `false` | 로딩 표시 |
| `emptyMessage` | `string` | `'데이터가 없습니다'` | 빈 상태 문구 |
| `selectable` | `boolean` | `false` | 체크박스 선택 열 |
| `editable` | `boolean` | `false` | 셀 인라인 편집 |
| `addable` | `boolean` | `false` | 새 행 입력 줄 |
| `filterable` | `boolean` | `false` | 헤더 아래 필터 입력 줄 |
| `expandable` | `boolean` | `false` | 행 펼치기 (`detailRenderer` 필요) |
| `detailRenderer` | `(row) => TemplateResult` | `undefined` | 펼친 행의 내용 |

### UI 문구

| 속성 | 타입 | 기본값 |
|------|------|--------|
| `emptyMessage` | `string` | `'데이터가 없습니다'` |
| `loadingMessage` | `string` | `'로딩 중...'` |
| `filterPlaceholder` | `string` | `'필터...'` |
| `filterAllLabel` | `string` | `'전체'` |
| `addRowLabel` | `string` | `'+ 새 행'` |
| `pageInfoFormatter` | `(total, start, end) => string` | `전체 N건 중 X-Y 표시` |

`pageInfoFormatter`만 함수입니다 — 언어마다 어순이 달라 템플릿 문자열로는 열 수 없습니다.

```typescript
table.pageInfoFormatter = (total, start, end) => `${start}–${end} of ${total}`;
```

## 메서드

| 메서드 | 반환 | 설명 |
|------|------|------|
| `getSelectedRows()` | `Record<string, unknown>[]` | 현재 선택된 행 |

## ColumnDef

```typescript
interface ColumnDef {
  key:      string;                       // 데이터 객체의 키
  label:    string;                       // 헤더 표시 텍스트
  width?:   string;                       // 열 너비 (CSS 값)
  align?:   'left' | 'center' | 'right';
  type?:    'text' | 'number' | 'date' | 'select' | 'badge';

  sortable?:   boolean;                   // 헤더 클릭 시 sort-change 발생
  editable?:   boolean;                   // 이 열만 편집 허용 (표의 editable과 함께 필요)
  filterable?: boolean;
  filterType?: 'text' | 'select';
  required?:   boolean;

  options?:     { value: string; label: string }[];   // type: 'select'
  badgeColors?: Record<string, string>;               // type: 'badge' — 값 → 색

  render?:    (value: unknown, row: Record<string, unknown>) => string | HTMLElement;
  validator?: (value: unknown, row: Record<string, unknown>) => string | null;

  clipboardParse?:  (text: string) => unknown;        // 붙여넣기 시 문자열 → 값
  clipboardFormat?: (value: unknown) => string;       // 복사 시 값 → 문자열
}
```

`validator`는 **오류 문구를 반환**하고, 통과하면 `null`을 반환합니다.

## 이벤트

전부 `bubbles: true, composed: true` 입니다.

| 이벤트 | `detail` |
|------|------|
| `selection-change` | `{ selectedRows }` |
| `row-create` | `{ row }` |
| `row-update` | `{ row, field, value, oldValue }` |
| `row-delete` | `{ row }` |
| `row-expand` | `{ row, expanded }` |
| `sort-change` | `{ field, direction: 'asc' \| 'desc' \| null }` |
| `filter-change` | `{ filters }` |
| `page-change` | `{ page, pageSize }` |
| `paste` | `{ rows }` |

React에서는 `URichTableReact`가 이 아홉 개를 `onSelectionChange` 형태로 노출합니다.

## 키보드 · 클립보드

| 키 | 동작 |
|---|---|
| `↑` `↓` `←` `→` | 셀 포커스 이동 |
| `Enter` | 편집 시작 / 확정 후 아래 셀로 |
| `Tab` | 확정 후 오른쪽 셀로 |
| `Escape` | 편집 취소 |
| `Space` | 포커스된 행 선택 토글 (`selectable`) |
| `Delete` | 선택된 행마다 `row-delete` 발생 |
| `Ctrl`/`Cmd` + `C` | 선택 영역을 TSV로 복사 |
| `Ctrl`/`Cmd` + `V` | TSV 붙여넣기 → `paste` 발생 |
| `Ctrl`/`Cmd` + `A` | 전체 선택 |

복사·붙여넣기는 TSV(탭 구분)라 스프레드시트와 그대로 오갑니다. 값 변환이 필요하면
`clipboardParse` / `clipboardFormat`을 쓰세요.

`Ctrl+V`는 `navigator.clipboard.readText()`를 쓰므로 **보안 컨텍스트(HTTPS 또는
localhost)** 와 사용자 권한이 필요합니다.

## 테마

색은 `@iyulab/components`의 디자인 토큰을 통해 읽습니다. 브랜드 색 한 줄로 버튼과
강조색이 함께 따라옵니다:

```css
:root { --u-primary-color: #7B1FA2; }
```

제약 사항은 [README의 Theming 절](../README.md#theming)을 참고하세요.
