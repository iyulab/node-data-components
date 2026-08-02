# Changelog

## [0.8.0] - 2026-08-02

### Changed

- **UDataView 가 역할 토큰만 읽는다.** 다크 전용 규칙 92줄을 제거하고, 팔레트 참조
  4곳을 역할 토큰으로 옮겼다(`--u-blue-600` → `--u-primary-color`, `--u-blue-200` →
  `--u-primary-color-weakest`). **두 테마의 계산색은 그대로다** — 브라우저에서
  변경 전후 계산값 스냅샷을 대조해 확인했다.

  제거한 다크 블록의 24개 선언은 전부 base 규칙과 **같은 토큰**을 가리키고 있었다.
  역할 토큰(`--u-bg-color`, `--u-border-color`, `--u-txt-color-weak` …)은 두 테마에서
  서로 다른 팔레트 단에 매핑돼 있어(예: `--u-bg-color` = neutral-0 라이트 /
  neutral-100 다크) 테마 보정이 이미 토큰 층에 들어 있다. 따라서 그 블록은 토큰 시트가
  로드된 환경에서 계산값을 하나도 바꾸지 못했다.

- **USimpleSheet 의 다크 블록을 24개 선언 → 6개로 줄였다.** 지운 것은 base 와 같은 토큰을
  가리켜 계산값을 바꾸지 못하던 규칙들이다. **남긴 6개는 죽은 규칙이 아니다** — 유채색
  표면(계산 셀·선택된 열 헤더·강조된 드롭다운 항목)이며, 역할 층에 유채색 표면 토큰이
  없어서 손으로 메운 보정이다. 비활성화하면 실제로 색이 달라짐을 확인했다.
- **USimpleSheet 그림자 2곳이 `--u-shadow-color-*` 를 읽는다.** 종전에는 라이트/다크가
  각각 하드코딩된 `rgba(0,0,0,0.15)` / `0.5` 였다. 역할 토큰은 테마별로 불투명도가
  튜닝돼 있다(0.16/0.45, 0.12/0.35) — 다크에서 그림자가 아주 조금 옅어진다.
- **USimpleSheet 읽기전용 셀이 `--u-bg-color-disabled` 를 읽는다.** 이 토큰의 테마별
  매핑(neutral-50 라이트 / neutral-100 다크)이 종전 다크 블록이 손으로 쓴 단과 **정확히
  같다** — 그래서 해당 다크 규칙이 불필요해졌다. 계산색은 두 테마 모두 그대로다.

### Fixed

- **URichTable 템플릿에 인라인으로 박혀 있던 색 3곳**(행 메뉴 `⋯`, 행 오류 줄, 새 행
  표시)을 클래스 + 역할 토큰으로 옮겼다. `style="…#94a3b8"` 형태라 **스타일 시트만
  훑는 정리에는 보이지 않는 자리**였다. 색이 조금 바뀐다 — 행 오류 줄 배경
  `#FEF2F2` → `#FFEBEE`, 행 메뉴 `#94A3B8` → `#9E9E9E`, 새 행 표시 `#86EFAC` →
  `#A5D6A7`. (이 셋은 계산색 스냅샷이 덮지 못한다 — 렌더 조건이 내부 상태다.)

- ★**URichTable 에서 `_id` 없는 행을 넘기면 한 행 선택이 전체 선택으로 번지던 문제.**
  선택·확장·행 오류 상태가 전부 `_id` 로 추적되는데 그 값을 **어디서도 부여하지 않아**,
  소비자가 넣지 않으면 모든 행이 `undefined` 로 같은 키를 갖게 됐다. 이제 `_id` 가 없으면
  **위치로 식별하고 개발 경고**를 낸다. 위치 기반 식별은 데이터가 재정렬·재페이징되면
  선택이 다른 행으로 옮겨가므로 안전망일 뿐이다 — 정렬·필터·페이지가 소비자 책임인
  컴포넌트이니 `_id` 를 주는 것이 옳다.

### Documentation

