# USimpleSheet

엑셀과 호환되는 심플 스프레드시트 입력 컴포넌트.
수식 엔진 없이 **데이터 입력 편의성**에 집중하며, `compute` 콜백으로 열 단위 자동 계산을 지원합니다.

## 특징

- 엑셀 호환 복사/붙여넣기 (TSV 형식, Ctrl+C/V)
- Undo/Redo (Ctrl+Z / Ctrl+Y)
- 다중 셀 선택 (클릭, Shift+클릭, 드래그, Shift+Arrow)
- 열 너비 드래그 조절
- 행/열 헤더 클릭으로 전체 행/열 선택
- Fill Down (Ctrl+D) / Fill Right (Ctrl+R)
- `columns` 미설정 시 A, B, C... 자동 헤더
- 드롭다운 셀렉터 (열별 옵션 목록, strict/freeform 모드)
- `compute` 콜백을 통한 열 단위 자동 계산
- 라이트/다크 모드 지원

## 설치 및 등록

```typescript
import '@iyulab/data-components'; // 자동 등록
```

또는 직접 import:

```typescript
import '@iyulab/data-components/dist/components/simple-sheet/USimpleSheet.js';
```

## 기본 사용

### 빈 시트 (자동 헤더)

```html
<u-simple-sheet
  style="height: 300px;"
  .rows=${20}
  .cols=${8}
  @change=${(e) => console.log(e.detail.data)}
></u-simple-sheet>
```

`columns`를 지정하지 않으면 열 헤더가 A, B, C... 로 자동 생성됩니다.

### 컬럼 정의

```html
<u-simple-sheet
  style="height: 400px;"
  .columns=${[
    { key: 'name',     label: '이름',   width: 150 },
    { key: 'email',    label: '이메일', width: 220 },
    { key: 'dept',     label: '부서',   width: 120 },
    { key: 'salary',   label: '연봉',   width: 100 },
  ]}
  @change=${(e) => console.log(e.target.getDataAsObjects())}
></u-simple-sheet>
```

`columns`를 지정하면 해당 열 수만큼만 표시되고 헤더에 `label`이 사용됩니다.

### 초기 데이터

```html
<u-simple-sheet
  .columns=${columns}
  .data=${[
    ['홍길동', 'hong@example.com', '개발팀', '5500'],
    ['김철수', 'kim@example.com',  '기획팀', '4800'],
  ]}
></u-simple-sheet>
```

`data`는 2D 문자열 배열(`string[][]`)입니다.

### 읽기 전용

```html
<u-simple-sheet readonly .data=${myData}></u-simple-sheet>
```

특정 열만 읽기 전용으로 설정할 수도 있습니다:

```typescript
columns = [
  { key: 'id',   label: 'ID',   readonly: true },
  { key: 'name', label: '이름' },
]
```

## 속성 (Properties)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `data` | `string[][]` | `[]` | 초기 데이터 (2D 문자열 배열) |
| `columns` | `SheetColumn[]` | `undefined` | 열 정의. 미설정 시 A, B, C... 자동 헤더 |
| `rows` | `number` | `20` | 초기 행 수 |
| `cols` | `number` | `10` | 초기 열 수 (columns 미설정 시 사용) |
| `readonly` | `boolean` | `false` | 전체 읽기 전용 모드 |

## SheetColumn

```typescript
interface SheetColumn {
  key?:      string;   // getDataAsObjects() 반환 시 객체 키
  label?:    string;   // 헤더 표시 텍스트
  width?:    number;   // 열 초기 너비 (px)
  readonly?: boolean;  // 해당 열만 읽기 전용
  options?:  string[] | ((row: number, col: number) => string[]);  // 드롭다운 옵션 목록
  strict?:   boolean;  // 목록 값만 입력 허용 (기본: false)
  compute?:  (rowIndex: number, data: string[][]) => string;  // 자동 계산 함수
}
```

## 이벤트 (Events)

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `change` | `{ data: string[][] }` | 셀 값이 변경될 때마다 발생 |

