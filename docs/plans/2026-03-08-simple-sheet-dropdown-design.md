# USimpleSheet 드롭다운 셀렉터 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** USimpleSheet에 열별 드롭다운 셀렉터를 추가하여 옵션 목록에서 값을 선택하거나 자유 입력할 수 있게 한다.

**Architecture:** `SheetColumn`에 `options`/`strict` 필드를 추가하고, 기존 셀 편집 흐름(`_startEdit`→`_commitEdit`)에 드롭다운 상태를 통합한다. 별도 컴포넌트 없이 `USimpleSheet` 내부에서 드롭다운 오버레이를 직접 렌더링한다.

**Tech Stack:** Lit (html/css/state decorators), TypeScript

---

## 설계 요약

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

---

## 구현 태스크

### Task 1: SheetColumn 인터페이스 확장 + 헬퍼 메서드

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:7-16` (SheetColumn 인터페이스)
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:924-926` (_isColReadonly 근처에 헬퍼 추가)

**Step 1: SheetColumn에 `options`, `strict` 필드 추가**

```typescript
export interface SheetColumn {
  /** 데이터 키 (getDataAsObjects() 반환시 객체 키로 사용) */
  key?: string;
  /** 헤더 표시 레이블 */
  label?: string;
  /** 열 너비 (px) */
  width?: number;
  /** 읽기 전용 열 */
  readonly?: boolean;
  /** 선택 가능한 옵션 목록 (정적 배열 또는 동적 콜백) */
  options?: string[] | ((row: number, col: number) => string[]);
  /** true이면 목록에 있는 값만 입력 가능 (기본: false = 자유 입력 허용) */
  strict?: boolean;
}
```

**Step 2: 헬퍼 메서드 2개 추가** (`_isColReadonly` 아래)

```typescript
private _getColOptions(row: number, col: number): string[] | null {
  const colDef = this.columns?.[col];
  if (!colDef?.options) return null;
  return typeof colDef.options === 'function'
    ? colDef.options(row, col)
    : colDef.options;
}

private _filterOptions(options: string[], query: string): string[] {
  if (!query) return options;
  const lower = query.toLowerCase();
  return options.filter(o => o.toLowerCase().includes(lower));
}
```

**Step 3: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.component.ts
git commit -m "feat(simple-sheet): add options/strict to SheetColumn + helper methods"
```

---

### Task 2: 드롭다운 상태 추가 + _startEdit/_cancelEdit 수정

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:73-76` (상태 선언 영역)
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:838-856` (_startEdit)
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:875-879` (_cancelEdit)

**Step 1: 드롭다운 상태 추가** (`_replaceOnEdit` 아래)

```typescript
@state() private _dropdownItems: string[] = [];
@state() private _dropdownIndex = -1;
```

**Step 2: `_startEdit` 수정** — 기존 로직 끝에 드롭다운 초기화 추가

`_startEdit` 메서드에서 `this.updateComplete.then(...)` 블록 앞에:

```typescript
// 드롭다운 초기화
const options = this._getColOptions(row, col);
if (options) {
  const filtered = this._filterOptions(options, this._editVal);
  this._dropdownItems = filtered;
  this._dropdownIndex = filtered.length > 0 ? 0 : -1;
} else {
  this._dropdownItems = [];
  this._dropdownIndex = -1;
}
```

**Step 3: `_cancelEdit` 수정** — 드롭다운 상태 리셋 추가

```typescript
private _cancelEdit() {
  this._editing = null;
  this._dropdownItems = [];
  this._dropdownIndex = -1;
  this.requestUpdate();
  this._containerEl?.focus();
}
```

**Step 4: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.component.ts
git commit -m "feat(simple-sheet): add dropdown state and init in startEdit/cancelEdit"
```

---

### Task 3: _commitEdit에 strict 검증 + 드롭다운 리셋

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:858-873` (_commitEdit)

**Step 1: `_commitEdit` 수정**

strict 모드에서 유효하지 않은 값은 커밋을 무시한다. 드롭다운 상태도 리셋한다.