- **`docs/URichTable.md` 신설.** 종전에는 README 가 *"문서 작성 예정"* 이라며 `types.ts`
  를 가리키고 있었다. 타입만으로는 드러나지 않는 두 계약을 먼저 적었다 — ⑴ `data` 는
  그대로 렌더되며 **정렬·필터·페이지는 소비자 책임**이다(헤더 클릭은 이벤트만 낸다),
  ⑵ 각 행에 `_id` 가 필요하다. 속성·이벤트 9종·키보드/클립보드 표 포함.
- **README 의 Theming 절을 실제 동작에 맞게 고쳤다** — 토큰 시트가 필요하다는 것,
  없을 때의 폴백 규약, 브랜드 색 한 줄 변경, 그리고 알려진 제약 둘(AA 미달, Chromium
  한정 규칙)을 명시했다.

- **`--u-blue-50` 은 토큰 시트에 정의가 없다.** USimpleSheet 4곳(계산 셀·선택 셀·강조된
  드롭다운 항목)이 이 이름을 참조해 **두 테마 모두에서** 항상 리터럴 폴백으로 떨어지고
  있었다 — 즉 토큰 층과 무관하게 고정색이었다. 팔레트의 틴트 끝인 `--u-blue-0` 로
  고쳤다. **라이트에서 색이 바뀐다**: `#EFF6FF` → `#E3F2FD`. 다크는 종전과 동일하다.

- ★**URichTable 이 디자인 토큰을 읽기 시작한다 — 라이트 재도색.** 이 컴포넌트는 base
  레이어가 토큰을 **하나도** 쓰지 않고 고정 hex 를 박아 두었다. 즉 라이트에서 테마·브랜드
  설정에 전혀 반응하지 않았고, 다크는 그 위에 얹은 별도 재구현(57개 선언)이었다.
  base 를 역할 토큰으로 옮기면서 다크 블록은 **2개 규칙**만 남았다.

  **라이트에서 색이 바뀐다** — 주요 항목:

  | 자리 | 전 | 후 |
  |---|---|---|
  | 테두리 | `#E2E8F0` | `#E0E0E0` (`--u-border-color`) |
  | 입력 테두리 | `#D1D5DB` | `#E0E0E0` (`--u-input-border-color`) |
  | 툴바·페이지네이션 배경 | `#F8FAFC` | `#FAFAFA` |
  | 헤더 배경 | `#F1F5F9` | `#F5F5F5` |
  | 주 버튼 | `#3B82F6` | `#1E88E5` (`--u-primary-color`) |
  | 성공 버튼 | `#10B981` | `#43A047` (`--u-success-color`) |
  | 선택된 행 | `#EFF6FF` | `#E3F2FD` |
  | 편집·필터 행 | `#FEFCE8` | `#FFFDE7` |
  | 오류 행 | `#FEF2F2` | `#FFEBEE` |
  | 새 행 | `#F0FDF4` | `#E8F5E9` |

  ⇒ 이제 `:root { --u-primary-color: … }` 한 줄로 이 표의 버튼·강조색이 따라온다.

  **다크에서는 성공 버튼만 바뀐다**(green-500 → `--u-success-color`). 나머지가 종전
  값 그대로임을 계산색 스냅샷으로 확인했다 — 두 테마 × 14개 선택자(상태 틴트 포함:
  선택된 행·필터 줄·새 행). 스냅샷이 덮지 못한 자리는 `tbody tr.error`(내부 상태 필요)
  와 `.dropdown-item.highlighted` 두 곳이다.

  ⚠**`:host` 가 이제 글자색을 정한다.** 종전에는 base 에 `color` 선언이 없어 페이지에서
  **상속**받았고, 다크 블록만 그것을 덮었다. 이제 base 가 `--u-txt-color` 를 읽는다.
  토큰 시트를 쓰는 환경에서는 개선이지만, 시트 없이 페이지 글자색을 직접 지정하던
  소비자는 그 상속을 잃는다 — 필요하면 `--u-txt-color` 를 지정하세요.

  ⚠**Firefox/Safari 에서 다크가 동작하기 시작한다.** 종전에는 다크가 전부
  `:host-context()` 안에 있었고 그 선택자는 Chromium 전용이라, 다른 브라우저에서는
  **다크 모드가 아예 적용되지 않았다.** 이제 색의 대부분이 토큰 층에서 테마를 따르므로
  전 브라우저에서 동작한다. 남은 2개 규칙(표면 높이·보조 텍스트)만 Chromium 한정으로
  남는다.

