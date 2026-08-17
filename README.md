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

## 🤖 Skills Usage

이 패키지는 AI 코딩 에이전트가 라이브러리를 이해하고 사용하도록 돕는
[Agent Skill](https://agentskills.io/)을 포함합니다.

**GitHub 경유 (권장):**

```bash
npx skills add iyulab/node-data-components
```

**로컬 `node_modules` 경유:**

```bash
npx skills add ./node_modules/@iyulab/data-components/skills/iyulab-data-components
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

### 보조 전경 조절 (0.10.0~)

표의 **보조 전경**(빈 상태 안내문·열 머리·읽기 전용 셀 등)은 역할 토큰
`--u-txt-color-weak` 에서 파생된 단으로 그려집니다. 그 단을 **표 안에서만** 조절할 수
있습니다 — 문서 전체의 보조 텍스트를 건드리지 않고 표만 맞출 때 씁니다.

| 토큰 | 무엇을 칠하나 | `u-data-view` | `u-simple-sheet` | `u-rich-table` |
|---|---|:---:|:---:|:---:|
| `--dc-empty-color` | 빈 상태 안내문 | ● | ● | ● |
| `--dc-header-color` | 열 머리 · 행 머리 | ● | ● | |
| `--dc-muted-color` | 보조 텍스트 · 라벨 | ● | | ● |
| `--dc-icon-color` | 정렬 표시 · 확장 · 행 메뉴 | | | ● |
| `--dc-readonly-color` | 읽기 전용 셀 | | ● | |

⚠**빈 칸은 그 컴포넌트가 그 단을 «읽지 않는다»는 뜻**입니다. 값을 줘도 아무 일이
일어나지 않습니다 — 읽지 않는 토큰을 선언해 두지 않는 것이 이 패키지의 방침입니다.

커스텀 프로퍼티는 상속되므로 **범위는 선택자로 정합니다**:

```css
/* 세 표를 한꺼번에 */
:root { --dc-empty-color: #9AA0A6; }

/* 한 컴포넌트만 */
u-rich-table { --dc-icon-color: #B0B0B0; }
```

★**한 토큰으로 접지 않은 이유**: 전 컬럼이 읽기 전용인 시트에서는 데이터가 통째로
흐려 보이는데, 단이 하나면 *"읽기 전용 셀만 진하게"* 가 원리적으로 불가능합니다.

⚠**`0.10.0` 은 조절점만 엽니다 — 기본 렌더는 변하지 않습니다.** 다섯 단이 전부
`--u-txt-color-weak` 에서 파생되며, 다크 대응도 그 역할 토큰이 이미 갖고 있습니다.

### 시트 밀도·타이포 조절 (`u-simple-sheet` · 0.11.0~)

한 화면에 표가 여럿일 때 **행 높이를 서로 맞추기 위한** 조절점입니다. 색 축(위)과 같은
이유로 열렸습니다 — 어느 높이가 옳은지는 소비자가 정할 일인데, 종전에는 치수가 전부
리터럴이라 정할 방법이 없었습니다.

| 토큰 | 기본값 | 무엇을 정하나 |
|---|---|---|
| `--dc-row-height` | `24px` | 셀 `height` 와 `line-height` **둘 다** |
| `--dc-cell-padding-block` | `0px` | 셀·편집 입력의 세로 여백 (행 높이에 **가산**) |
| `--dc-cell-padding-inline` | `6px` | 〃 가로 여백 |
| `--dc-font-size` | `13px`(`var(--u-density, 13px)`) | 본문 셀 · 편집 입력 · 드롭다운 항목 |
| `--dc-header-font-size` | `12px` | 열 머리 — `--u-density` 와 무관(본문과 독립) |
| `--dc-header-font-weight` | `600` | 〃 |
| `--dc-sheet-height` | `400px` | `:host` 전체 높이 (0.17.0~) |

⚠**`--dc-sheet-height` 는 "자연 높이로 준다"가 아니라 "상한을 정한다"입니다.** `rows` 는
표시 개수가 아니라 데이터 격자의 **최소 용량**이라, 이 값을 낮춰도 `rows` 만큼의 빈 행이
줄지는 않습니다 — 그 안에서 내장 `overflow-y: auto` 로 스크롤해 접근하십시오. 콘텐츠
분량에 맞춰 자동으로 줄어드는 옵트인은 별도 스코프입니다.

⚠**`--dc-font-size` 만 예외입니다 — `@iyulab/components`/`@iyulab/flex-table` 의 밀도
스위치(`--u-density`)를 폴백 원본으로 갖습니다**(0.15.0~). 조상에 `--u-density` 를 걸면
본문 글자가 컨트롤·표와 함께 움직입니다. 이 요소에 `--dc-font-size` 를 직접 선언하면
그 값이 여전히 이깁니다 — 다른 다섯 토큰과 같은 규칙입니다. 머리행은 이 스위치의
영향을 받지 않습니다.

```css
/* ⚠요소 선택자로 겨눕니다 — :root 는 닿지 않습니다(아래 참조) */
u-simple-sheet {
  --dc-row-height: 30.5px;   /* 읽히는 행 높이 32px */
}
```

⚠**`:root` 로는 닿지 않습니다.** 커스텀 프로퍼티 상속값은 섀도 루트의 `:host` 선언에
집니다. 색 축과 달리 이 여섯은(`--dc-font-size` 도 포함 — 역할 토큰이 아니라 `--u-density`
스위치를 참조할 뿐, 역할 층에서 파생하는 것은 아닙니다) `:host` 에 기본값을 갖고 있으므로
**요소 선택자**(`u-simple-sheet { … }`)로 선언하십시오.

⚠**선언값과 «읽히는» 행 높이는 1.5px 다릅니다.** `border-collapse` 로 접힌 테두리가
사용값에 더해집니다 — 기본 `24px` 선언이 `25.5px` 로 읽힙니다. 32px 로 맞추려면
`30.5px` 를 선언하십시오. (같은 이유로 **빈 행은 데이터 행보다 1.5px 낮습니다** —
`0.11.0` 이전부터 그랬고, 교정하면 기본 렌더가 바뀌므로 이 릴리스에서는 두었습니다.)

⚠**조절점만 엽니다** — 선언하지 않으면 종전과 같은 값으로 그려집니다.
`--dc-row-height`·`--dc-cell-padding-block`·`--dc-cell-padding-inline`·
`--dc-header-font-size`·`--dc-header-font-weight`·`--dc-sheet-height` 여섯은
`u-simple-sheet` 전용입니다(`u-data-view`·`u-rich-table` 은 읽지 않습니다).
`--dc-font-size` 만 예외입니다 — 바로 아래 `u-rich-table` 절 참조.

### 그리드 밀도 조절 (`u-rich-table` · 0.16.0~)

시트 밀도 축(위)과 같은 이유로, `u-rich-table` 도 `--dc-font-size` 를 갖습니다 —
`--u-density` 를 폴백 원본으로 삼는 것도 `u-simple-sheet` 와 동일합니다.

| 토큰 | 기본값 | 무엇을 정하나 |
|---|---|---|
| `--dc-font-size` | `13px`(`var(--u-density, 13px)`) | 열 머리 · 본문 셀 · 편집 입력 |

⚠**이 컴포넌트는 시각 위계가 넉 단(13/12/11/10px)이고, 이 하나만 밀도를 따릅니다.**
툴바·페이지네이션·필터 행·배지·정렬 표시자·검증 오류 메시지는 의도적으로 남습니다 —
전부를 한 스위치에 묶으면 그 위계가 무너집니다. 편집 입력은 본문 셀과 **같은 토큰**을
공유합니다 — 따로 두면 편집 진입 순간 글자가 튑니다.

```css
/* 조상에 걸면 헤더·본문·편집 입력이 함께 움직입니다 */
.app-shell { --u-density: 15px; }

/* 이 그리드만 다르게 */
u-rich-table { --dc-font-size: 15px; }
```

⚠**미설정 시 렌더는 종전(`13px`)과 바이트 단위로 동일합니다.**

### 알려진 제약

- **표면 높이를 뜻하는 토큰이 없습니다** — 배경 역할 토큰은 상호작용 상태 이름
  (`-hover`/`-active`/`-disabled`)뿐이라 "바탕보다 한 단 올라온 면"을 표현할 수 없습니다.
  라이트에서는 팔레트 음영이 흰 바탕 위에서 충분히 읽히지만 다크에서는 거의 검정이라,
  툴바·표 헤더 등 몇 자리는 `:host-context()`로 보정합니다. **이 선택자는
  Firefox/Safari에서 동작하지 않습니다** — 해당 브라우저에서 그 면들이 배경에 묻힙니다.
  그 밖의 색은 전 브라우저에서 테마를 따릅니다.
- **경고(노랑) 표면에는 역할 토큰이 없습니다** — 라이트 황색 틴트가 거의 보이지 않아
  두 테마의 세기를 맞출 단 짝이 없습니다(업스트림 미해결). 필터 줄·편집 중 행은
  팔레트를 직접 읽습니다.

> `--u-txt-color-weak`의 WCAG AA 미달(2.68)은 `@iyulab/components` 1.15.0에서
> 해소됐습니다(4.61). 이 패키지가 쓰던 우회도 함께 제거됐습니다.

## License

MIT
