import { describe, it, afterEach, expect } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-rich-table/URichTable';
import '../../src/components/simple-sheet/USimpleSheet';

/**
 * 표 문구의 **로케일 이주** 계약.
 *
 * ## 왜 브라우저인가
 *
 * 이 이주의 핵심은 *"기본값을 비우고 **렌더에서** 해석한다"* 이다 — 즉 **렌더된 결과**가
 * 계약이다. 소스 대조로는 `|| messages.text(...)` 가 적혀 있음만 알 수 있고, 그것이 실제
 * 화면에 나오는지는 알 수 없다.
 *
 * ## 무엇을 재는가
 *
 * ⑴ 기본이 **영어**다.
 * ⑵ 한국어 환경은 **종전 문구**를 본다(이주가 회귀가 아니다).
 * ⑶ 소비자가 준 값이 **여전히 이긴다**.
 * ⑷ 🔴**로케일 전환이 «이미 만들어진» 표에도 닿는다** — 프로퍼티 초기값에 박아 두면
 *    생성 시점에 고정된다. 이 이주가 기본값을 비운 이유가 그것이다.
 */

// ⚠`requestUpdate` 를 빠뜨려 이 파일은 **타입 에러를 안은 채로 통과**하고 있었다 —
//   `tsc --noEmit` 은 어느 패키지의 `build` 에도 게이트로 걸려 있지 않다(CLAUDE.md 기록).
type Table = HTMLElement & {
  data: unknown[];
  updateComplete: Promise<unknown>;
  requestUpdate(): void;
};

const mountTable = async (attrs: Record<string, string> = {}) => {
  const el = document.createElement('u-rich-table') as Table;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.data = [];
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

const emptyText = (el: Table) =>
  el.shadowRoot!.querySelector('.empty-message')?.textContent?.trim() ?? null;

afterEach(() => {
  Locale.set('en');
  document.body.replaceChildren();
});

describe('data-components 표 문구 — 영어 기본 + 레지스트리', () => {
  it('⑴ 기본 로케일(en)에서 영어를 낸다', async () => {
    Locale.set('en');
    expect(emptyText(await mountTable())).toBe('No data');
  });

  it('🔴⑵ 한국어 환경은 이주 전과 같은 문구를 본다', async () => {
    Locale.set('ko');
    expect(emptyText(await mountTable())).toBe('데이터가 없습니다');
  });

  it('⑶ 소비자가 준 값이 이긴다', async () => {
    Locale.set('ko');
    expect(emptyText(await mountTable({ emptymessage: '없음!' }))).toBe('없음!');
  });

  it('🔴⑷ 로케일 전환이 이미 만들어진 표에도 닿는다', async () => {
    Locale.set('en');
    const el = await mountTable();
    expect(emptyText(el)).toBe('No data');

    Locale.set('ko');
    el.requestUpdate();              // 로케일은 반응형 상태가 아니다 — 재렌더는 앱이 부른다
    await el.updateComplete;
    expect(emptyText(el), '생성 시점에 고정됐다면 여기서 영어가 남는다').toBe('데이터가 없습니다');
  });

  it('검증 메시지는 components 의 키셋을 쓴다 (같은 문장을 복제하지 않는다)', () => {
    Locale.set('ko');
    expect(Locale.getValue('valueMissing')).toBe('필수 항목입니다');
    Locale.set('en');
    expect(Locale.getValue('valueMissing')).toBe('This field is required');
  });
});