```typescript
private _commitEdit() {
  if (!this._editing) return;
  const { row, col } = this._editing;

  // strict 모드 검증: 옵션 목록에 없고 빈 문자열이 아니면 커밋 무시
  const colDef = this.columns?.[col];
  if (colDef?.strict && colDef?.options && this._editVal !== '') {
    const allOptions = this._getColOptions(row, col) ?? [];
    if (!allOptions.includes(this._editVal)) {
      // 유효하지 않은 값 — 편집 취소
      this._editing = null;
      this._dropdownItems = [];
      this._dropdownIndex = -1;
      this.requestUpdate();
      this._containerEl?.focus();
      return;
    }
  }

  const prevVal = this._data[row]?.[col] ?? '';
  const newData = this._data.map(r => [...r]);
  newData[row][col] = this._editVal;
  this._data = newData;
  this._editing = null;
  this._dropdownItems = [];
  this._dropdownIndex = -1;
  if (this._editVal !== prevVal) {
    this._pushHistory();
    this._emitChange();
  }
  this.requestUpdate();
  this._containerEl?.focus();
}
```

**Step 2: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.component.ts
git commit -m "feat(simple-sheet): add strict validation and dropdown reset in commitEdit"
```

---

### Task 4: _onInputChange 필터링 + _onInputKeyDown 드롭다운 탐색

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:501-502` (_onInputChange)
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:505-570` (_onInputKeyDown)

**Step 1: `_onInputChange` 수정** — 필터링 추가

```typescript
private _onInputChange = (e: Event) => {
  this._editVal = (e.target as HTMLInputElement).value;
  // 드롭다운 필터링
  if (this._editing) {
    const options = this._getColOptions(this._editing.row, this._editing.col);
    if (options) {
      const filtered = this._filterOptions(options, this._editVal);
      this._dropdownItems = filtered;
      this._dropdownIndex = filtered.length > 0 ? 0 : -1;
    }
  }
};
```

**Step 2: `_onInputKeyDown` 수정** — ArrowDown/Up 드롭다운 탐색, Enter/Tab에서 하이라이트 항목 반영

드롭다운이 활성화된 상태에서:
- `ArrowDown`: `_dropdownIndex`를 1 증가 (순환)
- `ArrowUp`: `_dropdownIndex`를 1 감소 (순환)
- `Enter`/`Tab`: 하이라이트된 항목이 있으면 `_editVal`에 반영 후 기존 커밋/이동 로직 실행

```typescript
private _onInputKeyDown = (e: KeyboardEvent) => {
  e.stopPropagation();
  const hasDropdown = this._dropdownItems.length > 0;

  if (e.key === 'Escape') {
    e.preventDefault();
    this._cancelEdit();
    return;
  }

  // 드롭다운 탐색
  if (hasDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    const len = this._dropdownItems.length;
    if (e.key === 'ArrowDown') {
      this._dropdownIndex = (this._dropdownIndex + 1) % len;
    } else {
      this._dropdownIndex = (this._dropdownIndex - 1 + len) % len;
    }
    return;
  }

  // Enter/Tab 시 하이라이트 항목 반영
  if (hasDropdown && this._dropdownIndex >= 0
      && (e.key === 'Enter' || e.key === 'Tab')) {
    this._editVal = this._dropdownItems[this._dropdownIndex];
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const pos = this._editing!;
    this._commitEdit();
    if (e.ctrlKey) {
      this._select(pos.row, pos.col);
    } else if (e.shiftKey) {
      this._select(Math.max(0, pos.row - 1), pos.col);
    } else {
      this._select(Math.min(this._rowCount - 1, pos.row + 1), pos.col);
    }
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    const pos = this._editing!;
    this._commitEdit();
    if (e.shiftKey) {
      if (pos.col === 0 && pos.row > 0) {
        this._select(pos.row - 1, this._colCount - 1);
      } else {
        this._select(pos.row, Math.max(0, pos.col - 1));
      }
    } else {
      if (pos.col === this._colCount - 1) {
        if (pos.row < this._rowCount - 1) {
          this._select(pos.row + 1, 0);
        } else {
          this._select(pos.row, pos.col);
        }
      } else {
        this._select(pos.row, pos.col + 1);
      }
    }
    return;
  }

  // ArrowUp/Down (드롭다운 없을 때): 기존 동작
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const pos = this._editing!;
    this._commitEdit();
    this._select(Math.max(0, pos.row - 1), pos.col);
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const pos = this._editing!;
    this._commitEdit();
    this._select(Math.min(this._rowCount - 1, pos.row + 1), pos.col);
    return;
  }
};
```

**Step 3: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.component.ts
git commit -m "feat(simple-sheet): add dropdown filtering and keyboard navigation"
```

