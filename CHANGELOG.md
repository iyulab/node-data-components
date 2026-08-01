# Changelog

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
