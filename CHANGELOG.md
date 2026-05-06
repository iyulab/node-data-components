# Changelog

## [0.3.2] - 2026-05-07

### Added
- `docs/migrating-from-datagrid.md`: UDataGrid(DevExtreme)에서 `@iyulab/flex-table`로 전환하는 마이그레이션 가이드 추가 (yesung-oms 9개 페이지 실증 기반)
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
