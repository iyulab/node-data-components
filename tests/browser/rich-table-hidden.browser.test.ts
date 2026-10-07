import { describe, it, expect, afterEach } from 'vitest';
import '../../src/components/u-rich-table/URichTable';
import '../../src/components/data-view/UDataView';

/**
 * `hidden` hides the view. A host `display` outranks the user-agent `[hidden]` rule, so `u-rich-table` (whose host is
 * `display: flex`) kept drawing when hidden — a list skeleton that switches between a table and a card view puts
 * `hidden` on the view it is not showing, and both showed. `u-data-view` is the other view of that switch.
 */
type View = HTMLElement & { data: Record<string, unknown>[]; updateComplete: Promise<unknown> };

afterEach(() => { document.body.replaceChildren(); });

describe('views honour hidden', () => {
  for (const tag of ['u-rich-table', 'u-data-view']) {
    it(`a hidden ${tag} takes no box`, async () => {
      const view = document.createElement(tag) as View;
      if (tag === 'u-rich-table') (view as View & { columns: unknown[] }).columns = [{ key: 'name', label: 'Name' }];
      view.data = [{ _id: 'a', name: 'a' }];
      document.body.append(view);
      await view.updateComplete;
      expect(view.getBoundingClientRect().height).toBeGreaterThan(0);

      view.hidden = true;
      expect(getComputedStyle(view).display).toBe('none');
      expect(view.getBoundingClientRect().height).toBe(0);
    });
  }
});