### Removed

- **UDataView 의 `theme` 속성이 더 이상 색을 바꾸지 않는다.**
  토큰 시트를 로드한 환경에서는 원래부터 효과가 없었다(위 참조). 시트를 로드하지 않는
  환경에서는 요소에 `theme="dark"` 를 걸면 다크 고정값이 적용됐으나, 이제는 적용되지
  않는다 — 토큰 미공급 시 폴백은 라이트 기준 고정값이라는 규약을 따른다.
  **다크가 필요하면 토큰 시트를 로드할 것**(`@iyulab/components/styles/tokens.css`).
  문서 단위 다크(`<html theme="dark">`)는 종전과 동일하게 동작한다.

### Added

- 브라우저 테스트 프로젝트(playwright chromium). 계산색을 실제로 측정한다 —
  기존 유닛 테스트는 스타일 **문자열**에서 셀렉터를 세므로, 규칙이 적혀 있음은 보여도
  그 규칙이 무언가를 바꾸는지는 말하지 못한다. 위 24개 선언이 정확히 그 사각에 있었다.
  - `data-view-colors.browser.test.ts` — 두 테마 계산색 스냅샷 회귀망
  - `theme-resolution.browser.test.ts` — 역할 토큰의 테마별 매핑, 팔레트 틴트 비대칭

### Known issues

- **유채색에는 테마 보정 층이 없다.** 역할 토큰의 중립 계열 17종은 두 테마에서 다른
  팔레트 단에 매핑되지만, `--u-primary/success/danger/warning-*` 는 양 테마가 같은 단을
  가리킨다. 그런데 팔레트의 틴트 세기는 계열마다 비대칭이다 — 바탕 대비 델타 실측:
  중립은 다크가 라이트의 1.34~1.62배, 청색은 0.38~0.54배, 적색은 0.25~0.58배,
  황색은 4.2~6.1배. 그래서 유채색 표면을 쓰는 컴포넌트는 다크 보정을 손으로 써야 한다.
- **"주색 위의 글자" 역할 토큰이 없다.** 활성 뷰 버튼은 다크에서 대비 3.45 이며
  흰 글자였다면 6.09 다. 팔레트를 직접 바꾸면 게시된 시각이 움직이므로 보류했다.
- **UI 문자열이 한국어로 하드코딩돼 있다** — `URichTable` 의 `로딩 중...`·`필터...`·
  `전체`·`전체 N건 중 X-Y 표시`, `USimpleSheet` 의 `일치하는 항목 없음`. `emptyMessage`
  만 프로퍼티로 열려 있고 나머지는 소비자가 바꿀 수 없다. 이 패키지에는 로케일 레이어가
  없어 단순 프로퍼티 추가로 갈지 로케일 레지스트리를 도입할지가 설계 결정이다.
