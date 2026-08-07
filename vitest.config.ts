import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// 테스트 전용 설정. `vite.config.ts` 의 빌드 플러그인(`vite-plugin-dts`)을 로드하지
// 않도록 분리한다 — 테스트 실행이 `dist/` 를 건드리는 부작용을 막기 위함이다.
// (components·modern-app 가 같은 이유로 같은 구조를 쓴다.)
//
// - unit:    기존 tests/**/*.test.ts. 파일 상단의 `// @vitest-environment happy-dom`
//            docblock 이 그대로 유효하다.
// - browser: **소스 대조로는 절대 알 수 없는 것**을 측정한다.
//
// ⚠browser 프로젝트가 왜 필요했는가: 기존 유닛 테스트는 스타일 시트를 **문자열로**
// 훑어 셀렉터가 몇 번 나오는지 센다. 그것은 규칙이 *적혀 있음* 을 증명할 뿐,
// 그 규칙이 *무언가를 바꾼다* 는 것은 증명하지 못한다. 실제로 이 패키지의 다크 규칙
// 상당수는 base 규칙과 **같은 토큰**을 가리키고 있어서, 토큰 시트가 로드된 환경에서는
// 계산값이 완전히 동일하다 — 문자열 테스트는 그것을 전부 통과시킨다.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/browser/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            // 고정 포트 이유는 packages/components/vitest.config.ts 참조 —
            // 이 머신의 Windows 동적 포트 제외 범위와 vitest 기본 포트가
            // 충돌해 EACCES 로 실패하던 것을 실측으로 확인했다.
            api: { host: '127.0.0.1', port: 41502 },
          },
          isolate: true,
        },
      },
    ],
  },
});