---

### Task 5: _onInputBlur 수정 + _renderCell 드롭다운 렌더링

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:572-576` (_onInputBlur)
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts:291-321` (_renderCell)

**Step 1: `_onInputBlur` 수정** — 드롭다운 클릭으로 인한 blur 무시

`_isDropdownClick` 플래그를 사용하여 드롭다운 항목의 mousedown이 blur보다 먼저 처리되도록 한다.

상태에 추가 (private 필드, @state 불필요):
```typescript
private _isDropdownClick = false;
```

```typescript
private _onInputBlur = () => {
  if (this._isDropdownClick) {
    this._isDropdownClick = false;
    return;
  }
  if (this._editing) {
    this._commitEdit();
  }
};
```

**Step 2: 드롭다운 항목 mousedown 핸들러 추가**

```typescript
private _onDropdownItemMouseDown = (e: MouseEvent, value: string) => {
  e.preventDefault();
  this._isDropdownClick = true;
  this._editVal = value;
  this._commitEdit();
};
```

**Step 3: `_renderCell` 수정** — 드롭다운 렌더링 추가

```typescript
private _renderCell(r: number, c: number): TemplateResult {
  const isEditing = this._editing?.row === r && this._editing?.col === c;
  const isSelected = this._inSel(r, c);
  const isAnchor = this._isAnchor(r, c);
  const value = this._data[r]?.[c] ?? '';

  const classes = [
    'cell',
    isSelected ? 'selected' : '',
    isAnchor ? 'anchor' : '',
    isEditing ? 'editing' : '',
  ].filter(Boolean).join(' ');

  const hasOptions = isEditing && this._getColOptions(r, c) !== null;
  const showDropdown = isEditing && this._dropdownItems.length > 0;
  const isStrict = this.columns?.[c]?.strict ?? false;
  const noMatch = isEditing && hasOptions && this._dropdownItems.length === 0 && this._editVal !== '';

  return html`
    <td
      class=${classes}
      data-row=${r}
      data-col=${c}
    >
      ${isEditing ? html`
        <input
          class="cell-input"
          .value=${this._editVal}
          @input=${this._onInputChange}
          @keydown=${this._onInputKeyDown}
          @blur=${this._onInputBlur}
        />
        ${showDropdown ? html`
          <div class="cell-dropdown">
            ${this._dropdownItems.map((item, i) => html`
              <div
                class="dropdown-item ${i === this._dropdownIndex ? 'highlighted' : ''}"
                @mousedown=${(e: MouseEvent) => this._onDropdownItemMouseDown(e, item)}
              >${item}</div>
            `)}
          </div>
        ` : noMatch && isStrict ? html`
          <div class="cell-dropdown">
            <div class="dropdown-empty">일치하는 항목 없음</div>
          </div>
        ` : ''}
      ` : value}
    </td>
  `;
}
```

**Step 4: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.component.ts
git commit -m "feat(simple-sheet): add dropdown rendering and blur handling"
```

---

### Task 6: 드롭다운 스타일 추가

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.styles.ts`

**Step 1: 라이트 모드 드롭다운 스타일 추가** (`.cell-input` 스타일 뒤)

