import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

/**
 * **소비자 조절점 — 보조 전경 5단**이 실제로 배선돼 있는가.
 *
 * ## 왜 이 파일이 생겼나
 *
 * 이 패키지의 표 셋(`UDataView`·`USimpleSheet`·`u-rich-table`)은 보조 전경을 전부
 * `var(--u-txt-color-weak, …)` 로 **섀도 안에서 직독**하고 있었다 — 소비자 토큰 0건 ·
 * `part` 0건. 소비앱은 한 제품 안에 표를 넷 두는데, 그중 업스트림 표만 조절되지 않으면
 * **나머지에 맞출 수가 없다.**
 *
 * ## ⚠ 이 테스트가 「존재」가 아니라 「배선」을 재는 이유
 *
 * 같은 런에서 세 번 봤다 — 토큰을 만들어 두고 **아무도 읽지 않는** 상태(모션 축),
 * 계약을 걸어 두고 **효력이 없는** 상태(`:where()` 프리셋), 축을 열어 두고 **도달이 0** 인
 * 상태(타이포). 셋 다 *"있다"* 를 묻는 단언은 통과하고 있었다.
 */

const root = resolve(__dirname, '..');

/**
 * ⚠**컴포넌트마다 «읽는 단»이 다르다.** 셋 다 다섯을 선언하게 하면 소비자가 바꿔도
 * 아무 일이 없는 자리가 생긴다 — 이 파일이 경계하는 바로 그것이다.
 * (첫 판이 다섯을 전부 선언하게 했다가 ⑵ 에 **스스로 걸렸다**.)
 */
const USED: Record<string, string[]> = {
  'src/components/data-view/UDataView.styles.ts': ['muted', 'header', 'empty'],
  'src/components/simple-sheet/USimpleSheet.styles.ts': ['header', 'empty', 'readonly'],
  'src/components/u-rich-table/styles.ts': ['muted', 'icon', 'empty'],
};

const ALL = ['empty', 'header', 'muted', 'icon', 'readonly'];
const tok = (r: string) => `--dc-${r}-color`;

/** CSS·JS 주석을 걷어낸다 — 주석 속 토큰 이름은 설명이지 배선이 아니다. */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const sources = Object.keys(USED).map(f => ({
  file: f,
  src: strip(readFileSync(join(root, f), 'utf-8')),
}));