- ★**`--u-txt-color-weak` 의 라이트 매핑이 WCAG AA 에 미달한다** — neutral-500(#9E9E9E)
  = 흰 배경 대비 **2.68**(AA 기준 4.5). 다크는 neutral-700 = **5.43** 으로 정상이므로
  **라이트 한쪽만의 결함**이다. 그래서 URichTable 의 보조 텍스트 4곳은 역할 토큰으로
  옮기지 못했다(옮기면 4.76 → 2.68 로 후퇴). 업스트림에서 라이트 매핑을
  **neutral-600(4.61)** 으로 한 단 내리면 해소된다.

## [0.7.1] - 2026-08-01

### Documentation

- 체인지로그와 마이그레이션 가이드에서 **발견 정황 서술을 제거**했다. 결함이 무엇이고 어떤
  조건에서 재현되는지는 그대로이며, 라이브러리와 무관한 서술만 걷어냈다.
  코드 변경은 없다 — 게시본 문서를 정리하기 위한 패치 릴리스다.

## [0.7.0] - 2026-07-19

### Changed
- **이 패키지의 eslint 가 실제로 동작하기 시작했다.** `eslint.config.js` 의 두 결함 — (1) `files: ['src/**/*']` 가 ESLint 9 에서 universal 패턴이라 `.ts` 를 opt-in 하지 못함, (2) 배열 프리셋(`tseslint.configs.recommended`)을 객체 스프레드해 프리셋이 무력화됨 — 을 수정했다. `build` 스크립트의 `eslint &&` 게이트는 매칭 파일이 0개라 항상 통과하고 있었다. 복구 후 실측 결과 **error 0건** — 이 패키지의 소스는 이미 깨끗했다.
- `npm run lint` / `npm run lint:fix` 스크립트 추가.
- **`UDataView` 의 열린 타입 의도를 명시** — `items`/`renderCard`/`renderCell` 등에 흩어져 있던 `any` 8곳을 새 `DataItem`(`Record<string, any>`) 타입 한 곳으로 격리했다. 이 컴포넌트는 소비자 도메인 타입을 제한하지 않는 범용 뷰어이므로 열린 타입이 설계 의도이며, 이제 그 의도가 코드에 표현된다. `formatValue` 는 `unknown` 으로 좁혔다. 원시값 배열(`[1, 2, 3]`)을 `items` 로 넘기던 코드는 이제 타입 오류가 날 수 있다.

## [0.6.1] - 2026-07-08

### Fixed
- `UDataView`: fallback 이 없던 `var(--u-*)` 참조 24개에 컨텍스트별 fallback 을 부여 — `@iyulab/components` 테마 토큰이 정의되지 않은 환경에서 색상이 비어 렌더되던 문제.

## [0.6.0] - 2026-06-11

### Added
- `USimpleSheet`: `theme` 속성 1급 지원 (`'light' | 'dark'`, attribute 리플렉트) — per-element 테마 지정 가능, `:host-context` 미지원 브라우저(Firefox/Safari)에서도 동작
- `USimpleSheet`: 조상 `data-theme="dark"` 컨텍스트에서도 다크 모드 적용 — Theme 유틸 없이 `data-theme`만 설정하는 앱에서 도구별 다크 적용이 비일관하던 문제 해소

### Changed
- 다크 모드 CSS를 단일 소스에서 3가지 컨텍스트(`:host([theme="dark"])` / `:host-context([theme="dark"])` / `:host-context([data-theme="dark"])`) 개별 규칙으로 생성 — 셀렉터 리스트 결합 시 `:host-context` 미지원 브라우저가 리스트 전체를 무효화하는 문제 회피

## [0.5.0] - 2026-06-10

### Added
- React 일급 래퍼 서브패스 `@iyulab/data-components/react` (`@lit/react` createComponent 기반)
  - `USimpleSheetReact` / `UDataViewReact` / `URichTableReact`
  - rich property를 JSX props로 직접 전달, 커스텀 이벤트는 타입드 `onXxx` props로 노출
    (USimpleSheet `onChange`, URichTable은 `RichTableEventMap` 9종 전부)
  - `@lit/react`, `react`는 optional peerDependency — React 미사용 소비자에 영향 없음
- README에 React 사용법 및 TypeScript 직접 사용(HTMLElementTagNameMap) 안내 추가

### Fixed
- `sideEffects`가 dist 경로만 나열해 빌드 시 `shadowDomProtection` 자동 초기화 import가
  번들에서 제거되던 문제 수정 (src 경로 추가) — 0.4.x 배포본에서 Shadow DOM 스타일 보호가
  실제로 동작하지 않던 잠재 결함

## [0.4.1] - 2026-05-07

### Fixed
- eslint.config.js에서 제거된 React 플러그인 참조 삭제 (eslint-plugin-react-hooks, eslint-plugin-react-refresh)

## [0.4.0] - 2026-05-07

### BREAKING CHANGES
- `UDataGrid` 컴포넌트 제거 — DevExtreme 상용 라이선스 의존성 해소
  - `src/components/data-grid/UDataGrid.tsx`, `UDataGrid.types.ts` 삭제
  - `src/utilities/devExtremeCssInjection.ts`, `src/styles/devextreme-overrides.css` 삭제
  - `exports['./data-grid']` 제거
  - `dependencies`에서 `devextreme`, `devextreme-react`, `react`, `react-dom` 제거

### Migration
UDataGrid 대체: `@iyulab/flex-table` + `@iyulab/flex-table/odata` 조합 사용
→ [마이그레이션 가이드](./docs/migrating-from-datagrid.md)

## [0.3.2] - 2026-05-07

### Added
- `docs/migrating-from-datagrid.md`: UDataGrid(DevExtreme)에서 `@iyulab/flex-table`로 전환하는 마이그레이션 가이드 추가 (리스트 페이지 9개 전환 실증 기반)
- README에 UDataGrid 대안 섹션 및 마이그레이션 가이드 링크 추가
- `docs/UDataGrid.md` 상단에 마이그레이션 가이드 링크 추가

## [0.3.1] - 2026-04-01
### Changed
- 컴포넌트 파일 구조 리팩토링: `.component.ts` 파일을 기존 `.ts`로 병합 (UDataView, USimpleSheet, URichTable)
- UDataView: 다크모드 하드코딩 스타일 제거 — CSS 변수 기반으로 전환
- 의존성 업데이트: devextreme 25.2.5, vite 8.0.3, typescript-eslint 8.57.2 등

## [0.3.0] - 2026-03-26
### Added
- URichTable: 코어 컴포넌트 추가 — 렌더링, 정렬, 필터, 편집, 페이지네이션
- URichTable: 엑셀 스타일 클립보드(복사/붙여넣기) + 키보드 네비게이션
- URichTable: 다크모드 지원 (`:host-context([theme="dark"])`)
- USimpleSheet: `setSelection()`, `selectAll()` 공개 API 추가

## [0.1.8] - 2026-03-08
### Added
- USimpleSheet: `format` 속성 — Intl.NumberFormatOptions(통화, 퍼센트 등) 또는 콜백 함수로 표시 포맷 지정
- USimpleSheet: 셀 값 기반 자동 텍스트 정렬 (숫자 우측, 문자 좌측)

## [0.1.7] - 2026-03-08
### Added
- USimpleSheet: `compute` 콜백을 통한 열 단위 자동 계산 기능
  - 가로(같은 행) 및 세로(행 간) 계산 모두 지원
  - compute 열 자동 readonly 및 시각적 구분 (이탤릭 + 파란 배경)
  - 에러 발생 시 빈 문자열 표시
  - 붙여넣기/Fill 시 compute 열 건너뛰기

## [0.1.6] - 2026-03-08
### Added
- USimpleSheet: 드롭다운 셀렉터 기능 (`options`/`strict` 속성)
  - 드롭다운 상태 관리, 필터링, 키보드 네비게이션
  - 다크모드 지원
### Fixed
- USimpleSheet: 문자 입력 시 이중 입력 방지 (`preventDefault` 추가)
- USimpleSheet: strict 모드에서 `_isDropdownClick` 리셋 및 안전한 스크롤 처리

## [0.1.4] - 2026-03-07
### Changed
- UDataView, USimpleSheet: 다크모드 스타일 업데이트

## [0.1.3] - 2026-03-07
### Fixed
- Vite 빌드에 컴포넌트 엔트리 포인트 추가 (sub-path exports 수정)

## [0.1.2] - 2026-03-07
### Added
- 컴포넌트별 독립 임포트를 위한 sub-path exports 추가

## [0.1.1] - 2026-03-06
### Changed
- 재배포를 위한 버전 범프

## [0.1.0] - 2026-03-06
- 초기 라이브러리 릴리스
