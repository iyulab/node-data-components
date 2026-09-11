import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import '../../src/components/u-record-picker/URecordPicker';

/**
 * `u-record-picker` 조회 대화상자의 검색칸은 **이름을 가진다** (SC 4.1.2 Name, Role, Value).
 *
 * 종전 검색칸은 `aria-label`·`placeholder`·`<label>` 이 하나도 없어 보조기술에는 이름 없는 편집
 * 칸이었다(`u-select` 검색칸과 같은 결함 — cycle-544). 이름은 이 패키지의 로케일 메시지
 * `pickerSearch` 에서 온다 — 형제 `@iyulab/components` 의 `search` 키는 선언 범위(`>=1.23.0`)의
 * 대부분에 없어서 빌리면 오래된 설치본에서 빈 이름이 된다.
 */
type Picker = HTMLElement & {
  search: (q: string) => Promise<{ id: string; label: string }[]>;
  columns: { key: string; label: string }[];
  updateComplete: Promise<unknown>;
};

async function openDialog(): Promise<HTMLInputElement> {
  const p = document.createElement('u-record-picker') as Picker;
  p.search = async () => [{ id: '1', label: 'Acme Corp' }];
  p.columns = [{ key: 'label', label: 'Name' }];
  document.body.appendChild(p);
  await p.updateComplete;
  (p.shadowRoot!.querySelector('.find-btn') as HTMLElement).click();
  await p.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await p.updateComplete;
  return p.shadowRoot!.querySelector('.dialog-search input') as HTMLInputElement;
}

describe('u-record-picker 조회 대화상자 — 검색칸 접근성 이름', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { document.body.innerHTML = ''; Locale.set('en'); });

  it('영어 로케일에서 «Search» 로 이름 붙는다', async () => {
    Locale.set('en');
    const input = await openDialog();
    expect(input.getAttribute('aria-label')).toBe('Search');
  });

  it('활성 로케일을 따른다 (ko → «검색»)', async () => {
    Locale.set('ko');
    const input = await openDialog();
    expect(input.getAttribute('aria-label')).toBe('검색');
  });
});