describe('소비자 조절점 — 보조 전경 5단', () => {
  it('⑴ 각 컴포넌트가 자기 단을 :host 에 선언한다', () => {
    const missing: string[] = [];
    for (const { file, src } of sources)
      for (const r of USED[file])
        if (!new RegExp(`${tok(r)}\\s*:`).test(src)) missing.push(`${file}: ${tok(r)}`);
    expect(missing, '선언이 없으면 그 컴포넌트에서는 조절점이 존재하지 않는다').toEqual([]);
  });

  it('⑴-b 다섯 단이 패키지 전체로는 전부 열려 있다', () => {
    expect([...new Set(Object.values(USED).flat())].sort()).toEqual([...ALL].sort());
  });

  it('🔴⑵ 선언과 사용이 어긋나지 않는다', () => {
    // 이 단언이 이 파일의 존재 이유다. 양방향으로 잰다 —
    // 선언만 하면 소비자가 바꿔도 아무 일이 없고, 선언 없이 읽으면 폴백조차 없어 색이 사라진다.
    const bad: string[] = [];
    for (const { file, src } of sources) {
      for (const r of USED[file])
        if (!src.includes(`var(${tok(r)})`)) bad.push(`${file}: ${tok(r)} 선언만 있고 안 읽힌다`);
      for (const m of src.matchAll(/var\((--dc-[\w-]+)\)/g))
        if (!new RegExp(`${m[1]}\\s*:`).test(src)) bad.push(`${file}: ${m[1]} 읽는데 선언이 없다`);
    }
    expect(bad, '선언과 사용이 어긋난다').toEqual([]);
  });

  it('🔴⑶ 직독이 남아 있지 않다 — 우회 경로가 있으면 조절점이 반쪽이다', () => {
    // ⚠**파생 선언 자체는 직독이 아니다** — `--dc-x: var(--u-txt-color-weak, …)` 가
    // 이 배선의 «출발점»이다. 첫 판이 그 15줄에 발화했다: 정당한 것에 발화하는 쪽의 실패.
    const direct = sources.flatMap(({ file, src }) =>
      src
        .split('\n')
        .filter(l => /var\(--u-txt-color-weak/.test(l) && !/--dc-[\w-]+\s*:/.test(l))
        .map(l => `${file}: ${l.trim()}`),
    );
    expect(direct, '섀도 안에서 역할 토큰을 직독하면 소비자가 그 자리를 조절할 수 없다').toEqual([]);
  });

  it('⚠값 변경 0 — 모든 단이 같은 역할 토큰에서 파생된다', () => {
    // 이 릴리스는 **조절점만** 연다. 단을 옮기는 것은 별개 결정이고, 그때는 소비앱 실측이
    // 먼저다(`dark-secondary-text-on-raised` A안이 위계비 근거로 철회됐다).
    const bad: string[] = [];
    for (const { file, src } of sources)
      for (const r of USED[file]) {
        const m = src.match(new RegExp(`${tok(r)}\\s*:\\s*([^;]+);`));
        if (m && !m[1].includes('--u-txt-color-weak')) bad.push(`${file}: ${tok(r)} = ${m[1].trim()}`);
      }
    expect(bad, '값이 바뀌면 이 릴리스는 더 이상 "값 변경 0" 이 아니다').toEqual([]);
  });

  it('⚠다크 블록에 다시 선언하지 않는다 (이 패키지의 다크는 비어 있는 것이 목표 상태다)', () => {
    // --u-txt-color-weak 자체가 테마 변형이므로 시트가 있으면 따라온다. 다크 전용 선언을
    // 더하면 57선언을 역할 토큰으로 없앤 작업을 되돌리게 된다.
    const DARK =
      /(:host-context\([^)]*dark[^)]*\)|:host\(\[theme=["']dark["']\]\)|@media[^{]*prefers-color-scheme\s*:\s*dark)([\s\S]*?)\n\s*\}/g;
    const bad: string[] = [];
    for (const { file, src } of sources)
      for (const m of src.matchAll(DARK))
        for (const r of ALL) if (m[2].includes(`${tok(r)}:`)) bad.push(`${file}: ${tok(r)}`);
    expect(bad).toEqual([]);
  });
});

/**
 * **소비자 조절점 — 밀도·타이포**(`USimpleSheet`).
 *
 * ⚠여기서는 «배선»만 잰다. 실제로 소비자 선언이 섀도의 `:host` 리터럴을 이기는지는
 * 계산값 문제라 `tests/browser/simple-sheet-density.browser.test.ts` 가 잰다 —
 * 이 파일이 색 축에서 세운 원칙(*"있다 ≠ 닿는다"*)을 치수 축에도 그대로 적용한 것이다.
 */
const DIMENSION: Record<string, string[]> = {
  'src/components/simple-sheet/USimpleSheet.styles.ts': [
    '--dc-row-height',
    '--dc-cell-padding-block',
    '--dc-cell-padding-inline',
    '--dc-font-size',
    '--dc-header-font-size',
    '--dc-header-font-weight',
  ],
};

describe('소비자 조절점 — 밀도·타이포', () => {
  it('🔴선언과 사용이 어긋나지 않는다 (양방향)', () => {
    const bad: string[] = [];
    for (const [file, names] of Object.entries(DIMENSION)) {
      const src = strip(readFileSync(join(root, file), 'utf-8'));
      for (const n of names) {
        if (!new RegExp(`${n}\\s*:`).test(src)) bad.push(`${file}: ${n} 선언이 없다`);
        if (!src.includes(`var(${n})`)) bad.push(`${file}: ${n} 선언만 있고 안 읽힌다`);
      }
    }
    expect(bad, '선언과 사용이 어긋난다').toEqual([]);
  });

  it('⚠치수 축은 역할 토큰에서 파생하지 않는다 — 유일한 예외는 --dc-font-size ↔ --u-density', () => {
    // 색 축은 `var(--u-txt-color-weak, …)` 파생이 «출발점»이지만, 치수는 대응하는 역할
    // 토큰이 존재하지 않는다. 없는 토큰을 참조하면 폴백 리터럴만 남아 조절점이 두 겹이 된다.
    //
    // ★단 --dc-font-size 는 예외다 — components/flex-table 이 이미 읽는 --u-density 밀도
    // 스위치를 폴백 원본으로 가져, 컨트롤·표·시트가 한 벌로 움직인다(회귀:
    // simple-sheet-density.browser.test.ts). 역할 토큰이 아니라 그 스위치 자체를
    // 참조하므로 위 문단의 "역할 층에 치수 축이 없다"는 여전히 참이다 — 파생 원천이
    // 역할 토큰이 아니라 컴포넌트 층 앰비언트 스위치라는 점이 다르다.
    const src = strip(
      readFileSync(join(root, 'src/components/simple-sheet/USimpleSheet.styles.ts'), 'utf-8'),
    );
    const ALLOWED_DERIVED = ['--dc-font-size'];
    const derived = DIMENSION['src/components/simple-sheet/USimpleSheet.styles.ts'].filter(n =>
      new RegExp(`${n}\\s*:[^;]*var\\(`).test(src),
    );
    expect(derived).toEqual(ALLOWED_DERIVED);
    // 그 예외가 정확히 --u-density 를 가리키는지까지 못박는다 — 다른 var() 로 슬쩍
    // 바뀌어도 이 단언은 위에서 이미 통과했을 것이므로 근원을 별도로 확인한다.
    expect(new RegExp('--dc-font-size\\s*:\\s*var\\(--u-density,').test(src)).toBe(true);
  });
});
