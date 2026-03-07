# Changelog

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

## [0.1.6]
- Initial library version release