```css
/* Dropdown overlay */
.cell-dropdown {
  position: absolute;
  top: 100%;
  left: -1px;
  width: calc(100% + 2px);
  min-width: 120px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--u-bg-color, #fff);
  border: 1px solid var(--u-border-color, #e2e8f0);
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

.dropdown-item {
  padding: 4px 8px;
  font-size: 13px;
  color: var(--u-txt-color, #0f172a);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item:hover {
  background: var(--u-neutral-100, #f1f5f9);
}

.dropdown-item.highlighted {
  background: var(--u-blue-50, #eff6ff);
  color: var(--u-blue-800, #1e40af);
}

.dropdown-empty {
  padding: 6px 8px;
  font-size: 12px;
  color: var(--u-txt-color-weak, #64748b);
  font-style: italic;
}
```

**Step 2: 다크 모드 드롭다운 스타일 추가** (다크 모드 `.cell-input` 스타일 뒤)

```css
:host-context([theme="dark"]) .cell-dropdown {
  background: var(--u-bg-color, #121212);
  border-color: var(--u-border-color, #3D3D3D);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

:host-context([theme="dark"]) .dropdown-item {
  color: var(--u-txt-color, #D4D4D4);
}

:host-context([theme="dark"]) .dropdown-item:hover {
  background: var(--u-neutral-100, #1E1E1E);
}

:host-context([theme="dark"]) .dropdown-item.highlighted {
  background: var(--u-blue-100, #1e3a5f);
  color: var(--u-blue-800, #c2deff);
}

:host-context([theme="dark"]) .dropdown-empty {
  color: var(--u-txt-color-weak, #8A8A8A);
}
```

**Step 3: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.styles.ts
git commit -m "feat(simple-sheet): add dropdown styles with dark mode support"
```

---

### Task 7: 하이라이트 항목 scrollIntoView + 빌드 검증

**Files:**
- Modify: `src/components/simple-sheet/USimpleSheet.component.ts` (드롭다운 인덱스 변경 시 스크롤)

**Step 1: 드롭다운 인덱스 변경 시 scrollIntoView**

`_onInputKeyDown`에서 ArrowDown/Up 처리 후:

```typescript
// 하이라이트 항목 스크롤
this.updateComplete.then(() => {
  const highlighted = this.renderRoot.querySelector('.dropdown-item.highlighted');
  highlighted?.scrollIntoView({ block: 'nearest' });
});
```

**Step 2: 빌드 검증**

```bash
cd packages/data-components && npm run build
```

Expected: 빌드 성공, 에러 없음

**Step 3: 커밋**

```bash
git add src/components/simple-sheet/USimpleSheet.component.ts
git commit -m "feat(simple-sheet): add dropdown highlight scrollIntoView"
```

---

### Task 8: 문서 업데이트

**Files:**
- Modify: `docs/USimpleSheet.md`

**Step 1: SheetColumn 문서에 `options`, `strict` 추가**

SheetColumn 섹션에:
```typescript
interface SheetColumn {
  key?:      string;
  label?:    string;
  width?:    number;
  readonly?: boolean;
  options?:  string[] | ((row: number, col: number) => string[]);
  strict?:   boolean;
}
```

속성 테이블에 행 추가:
| `options` | `string[] \| ((row, col) => string[])` | `undefined` | 드롭다운 옵션 목록 |
| `strict` | `boolean` | `false` | 목록 값만 입력 허용 |

**Step 2: 드롭다운 사용 예시 추가**

```html
<u-simple-sheet
  .columns=${[
    { key: 'name', label: '이름', width: 150 },
    { key: 'dept', label: '부서', width: 120,
      options: ['개발팀', '기획팀', '디자인팀'], strict: true },
    { key: 'level', label: '직급', width: 100,
      options: ['사원', '대리', '과장', '부장'] },
  ]}
></u-simple-sheet>
```

**Step 3: 커밋**

```bash
git add docs/USimpleSheet.md
git commit -m "docs(simple-sheet): add dropdown selector documentation"
```
