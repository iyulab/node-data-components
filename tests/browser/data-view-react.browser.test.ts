import { describe, it, afterEach, expect, vi } from 'vitest';
import React, { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UDataViewReact } from '../../src/react';
import type { UDataView } from '../../src/components/data-view/UDataView';

/**
 * `UDataViewReact`'s `renderCard` takes a React node — the card view of a list whose table cells are JSX. Before, it
 * took only a Lit template, so a React screen wrote its cards in Lit. Each card's root lives while the card is drawn:
 * a card that leaves (another page of a bound source) releases its root.
 */
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement | null = null;
let root: Root | null = null;

afterEach(async () => {
  if (root) {
    await act(async () => { root!.unmount(); });
    root = null;
  }
  container?.remove();
  container = null;
});

describe('UDataViewReact — React cards', () => {
  it('mounts a React card per item, keeps it across re-renders, and releases the card that leaves', async () => {
    const unmounted = vi.fn();
    const onClick = vi.fn();
    const Card = ({ name }: { name: string }) => {
      useEffect(() => unmounted, []);
      return React.createElement('button', { className: 'card', onClick }, name);
    };
    const renderCard = (item: Record<string, unknown>) => React.createElement(Card, { name: String(item.name) });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root!.render(React.createElement(UDataViewReact, { renderCard, hideToolbar: true })); });
    const el = container.querySelector('u-data-view') as UDataView;
    await act(async () => { el.data = [{ _id: 'a', name: 'Aster' }, { _id: 'b', name: 'Blue' }]; await el.updateComplete; });

    const cards = () => [...el.shadowRoot!.querySelectorAll('button.card')] as HTMLButtonElement[];
    expect(cards().map((b) => b.textContent)).toEqual(['Aster', 'Blue']);
    await act(async () => { cards()[1].click(); });
    expect(onClick).toHaveBeenCalledTimes(1);

    // The screen re-renders without `data` — the bound rows stay.
    await act(async () => { root!.render(React.createElement(UDataViewReact, { renderCard, mode: 'list' })); });
    await el.updateComplete;
    expect(cards().map((b) => b.textContent)).toEqual(['Aster', 'Blue']);
    expect(unmounted).not.toHaveBeenCalled();

    await act(async () => { el.data = [{ _id: 'b', name: 'Blue' }]; await el.updateComplete; });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(cards().map((b) => b.textContent)).toEqual(['Blue']);
    expect(unmounted).toHaveBeenCalledTimes(1);
  });
});