```javascript
sheet.addEventListener('change', (e) => {
  console.log(e.detail.data);          // string[][]
  console.log(e.target.getDataAsObjects()); // 객체 배열
});
```

## 공개 API (Public API)

```typescript
// 현재 데이터를 2D 배열로 반환
sheet.getData(): string[][]

// columns.key 기준 객체 배열로 반환
// columns 미설정 시 A, B, C... 키 사용
sheet.getDataAsObjects(): Record<string, string>[]

// 데이터 직접 설정
sheet.setData(data: string[][]): void

// 특정 셀 값 설정
sheet.setCell(row: number, col: number, value: string): void

// 현재 선택 영역 반환
sheet.getSelection(): { minRow, maxRow, minCol, maxCol } | null

// Undo/Redo 가능 여부
sheet.canUndo: boolean
sheet.canRedo: boolean
```

## 드롭다운 셀렉터

열에 `options`를 설정하면 셀 편집 시 드롭다운 목록이 표시됩니다.

### 기본 사용 (자유 입력 + 자동완성)

```html
<u-simple-sheet
  .columns=${[
    { key: 'name', label: '이름', width: 150 },
    { key: 'level', label: '직급', width: 100,
      options: ['사원', '대리', '과장', '부장'] },
  ]}
></u-simple-sheet>
```

목록에 없는 값도 자유롭게 입력할 수 있습니다.

### strict 모드 (목록 값만 허용)

```html
<u-simple-sheet
  .columns=${[
    { key: 'dept', label: '부서', width: 120,
      options: ['개발팀', '기획팀', '디자인팀'], strict: true },
  ]}
></u-simple-sheet>
```

`strict: true`이면 목록에 있는 값만 입력(선택)할 수 있습니다. 빈 값은 항상 허용됩니다.
Ctrl+V 붙여넣기는 strict 제한 없이 허용됩니다.

### 동적 옵션

```typescript
columns = [
  { key: 'level', label: '직급', width: 100,
    options: (row, col) => getOptionsForRow(row) },
]
```

콜백 함수를 사용하면 행/열에 따라 다른 옵션 목록을 제공할 수 있습니다.

### 드롭다운 조작

| 동작 | 키보드 | 마우스 |
|------|--------|--------|
| 목록 열기 | 셀 편집 진입 시 자동 | 셀 더블클릭 |
| 항목 이동 | `↑` / `↓` | — |
| 항목 선택 | `Enter` / `Tab` | 클릭 |
| 취소 | `Escape` | — |
| 필터링 | 타이핑 | — |

## 키보드 단축키

### 탐색

| 단축키 | 동작 |
|--------|------|
| `Arrow` | 셀 이동 |
| `Shift+Arrow` | 선택 범위 확장 |
| `Tab` / `Shift+Tab` | 오른쪽/왼쪽 이동 (마지막 열에서 다음/이전 행으로 사이클) |
| `Enter` | 아래 이동 |
| `Shift+Enter` | 위 이동 |
| `Home` / `End` | 행 처음/끝 |
| `Ctrl+Home` / `Ctrl+End` | 시트 처음/끝 |
| `Page Up` / `Page Down` | 10행 단위 이동 |

### 편집

| 단축키 | 동작 |
|--------|------|
| `Enter` / `F2` | 편집 시작 (기존 값 선택) |
| 문자 입력 | 즉시 편집 시작 (기존 값 대체) |
| `Ctrl+Enter` | 편집 확정 후 현재 셀 유지 |
| `Escape` | 편집 취소 |
| `Delete` / `Backspace` | 선택 영역 지우기 |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |

### 선택

| 단축키 | 동작 |
|--------|------|
| `Ctrl+A` | 전체 선택 |
| 행 번호 클릭 | 전체 행 선택 |
| 열 헤더 클릭 | 전체 열 선택 |
| 좌상단 코너 클릭 | 전체 선택 |
| `Shift+클릭` | 범위 선택 |
| 드래그 | 범위 선택 |

### 클립보드 / 채우기

