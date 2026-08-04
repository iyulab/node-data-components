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
재정렬되면 선택 상태가 다른 행으로 옮겨갑니다 — 위 1번 때문에 재정렬은 흔한 일이므로
안전망으로만 여기세요.

🔴**`selectable` 과 서버 페이징을 함께 쓴다면 `_id`는 안전망이 아니라 전제조건입니다.**
위치 기반 대체는 페이지가 바뀌어도 같은 키를 만듭니다 — 1페이지의 `#0`과 2페이지의 `#0`이
**같은 값**입니다. 그래서 1페이지에서 첫 행을 고르면 2페이지의 첫 행도 선택된 것으로
렌더됩니다. 선택이 옮겨가는 것이 아니라 **충돌하는** 것이라 경고만으로는 막을 수 없습니다.

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
| `getSelectedRows()` | `Record<string, unknown>[]` | **현재 페이지의** 선택된 행 (아래 참조) |
| `selectedRowIds` *(getter)* | `ReadonlySet<string>` | 선택된 **모든** 행의 `_id` — 페이지를 가로질러 누적된 전부 |
| `setSelection(ids)` | `void` | 선택을 통째로 대체합니다. 현재 페이지에 없는 `_id`도 받습니다 |
| `clearSelection()` | `void` | 선택을 전부 비웁니다 — 다른 페이지의 누적분까지 |

### 선택은 페이지를 넘어 유지됩니다

`data`를 바꿔도 선택은 초기화되지 않습니다. 서버 페이징에서 *"여러 페이지에 걸쳐 고른 뒤
한꺼번에 처리"* 가 성립하도록 한 설계입니다.

- **전체선택 체크박스는 «현재 페이지» 범위**입니다. 켜면 이 페이지 행이 선택에 더해지고,
  끄면 이 페이지 행만 빠집니다 — 다른 페이지의 선택분은 그대로입니다.
- **`getSelectedRows()`는 현재 페이지만 돌려줍니다.** 컴포넌트가 갖고 있지 않은 행을
  돌려줄 수는 없기 때문입니다. 페이지를 가로지르는 선택 전부가 필요하면 **`selectedRowIds`**
  를 쓰세요. 선택 건수 라벨은 누적을 세므로, 선택이 페이지를 가로지르면
  `4 selected (1 on this page)` 처럼 두 숫자를 함께 보여 줍니다.
- 일괄 처리를 끝낸 뒤 상태를 되돌리려면 **`clearSelection()`**, 앱이 선택을 정본으로 들고
  있다면 **`setSelection(ids)`** 를 쓰세요.

```typescript
table.addEventListener('selection-change', (e) => {
  e.detail.selectedIds;   // 누적 식별자 — 일괄 처리 대상
  e.detail.selectedRows;  // 현재 페이지의 행 객체 (길이가 다른 것이 정상입니다)
});

// 처리 후 정리
await bulkApprove(table.selectedRowIds);
table.clearSelection();
```

⚠**`setSelection()`은 같은 집합이면 아무 일도 하지 않습니다.** `selection-change`를 받아
앱 상태를 갱신하고 그것을 다시 `setSelection()`으로 돌려주는 배선이 자연스러운데, 무조건
이벤트를 내면 그 자리가 무한 루프가 되기 때문입니다.

### `select-all` — 「전체선택을 눌렀다」는 의도

`selection-change`만으로는 *"세 행을 골랐다"*와 *"전체선택을 눌렀다"*가 구분되지 않습니다.
서버 페이징에서 후자는 앱이 *"조건에 맞는 N건 전부를 선택하시겠습니까?"*를 제안할 자리입니다.

```typescript
table.addEventListener('select-all', (e) => {
  e.detail.checked;      // 켰는가 껐는가
  e.detail.pageRowIds;   // 이번 조작이 더하거나 뺀 현재 페이지 식별자
});
```

⚠**`scope: 'page' | 'all'` 같은 필드는 없습니다.** 이 컴포넌트는 `'all'`을 낼 수 없습니다 —
다른 페이지의 행을 갖고 있지 않고, 서버 페이징에서 *전역 전체선택*은 식별자 목록이 아니라
**조회 조건**이라 컴포넌트가 표현할 수 있는 것이 아닙니다. 컴포넌트는 의도만 알리고,
그것을 *"전체 N건"*으로 해석할지는 앱이 정합니다.

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
| `selection-change` | `{ selectedRows, selectedIds }` — 앞은 **현재 페이지의 행**, 뒤는 **누적 식별자** |
| `select-all` | `{ checked, pageRowIds }` — 전체선택 체크박스 조작. `selection-change`와 함께 발생 |
| `row-create` | `{ row }` |
| `row-update` | `{ row, field, value, oldValue }` |
| `row-delete` | `{ row }` |
| `row-expand` | `{ row, expanded }` |
| `sort-change` | `{ field, direction: 'asc' \| 'desc' \| null }` |
| `filter-change` | `{ filters }` |
| `page-change` | `{ page, pageSize }` |
| `paste` | `{ rows }` |

React에서는 `URichTableReact`가 이들을 `onSelectionChange` 형태로 노출합니다 — 목록이 표와
어긋나면 **컴파일 에러**가 납니다(`src/react.ts`의 완전성 단언).

## 키보드 · 클립보드

| 키 | 동작 |
|---|---|
| `↑` `↓` `←` `→` | 셀 포커스 이동 |
| `Enter` | 편집 시작 / 확정 후 아래 셀로 |
| `Tab` | 확정 후 오른쪽 셀로 |
| `Escape` | 편집 취소 |
| `Space` | 포커스된 행 선택 토글 (`selectable`) |
| `Delete` | **현재 페이지의** 선택된 행마다 `row-delete` 발생 |
| `Ctrl`/`Cmd` + `C` | 선택 영역을 TSV로 복사 |
| `Ctrl`/`Cmd` + `V` | TSV 붙여넣기 → `paste` 발생 |
| `Ctrl`/`Cmd` + `A` | **현재 페이지** 전체 선택 (전체선택 체크박스와 같은 범위) |

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
