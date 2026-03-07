# USimpleSheet 드롭다운 셀렉터 설계

## 개요

USimpleSheet에 열별 드롭다운 셀렉터 기능을 추가한다.
특정 열의 편집 시 옵션 목록이 표시되어 값을 선택하거나 자유 입력할 수 있다.

## API 변경

### SheetColumn 확장

```typescript
export interface SheetColumn {
  key?: string;
  label?: string;
  width?: number;
  readonly?: boolean;

  /** 선택 가능한 옵션 목록 (정적 배열 또는 동적 콜백) */
  options?: string[] | ((row: number, col: number) => string[]);
  /** true이면 목록에 있는 값만 입력 가능 (기본: false = 자유 입력 허용) */
  strict?: boolean;
}
```

### 사용 예시

```typescript
columns = [
  { key: 'name', label: '이름', width: 150 },
  { key: 'dept', label: '부서', width: 120,
    options: ['개발팀', '기획팀', '디자인팀'], strict: true },
  { key: 'level', label: '직급', width: 100,
    options: (row, col) => getLevelsForDept(row) },
]
```

## 동작 설계

### 편집 진입
1. `_startEdit` 호출 시 해당 열에 `options`가 있으면 드롭다운 활성화
2. 즉시 전체 옵션 목록 표시
3. 타이핑 시 입력값으로 필터링 (대소문자 무시, 부분 매칭)

### 키보드 동작

| 키 | 동작 |
|---|---|
| ArrowDown/Up | 드롭다운 내 하이라이트 항목 이동 |
| Enter | 하이라이트 항목 선택 → 커밋 → 아래 셀 이동 |
| Tab | 하이라이트 항목 선택 → 커밋 → 오른쪽 이동 |
| Escape | 드롭다운 닫기 + 편집 취소 |
| 타이핑 | input 값 갱신 + 필터링 + 하이라이트 첫 항목 리셋 |

### 마우스 동작
- 항목 클릭 → 값 선택 → 커밋 → 현재 셀 유지

### strict 모드
- 커밋 시 `_editVal`이 options 목록에 없으면 커밋 무시 (이전 값 유지)
- 빈 문자열은 항상 허용
- paste는 strict 제한 없음 (UI 수동 편집에만 적용)

## 상태 추가

```typescript
@state() private _dropdownItems: string[] = [];   // 필터링된 옵션 목록
@state() private _dropdownIndex: number = -1;      // 하이라이트 인덱스
```

## 렌더링

편집 중인 셀에 `options`가 있으면 input 아래에 드롭다운 오버레이 추가:

```html
<div class="cell-dropdown">
  <div class="dropdown-item highlighted">개발팀</div>
  <div class="dropdown-item">기획팀</div>
  <div class="dropdown-item">디자인팀</div>
</div>
```

### 스타일 핵심
- `position: absolute`, input 아래 (`top: 100%`)
- `max-height: 200px; overflow-y: auto`
- `z-index: 20`
- 하이라이트 항목 `scrollIntoView` 자동 스크롤
- 다크 모드 대응 (기존 CSS 변수 재활용)
- strict 모드에서 필터 결과 없으면 "일치하는 항목 없음" 표시
- freeform 모드에서 필터 결과 없으면 드롭다운 숨김

### 마우스 이벤트
- `mousedown` + `e.preventDefault()` 사용 (input blur보다 먼저 처리)

## 변경 범위

### 변경 파일
- `USimpleSheet.component.ts`: SheetColumn 확장, 드롭다운 상태/로직/렌더링
- `USimpleSheet.styles.ts`: 드롭다운 스타일 추가

### 변경 메서드
| 메서드 | 변경 내용 |
|---|---|
| `_startEdit` | options 있으면 드롭다운 초기화 |
| `_commitEdit` | strict 모드 검증 추가 |
| `_cancelEdit` | 드롭다운 상태 초기화 |
| `_onInputChange` | 필터링 → `_dropdownItems`/`_dropdownIndex` 갱신 |
| `_onInputKeyDown` | ArrowDown/Up 드롭다운 탐색, Enter/Tab 하이라이트 반영 |
| `_onInputBlur` | 드롭다운 클릭 blur 무시 처리 |
| `_renderCell` | 드롭다운 렌더링 추가 |

### 추가 헬퍼
```typescript
private _getColOptions(row: number, col: number): string[] | null
private _filterOptions(options: string[], query: string): string[]
```

### 변경 없음
- 키보드 네비게이션, copy/paste, Undo/Redo, Fill 기능
- `options`가 없는 열의 동작
- 공개 API (`getData`, `getDataAsObjects` 등)
