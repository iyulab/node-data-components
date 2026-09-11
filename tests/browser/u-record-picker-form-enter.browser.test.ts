import { describe, it, expect, beforeEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../src/components/u-record-picker/URecordPicker';

/**
 * 폼 안의 `u-record-picker` 입력칸에서 **Enter 는 «찾기» 다 — 폼을 제출하지 않는다.**
 *
 * `@iyulab/components` 의 `u-input` 은 네이티브 텍스트 필드처럼 Enter 로 소유 폼을 제출한다(HTML 암묵 제출). 이
 * 컴포넌트는 같은 섀도 안 텍스트 입력을 갖지만 **Enter 에 이미 정해진 뜻이 있다** — 강조된 제안이 없으면 조회
 * 대화상자를 열고, 있으면 그 항목을 고른다(스킬 문서). 암묵 제출을 붙이면 «찾으려고 누른 Enter 가 폼을 보낸다» 가
 * 된다. 이 파일은 그 판단을 고정한다 — `u-input` 의 동작을 여기로 옮겨 «맞추려는» 변경은 여기서 빨개진다.
 *
 * 트러스티드 키 입력(`userEvent`)으로 잰다. `submit` 은 늘 `preventDefault()` 로 관찰만 한다.
 */
type Picker = HTMLElement & {
  search: (q: string) => Promise<{ id: string; label: string }[]>;
  columns: { key: string; label: string }[];
  value?: string;
  updateComplete: Promise<unknown>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mountInForm() {
  const form = document.createElement('form');
  let submits = 0;
  form.addEventListener('submit', (e) => {
    submits++;
    e.preventDefault();
  });
  const p = document.createElement('u-record-picker') as Picker;
  p.style.width = '260px';
  p.search = async () => [{ id: '1', label: 'Acme Corp' }];
  p.columns = [{ key: 'label', label: 'Name' }];
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Save';
  form.append(p, button);
  document.body.appendChild(form);
  await p.updateComplete;
  await sleep(60);
  return { p, submits: () => submits };
}

describe('u-record-picker — 폼 안에서 Enter 는 찾기다', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('강조된 제안이 없을 때 Enter 는 조회 대화상자를 열고, 폼을 제출하지 않는다', async () => {
    const { p, submits } = await mountInForm();
    (p.shadowRoot!.querySelector('.main-input') as HTMLInputElement).focus();
    await userEvent.keyboard('{Enter}');
    const dialog = p.shadowRoot!.querySelector('u-dialog')!;
    for (let i = 0; i < 50 && !dialog.hasAttribute('open'); i++) await sleep(20);
    await sleep(60);
    expect(dialog.hasAttribute('open'), '대화상자가 열려야 한다').toBe(true);
    expect(submits()).toBe(0);
  });

  it('제안을 강조한 뒤 Enter 는 그 항목을 고르고, 폼을 제출하지 않는다', async () => {
    const { p, submits } = await mountInForm();
    (p as Picker & { debounce: number }).debounce = 0;
    (p.shadowRoot!.querySelector('.main-input') as HTMLInputElement).focus();
    await userEvent.keyboard('Acme');
    const popover = p.shadowRoot!.querySelector('u-popover')!;
    for (let i = 0; i < 50 && !popover.hasAttribute('open'); i++) await sleep(20);
    if (!popover.hasAttribute('open')) throw new Error('인라인 제안이 열리지 않았다 — 이 사례는 제안 위 Enter 를 재야 한다');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await sleep(60);
    expect(p.value).toBe('1');
    expect(submits()).toBe(0);
  });
});
