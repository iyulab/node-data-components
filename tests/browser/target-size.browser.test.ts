import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

/**
 * **WCAG 2.2 SC 2.5.8 Target Size (Minimum) — 24×24 CSS px** 게이트.
 *
 * `@iyulab/components` 의 같은 이름 파일(cycle-479~492)에서 `chat-components`(cycle-496)를
 * 거쳐 이식했다. 판정 규칙·간격 예외 모델링·형제 태그 걸러내기는 **같은 형태**이고, 다른 것은
 * 이 패키지의 구성뿐이다. 근거는 `components` 쪽 파일 머리말이 정본이므로 되풀이하지 않는다.
 *
 * ## ⚠ 이 패키지의 타깃은 «격자 안»에 있다
 *
 * 네 컴포넌트 중 둘은 데이터 격자(`u-rich-table`·`u-simple-sheet`)이고, 재야 할 것은 정렬
 * 헤더·선택 체크박스·셀처럼 **서로 붙어 있는** 타깃이다. 나머지 둘은 조작부를 형제
 * `u-button` 으로 놓을 뿐이라 대상이 아니다.
 */

const MIN = 24;

interface Measured {
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function measure(el: Element): Measured {
  const r = el.getBoundingClientRect();
  return { w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

/** SC 2.5.8 «간격 예외» — 중심 간 거리가 24px 이상이면 24px 원이 겹치지 않는다. */
function spacingSatisfied(target: Measured, others: Measured[]): boolean {
  return others.every((o) => Math.hypot(target.cx - o.cx, target.cy - o.cy) >= MIN);
}

type Verdict = 'meets-size' | 'exempt-by-spacing' | 'undersized';

function judge(target: Measured, others: Measured[]): Verdict {
  if (target.w >= MIN && target.h >= MIN) return 'meets-size';
  return spacingSatisfied(target, others) ? 'exempt-by-spacing' : 'undersized';
}

/**
 * 섀도 DOM 안쪽에서 셀렉터로 고른다.
 *
 * ⚠`components` 쪽 게이트는 `part` 로 고르는 헬퍼를 따로 두지만 **여기서는 쓰지 않는다** —
 * 이 패키지의 타깃은 대부분 `part` 가 붙지 않은 내부 컨트롤(`button.nav-button` ·
 * `a.caption` · `th`)이라 셀렉터 하나로 충분하다. 쓰지 않는 헬퍼를 «나중에 쓸지도»로
 * 남겨 두면 그것이 곧 고아 코드다.
 */
function inShadow(host: Element, sel: string): Element[] {
  const root = (host as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
  return root ? Array.from(root.querySelectorAll(sel)) : [];
}

/**
 * 🔴**체크박스·라디오의 포인터 타깃은 입력 자체가 아니라 «활성화 라벨»이다.** 라벨을 누르면
 * 토글되므로 SC 2.5.8 이 재는 「포인터 동작을 받는 영역」은 라벨 전체다(네이티브 입력은
 * 13×13 이지만 라벨은 그보다 크게 만들 수 있다 — 입력에 치수를 주면 브라우저가 체크 글리프를
 * 함께 키워 시각이 바뀐다).
 *
 * ⚠**규칙이라 손으로 쓴다** — 어떤 라벨이 «활성화»하는지는 도출이 아니라 우리 지식이다.
 * ⚠**체크박스·라디오에만** 적용한다: 텍스트 입력의 라벨까지 넓히면 정당한 미달을 숨기는
 * 쪽으로만 작용한다. `u-widgets` 게이트(cycle-493)가 같은 규칙을 같은 이유로 쓴다.
 */
function resolveTarget(el: Element): Element {
  const input = el as HTMLInputElement;
  const usesLabel = el.tagName === 'INPUT' && (input.type === 'checkbox' || input.type === 'radio');
  return (usesLabel && input.labels?.[0]) || el;
}

// ---------------------------------------------------------------------------
// 규칙 — 손으로 쓴다 (도출할 수 없는 우리 지식)
// ---------------------------------------------------------------------------

/**
 * 포인터 타깃이 아닌 것 — 대화 스트림에 그려지는 **표시물**과 레이아웃 컨테이너.
 * 사용자가 «활성화»하는 영역이 아니므로 자를 대면 정당한 블록 전건에 발화한다.
 */
const NOT_A_TARGET = new Set<string>([
  // 🔴**타깃이 «형제 컴포넌트»인 것 — 그 크기는 `@iyulab/components` 의 계약이다.**
  //   `u-data-view` 는 모드 전환 `u-button` 들을 «놓을» 뿐 치수를 정하지 않는다. 여기서 또 재면
  //   판정이 두 곳으로 갈려 드리프트하고, 우리가 고칠 수 없는 미달이 이 스위트를 빨갛게 만든다.
  //   🔴(cycle-549 정정) `u-record-picker` 는 여기 있었으나 **틀렸다** — 입력칸·지우기(cycle-537 이 역할·
  //   핸들러를 준 우리 타깃)·대화상자 검색칸을 스스로 가진다. `FIXTURES` 로 옮겼다.
  'u-data-view',
]);

/**
 * 타깃을 «갖고 있지만» 아직 대표 픽스처를 쓰지 않은 것.
 * ⚠**이 목록은 「통과」가 아니라 「미판정」이다.**
 */
const NEEDS_FIXTURE = new Set<string>([]);

/**
 * 🔴**측정 결과 미달인데 «치수를 올리는 것이 시각적 공개 계약 변경»이라 사람 판단이 필요한 것.**
 * 여기 있는 동안 이 파일은 그것을 **미달로 단언**하므로 스위트는 초록이고, 치수를 올리면
 * 빨개진다 — 그때 이 집합에서 빼는 것이 완료 신호다.
 */
const UNDERSIZED_PINS = new Set<string>([]);

/**
 * 🔴**SC 2.5.8 「인라인」 예외** — *"타깃이 문장 안에 있거나, 그 크기가 타깃 아닌 텍스트의
 * `line-height` 에 의해 제약되는 경우"* 는 규격이 명시적으로 면제한다.
 *
 * `u-ref-tag` 는 답변 본문 **문장 안에** 삽입되는 인용 배지다(마크다운 렌더가 `ref` 자리
 * 표시자를 이 태그로 바꾼다). 실측 **10×15** 인데, 이것을 24px 로 키우면 ***줄 높이를 밀어
 * 본문 조판이 깨진다*** — 규격이 이 예외를 둔 이유가 정확히 그것이다.
 *
 * ⚠**면제는 이름으로 좁게 준다** — 「인라인처럼 보이는 것」을 자동 판정하려면 문맥을 읽어야
 * 하고, 넓은 면제는 조용한 미탐이 된다(`u-widgets` 게이트가 같은 규칙을 같은 이유로 쓴다).
 * ⚠**면제해도 재기는 한다** — 픽스처를 유지하므로 실측값이 테스트 이름과 함께 보고된다.
 */
const INLINE_PROSE = new Set<string>([]);

interface Fixture {
  html: string;
  /**
   * 🔴**상태 이름** — 한 태그가 «열린 상태에서만 렌더되는 타깃» 을 가지면 상태마다 픽스처를 둔다
   * (`FIXTURES` 값이 배열). `components`·`chat-components` 게이트와 같은 형태다(§D-56·57).
   */
  state?: string;
  /**
   * 재기 전에 **사용자 경로로** 상태를 연다(더블클릭·입력 등). 여는 데 실패하면 **던진다** —
   * 닫힌 채 숨은 타깃을 재고 초록이 되는 것이 이 부류의 조용한 미탐이다.
   */
  prepare?: (host: Element) => Promise<void>;
  /** 이 픽스처 안의 «타깃»들. 생략하면 태그 자신. */
  targets?: (tag: string) => Element[];
  /**
   * 🔴**이 컴포넌트가 «타깃들 사이의 간격»을 스스로 소유하는가.** 기본값은 «간격 예외를
   * 쓰지 않는다»(크기로만 판정) — 고립 픽스처에 예외를 적용하면 무엇이든 통과한다.
   */
  spacingIsOurs?: true;
  /** 렌더가 비동기인 블록(마크다운 파싱·이미지 로드 등)을 위한 추가 대기(ms). */
  settle?: number;
}

/** 실제로 재는 것 — 대표 픽스처와 그 안의 타깃. 상태가 여럿이면 배열. */
const FIXTURES: Record<string, Fixture | Fixture[]> = {
  'u-rich-table': {
    // ⚠`addable`·`selectable` 을 켜야 «추가» 버튼과 선택 체크박스가 렌더된다 — 끄면 그
    //   타깃들이 아예 없고, 그것을 «통과»로 읽으면 미탐이다(cycle-485~486 의 함정).
    html: `<u-rich-table addable selectable style="width:520px"
      columns='[{"key":"a","label":"A","sortable":true},{"key":"b","label":"B"}]'
      data='[{"a":"1","b":"2"},{"a":"3","b":"4"}]'></u-rich-table>`,
    targets: () => {
      const t = document.querySelector('u-rich-table')!;
      return [
        ...inShadow(t, 'button.btn'),
        ...inShadow(t, 'th'),
        ...inShadow(t, 'input[type=checkbox]'),
      ];
    },
    settle: 200,
  },
  'u-simple-sheet': [
    {
      state: '기본',
      // 시트의 셀·헤더는 서로 **붙어 있어** 크기로만 재면 정당한 격자에 발화한다 ⇒ 간격
      // 예외를 켠다(그 예외가 실제로 일하는 자리다 — cycle-496 이 세운 기준).
      html: `<u-simple-sheet style="width:420px" rows="3"
        data='[["1","2"],["3","4"]]'></u-simple-sheet>`,
      targets: () => {
        const sheet = document.querySelector('u-simple-sheet')!;
        return [...inShadow(sheet, 'th'), ...inShadow(sheet, 'td')];
      },
      spacingIsOurs: true,
      settle: 200,
    },
    {
      state: '드롭다운',
      // `options` 가 있는 열의 셀을 편집(더블클릭)하면 셀 아래에 선택 목록(`.dropdown-item` — 자체 `mousedown`)이 뜬다.
      // ⚠편집 시작 값으로 옵션을 **거른다**(`_startEdit` → `_filterOptions`) — 셀이 비어 있어야 옵션 전부가 보인다.
      // ⚠`columns` 는 속성이 아니라 **프로퍼티**로 준다 — 함수형 `options` 도 받는 자리라 JSON 속성에 기대지 않는다.
      // 항목은 편집 중에만 렌더된다 ⇒ «항목이 나타날 때까지» 가 열림 신호다 — 안 나타나면 던진다.
      // 목록은 이 컴포넌트가 배치하지만 항목끼리는 붙어 있지 않다 — 크기로만 판정한다.
      html: `<u-simple-sheet style="width:420px" rows="3"
        data='[["","x"],["","y"]]'></u-simple-sheet>`,
      prepare: async (host) => {
        const sheet = host as HTMLElement & { columns: unknown; updateComplete: Promise<boolean> };
        sheet.columns = [{ options: ['Apple', 'Banana', 'Cherry'] }, {}];
        await sheet.updateComplete;
        const cell = sheet.shadowRoot!.querySelector('td[data-row="0"][data-col="0"]') as HTMLElement | null;
        if (!cell) throw new Error('편집할 셀(0,0)을 찾지 못했다');
        cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
        for (let i = 0; i < 50 && inShadow(sheet, '.dropdown-item').length === 0; i++) {
          await new Promise((r) => setTimeout(r, 20));
        }
        if (inShadow(sheet, '.dropdown-item').length === 0) throw new Error('셀 편집 드롭다운이 열리지 않았다 — 닫힌 채 재면 미탐이다');
      },
      targets: () => inShadow(document.querySelector('u-simple-sheet')!, '.dropdown-item'),
      settle: 200,
    },
  ],
  'u-record-picker': [
    {
      state: '값 있음',
      // 우리 타깃: 입력칸(`.main-input`)과 지우기(`.clear-btn` — 이 컴포넌트가 역할·핸들러·치수를 준다, cycle-537).
      // 찾기(`.find-btn`)와 제안 항목(`u-option`)은 형제 컴포넌트라 재지 않는다. 지우기는 값이 있을 때만 보인다.
      html: '<u-record-picker clearable style="width:260px"></u-record-picker>',
      prepare: async (host) => {
        const p = host as HTMLElement & { search: unknown; columns: unknown; value?: string; updateComplete: Promise<unknown> };
        p.search = async () => [{ id: '1', label: 'Acme Corp' }];
        p.columns = [{ key: 'label', label: 'Name' }];
        p.value = '1';
        await p.updateComplete;
        const clear = p.shadowRoot!.querySelector('.clear-btn') as HTMLElement | null;
        if (!clear || clear.hidden) throw new Error('값이 있는데 지우기 버튼이 보이지 않는다 — 없는 타깃을 통과로 세면 미탐이다');
      },
      targets: () => inShadow(document.querySelector('u-record-picker')!, '.main-input, .clear-btn'),
    },
    {
      state: '대화상자',
      // 조회 대화상자의 검색칸(`.dialog-search input`)은 우리 타깃이다. 행은 `u-rich-table` 의, 하단 버튼은 형제 `u-button` 의 계약이다.
      html: '<u-record-picker style="width:260px"></u-record-picker>',
      prepare: async (host) => {
        const p = host as HTMLElement & { search: unknown; columns: unknown; updateComplete: Promise<unknown> };
        p.search = async () => [{ id: '1', label: 'Acme Corp' }];
        p.columns = [{ key: 'label', label: 'Name' }];
        await p.updateComplete;
        (p.shadowRoot!.querySelector('.find-btn') as HTMLElement).click();
        const dialog = p.shadowRoot!.querySelector('u-dialog')!;
        for (let i = 0; i < 50 && !dialog.hasAttribute('open'); i++) await new Promise((r) => setTimeout(r, 20));
        if (!dialog.hasAttribute('open')) throw new Error('조회 대화상자가 열리지 않았다');
      },
      targets: () => inShadow(document.querySelector('u-record-picker')!, '.dialog-search input'),
      settle: 100,
    },
  ],
};

async function mount(html: string, settle = 0): Promise<void> {
  document.body.innerHTML = `<div style="padding:40px;width:600px">${html}</div>`;
  await new Promise((r) => setTimeout(r, 80 + settle));
}

/**
 * 두 엔트리가 등록한 태그 중 **이 패키지가 소유한 것**만 — 손으로 열거하지 않는다.
 *
 * 🔴**형제 `@iyulab/components` 의 태그를 걸러야 한다.** 우리 배럴을 임포트하면 그쪽 컴포넌트
 * (`u-button`·`u-icon`·`u-copy-button` 등 실측 8개)도 부수효과로 함께 등록되는데, 그것들은
 * ***그 패키지의 계약이고 거기 같은 게이트가 이미 있다.*** 여기서 또 재면 ⑴판정이 두 곳으로
 * 갈려 드리프트하고 ⑵우리가 고칠 수 없는 미달이 이 스위트를 빨갛게 만든다.
 *
 * ⚠**그 목록을 손으로 쓰지 않는다** — 형제를 «먼저» 임포트해 그때 등록된 것을 걷어내면,
 * 남는 것이 곧 우리 것이다(같은 태그는 두 번 등록되지 않는다). 형제가 컴포넌트를 더하거나
 * 빼도 이 판정은 따라온다.
 */
const registered: string[] = [];

beforeAll(async () => {
  const original = customElements.define.bind(customElements);
  customElements.define = ((name: string, ctor: CustomElementConstructor, opts?: ElementDefinitionOptions) => {
    registered.push(name);
    return original(name, ctor, opts);
  }) as typeof customElements.define;

  await import('@iyulab/components');
  const foreign = registered.length;
  registered.length = 0;

  await import('../../src/index.js');
  customElements.define = original;

  // 형제가 실제로 무언가를 등록했는지 확인한다 — 0 이면 위 «걸러내기»가 아무 일도 하지 않은
  // 것이고, 그러면 아래 분류표에 남의 태그가 섞여 들어와도 알 방법이 없다.
  if (foreign === 0) throw new Error('형제 배럴이 아무 태그도 등록하지 않았다 — 소유 판정이 무의미하다');
});

describe('WCAG 2.2 SC 2.5.8 — 타깃 크기(최소) 게이트', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('규칙 자체 — 간격 예외 모델링', () => {
    it('24×24 이상이면 간격과 무관하게 통과한다', () => {
      expect(judge({ w: 24, h: 24, cx: 0, cy: 0 }, [{ w: 24, h: 24, cx: 1, cy: 0 }])).toBe('meets-size');
    });

    it('🔴미달이어도 중심 간 24px 이상이면 «간격 예외»로 통과한다', () => {
      expect(judge({ w: 16, h: 16, cx: 0, cy: 0 }, [{ w: 16, h: 16, cx: 24, cy: 0 }]))
        .toBe('exempt-by-spacing');
    });

    it('🔴미달이고 중심 간 24px 미만이면 위반이다', () => {
      expect(judge({ w: 16, h: 16, cx: 0, cy: 0 }, [{ w: 16, h: 16, cx: 23.9, cy: 0 }]))
        .toBe('undersized');
    });

    it('⚪NEGATIVE — 이웃이 없으면 미달이어도 «간격 예외»다 (혼자 있는 타깃)', () => {
      expect(judge({ w: 10, h: 10, cx: 0, cy: 0 }, [])).toBe('exempt-by-spacing');
    });

    it('⚪NEGATIVE — 대각선 거리도 유클리드로 잰다 (축별로 재면 틀린다)', () => {
      expect(judge({ w: 16, h: 16, cx: 0, cy: 0 }, [{ w: 16, h: 16, cx: 17, cy: 17 }]))
        .toBe('exempt-by-spacing');
    });
  });

  describe('🔴 대상 도출 — 등록된 태그가 규칙 표를 벗어나지 않는다', () => {
    it('배럴이 태그를 실제로 등록한다 (도출이 0건이면 아래 단언이 전부 공허해진다)', () => {
      // ⚠이 패키지가 소유한 태그는 넷뿐이다 — 형제 것을 걸러낸 뒤의 수다.
      expect(registered.length).toBeGreaterThan(3);
    });

    it('등록된 모든 태그가 세 집합 중 정확히 하나에 분류돼 있다', () => {
      const unclassified = registered.filter(
        (t) => !NOT_A_TARGET.has(t) && !NEEDS_FIXTURE.has(t) && !(t in FIXTURES),
      );
      expect(unclassified,
        `분류되지 않은 태그가 있다 — 새 컴포넌트라면 규칙 표에 넣을 것: ${unclassified.join(' ')}`,
      ).toEqual([]);
    });

    it('📌커버리지를 보고한다 — 「미판정」은 통과가 아니다', () => {
      const unjudged = [...NEEDS_FIXTURE].sort();
      // 🔴상태 수를 함께 센다 — 태그만 세면 한 태그의 열린 상태를 빠뜨려도 이 줄이 변하지 않는다.
      const states = Object.values(FIXTURES).flat().length;
      // ⚠이 단언은 «미판정이 늘지 않았는가»를 지킨다. 픽스처를 쓰면 이 수가 줄고 그때 이
      //   줄을 함께 고치는 것이 그 작업의 완료 신호다. 숫자를 문자열로 고정하는 이유는
      //   `components` 쪽과 같다 — 분류를 바꾸면 반드시 여기도 손대게 만든다.
      expect(
        `판정 ${Object.keys(FIXTURES).length}(${states}상태) · 미판정 ${unjudged.length}(${unjudged.join(' ')})` +
        ` · 대상아님 ${NOT_A_TARGET.size} · 인라인예외 ${INLINE_PROSE.size}`,
      ).toBe('판정 3(5상태) · 미판정 0() · 대상아님 1 · 인라인예외 0');
    });

    it('규칙 표에 «등록되지 않은» 이름이 남아 있지 않다 (표가 낡지 않게)', () => {
      const known = new Set(registered);
      const stale = [...NOT_A_TARGET, ...NEEDS_FIXTURE, ...Object.keys(FIXTURES)]
        .filter((t) => !known.has(t));
      expect(stale, `등록되지 않은 이름: ${stale.join(' ')}`).toEqual([]);
    });
  });

  describe('실측 — 픽스처를 가진 모든 타깃', () => {
    const CASES = Object.entries(FIXTURES).flatMap(([tag, entry]) =>
      (Array.isArray(entry) ? entry : [entry]).map((fixture) => ({ tag, fixture })));
    for (const { tag, fixture } of CASES) {
      const pinned = UNDERSIZED_PINS.has(tag);
      const inline = INLINE_PROSE.has(tag);
      const label = pinned
        ? '📌미달로 «핀»돼 있다 (사람 판단 대기)'
        : inline
          ? '「인라인」 예외 — 크기 하한을 적용하지 않되 실측은 보고한다'
          : 'SC 2.5.8 을 만족한다';
      const name = `${tag}${fixture.state ? ` [${fixture.state}]` : ''}`;
      it(`${name}: ${label}`, async () => {
        await mount(fixture.html, fixture.settle);
        if (fixture.prepare) await fixture.prepare(document.querySelector(tag)!);
        const targets = (fixture.targets ? fixture.targets(tag) : [document.querySelector(tag)!])
          .map(resolveTarget)
          .map(measure);
        expect(targets.length, '타깃을 하나도 못 찾으면 이 판정은 무의미하다').toBeGreaterThan(0);

        const verdicts = targets.map((t, i) =>
          fixture.spacingIsOurs ? judge(t, targets.filter((_, j) => j !== i)) : judge(t, [t]),
        );
        const detail = `실측 ${targets.map((t) => `${Math.round(t.w)}x${Math.round(t.h)}`).join(' ')} · 판정 ${verdicts.join(' ')}`;

        if (pinned) {
          expect(verdicts.some((v) => v === 'undersized'), detail).toBe(true);
        } else if (inline) {
          /* 크기 하한은 적용하지 않는다. 대신 **예외의 전제**를 잰다 — 이 컴포넌트가 실제로
             문장 안을 «인라인으로 흐르는가». 블록이 되면 더 이상 문장 안의 타깃이 아니고
             면제 근거가 사라진다 ⇒ 면제가 조용히 넓어지는 것을 막는 자리다.
             ⚠재는 것은 **호스트**다 — 섀도 안쪽 `a` 는 `display: block` 이어도 무방하다
             (문장의 흐름을 정하는 것은 호스트의 display 다). */
          const host = document.querySelector(tag)!;
          expect(getComputedStyle(host).display, `${detail} · 인라인이 아니면 면제 근거가 없다`)
            .toMatch(/^inline/);
        } else {
          expect(verdicts.every((v) => v !== 'undersized'), detail).toBe(true);
        }
      });
    }
  });
});