| 단축키 | 동작 |
|--------|------|
| `Ctrl+C` | 선택 영역 복사 (TSV, 엑셀 호환) |
| `Ctrl+V` | 붙여넣기 (엑셀에서 복사한 내용 포함) |
| `Ctrl+D` | Fill Down (선택 영역 첫 행 값으로 아래 채우기) |
| `Ctrl+R` | Fill Right (선택 영역 첫 열 값으로 오른쪽 채우기) |

## 열 너비 조절

열 헤더 오른쪽 끝에 마우스를 올리면 `col-resize` 커서가 표시됩니다.
드래그하여 너비를 조절할 수 있으며 최소 너비는 30px입니다.

사용자가 조절한 너비는 `data` 변경 후에도 유지됩니다.
`columns[c].width`를 설정하면 초기 너비로 사용됩니다.

## CSS 커스터마이징

Shadow DOM 내부 스타일은 CSS 변수로 제어합니다.

```css
u-simple-sheet {
  --u-bg-color:         #fff;
  --u-border-color:     #e2e8f0;
  --u-border-color-weak:#f1f5f9;
  --u-txt-color:        #0f172a;
  --u-txt-color-weak:   #64748b;
  --u-neutral-50:       #f8fafc;
  --u-neutral-100:      #f1f5f9;
  --u-blue-50:          #eff6ff;
  --u-blue-100:         #dbeafe;
  --u-blue-500:         #3b82f6;
}
```

높이는 inline style 또는 CSS로 지정합니다 (기본 400px):

```html
<u-simple-sheet style="height: 500px;"></u-simple-sheet>
```

## TypeScript

```typescript
import { USimpleSheet, type SheetColumn } from '@iyulab/data-components';

const sheet = document.querySelector('u-simple-sheet') as USimpleSheet;
const data = sheet.getData();
const objects = sheet.getDataAsObjects();
```

컬럼 타입 체크:

```typescript
const columns = [
  { key: 'name', label: '이름', width: 150 },
] satisfies SheetColumn[];
```

## 자동 계산 (compute)

열에 `compute`를 설정하면 데이터 변경 시 해당 열이 자동으로 재계산됩니다.
수식 엔진 없이 프로그래밍 방식으로 셀 간 연동을 구현할 수 있습니다.

### 같은 행 내 계산 (가로)

```typescript
const columns: SheetColumn[] = [
  { key: 'item',  label: '품목',  width: 150 },
  { key: 'qty',   label: '수량',  width: 80 },
  { key: 'price', label: '단가',  width: 100 },
  { key: 'total', label: '합계',  width: 100,
    compute: (r, data) => {
      const qty = Number(data[r][1]) || 0;
      const price = Number(data[r][2]) || 0;
      return String(qty * price);
    }
  },
];
```

### 행 간 계산 (세로)

```typescript
const columns: SheetColumn[] = [
  { key: 'desc',    label: '내역',  width: 150 },
  { key: 'expense', label: '집행',  width: 100 },
  { key: 'balance', label: '잔액',  width: 100,
    compute: (r, data) => {
      const expense = Number(data[r][1]) || 0;
      if (r === 0) return String(10000000 - expense);
      const prevBalance = Number(data[r - 1][2]) || 0;
      return String(prevBalance - expense);
    }
  },
];
```

### 누적 합계

```typescript
{ key: 'cumulative', label: '누적', width: 100,
  compute: (r, data) => {
    let sum = 0;
    for (let i = 0; i <= r; i++) sum += Number(data[i][3]) || 0;
    return String(sum);
  }
}
```

### 동작 규칙

- **자동 readonly**: compute 열은 사용자가 직접 편집할 수 없습니다
- **시각적 구분**: compute 셀은 이탤릭체 + 파란 배경으로 표시됩니다
- **계산 순서**: 열 순서(좌→우), 행 순서(위→아래)로 계산. 열 정의 순서가 곧 의존성 순서입니다
- **에러 처리**: compute 함수에서 예외 발생 시 빈 문자열로 표시됩니다
- **클립보드**: 복사 시 계산값 포함, 붙여넣기 시 compute 열은 건너뜁니다
- **Fill Down/Right**: compute 열은 건너뜁니다
- **getData()**: 계산된 값이 포함되어 반환됩니다
