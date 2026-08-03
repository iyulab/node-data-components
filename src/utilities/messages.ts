import { Locale } from '@iyulab/components/dist/utilities/Locale.js';

/**
 * `@iyulab/data-components` 의 화면 문자열 — **영어 기본 + 로케일 레지스트리**.
 *
 * ## 왜 생겼나
 *
 * 표 컴포넌트의 기본 문구가 **한국어 리터럴**이었다(실측 7건). 소비자가 `emptyMessage` 등을
 * 넘겨 덮을 수는 있었지만, **덮지 않으면 한국어가 나온다** — 로케일 표준(영어 기본 +
 * 레지스트리)을 채택한 리포에서 그것은 미이주다.
 *
 * ## 기본값을 «비워» 두고 렌더에서 해석한다
 *
 * 프로퍼티 초기값으로 문자열을 박으면 **생성 시점의 로케일에 고정**된다 — `Locale.set()` 을
 * 나중에 부르면 이미 만들어진 표는 따라오지 않는다. 그래서 기본값은 빈 문자열이고,
 * 렌더가 `this.x || messages.text(...)` 로 해석한다.
 *
 * ⚠**소비자가 덮는 경로는 그대로다** — 값을 주면 그 값이 이긴다.
 *
 * ## 검증 메시지는 여기 두지 않는다
 *
 * `필수 항목입니다` 는 `@iyulab/components` 의 **검증 메시지 키셋에 이미 있고 14로케일이
 * 딸려 온다**(`Locale.getValue('valueMissing')`). 같은 문장을 이 표에 복제하면 두 곳이
 * 갈라진다.
 */
export type DataMessageKey =
  | 'empty' | 'loading' | 'filterPlaceholder' | 'filterAll' | 'addRow' | 'pageInfo'
  | 'noMatch';

export const messages = Locale.namespace<DataMessageKey>('@iyulab/data-components');

messages.register('en', {
  empty: 'No data',
  loading: 'Loading…',
  filterPlaceholder: 'Filter…',
  filterAll: 'All',
  addRow: '+ New row',
  pageInfo: 'Showing {start}-{end} of {total}',
  noMatch: 'No matching item',
});

messages.register('ko', {
  empty: '데이터가 없습니다',
  loading: '로딩 중...',
  filterPlaceholder: '필터...',
  filterAll: '전체',
  addRow: '+ 새 행',
  pageInfo: '전체 {total}건 중 {start}-{end} 표시',
  noMatch: '일치하는 항목 없음',
});
