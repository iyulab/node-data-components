import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/components/u-record-picker/URecordPicker';

/**
 * `u-record-picker` 는 폼 컨트롤 기반 클래스를 상속한다 — 네이티브 `<form>` 의 두 표준 계약을
 * 형제 컨트롤과 같이 따른다: 조상 `<fieldset disabled>` = 자기 `disabled`, `form.reset()` = 기본값으로.
 */
type Picker = HTMLElement & { value?: string; disabled: boolean; updateComplete: Promise<unknown> };

const settle = async (el: Picker) => {
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 60));
  await el.updateComplete;
};

function deepInputs(el: Picker) {
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input.main-input')!;
  const find = el.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>('u-button.find-btn')!;
  return { input: input.disabled, find: find.disabled, matches: el.matches(':disabled') };
}

async function mount(markup: string): Promise<{ form: HTMLFormElement; el: Picker }> {
  document.body.innerHTML = `<form>${markup}</form>`;
  const el = document.getElementById('c') as Picker;
  await settle(el);
  return { form: document.querySelector('form')!, el };
}

describe('u-record-picker — 네이티브 폼 계약', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('fieldset 비활성 = 자기 disabled', async () => {
    const own = deepInputs((await mount('<u-record-picker id="c" name="x" disabled></u-record-picker>')).el);
    const via = deepInputs((await mount('<fieldset disabled><u-record-picker id="c" name="x"></u-record-picker></fieldset>')).el);
    expect(via).toEqual(own);
    expect(own).toEqual({ input: true, find: true, matches: true });
  });

  it('NEGATIVE: fieldset 을 다시 켜면 활성으로', async () => {
    const { el } = await mount('<fieldset disabled><u-record-picker id="c" name="x"></u-record-picker></fieldset>');
    (el.closest('fieldset') as HTMLFieldSetElement).disabled = false;
    await settle(el);
    expect(deepInputs(el)).toEqual({ input: false, find: false, matches: false });
  });

  it('form.reset() 은 value 속성(기본값)으로 되돌린다', async () => {
    const { form, el } = await mount('<u-record-picker id="c" name="x" value="42"></u-record-picker>');
    el.value = '7';
    await settle(el);
    expect(new FormData(form).get('x')).toBe('7');
    form.reset();
    await settle(el);
    expect(el.value).toBe('42');
    expect(new FormData(form).get('x')).toBe('42');
  });
});
