// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import '../src/components/data-view/UDataView.js';
import type { UDataView } from '../src/components/data-view/UDataView.js';

// 열 폭 어휘는 표들과 같다 — 숫자는 px, 문자열은 CSS 길이. 종전에는 숫자가 `width: 120` 이라는
// 무효한 인라인 스타일이 되어 브라우저가 버렸다.
describe('u-data-view table column width', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('a number is pixels and a string passes through', async () => {
    const el = document.createElement('u-data-view') as UDataView;
    el.mode = 'table';
    el.columns = [{ key: 'a', label: 'A', width: 120 }, { key: 'b', label: 'B', width: '20%' }];
    el.data = [{ a: 1, b: 2 }];
    document.body.appendChild(el);
    await el.updateComplete;
    const ths = [...el.shadowRoot!.querySelectorAll('th')] as HTMLElement[];
    expect(ths.map(th => th.style.width)).toEqual(['120px', '20%']);
  });
});
