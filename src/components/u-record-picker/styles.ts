import { css } from 'lit';

export const styles = css`
  :host {
    display: inline-block;
  }

  .container {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .container input {
    flex: 1;
    min-width: 0;
    /* The text field is a pointer target (WCAG 2.2 SC 2.5.8, 24x24). Its natural height is the
       inherited font's line box, which is a font-metric value — 24px with Windows fonts, 20px
       with the default Linux fonts — so the floor is declared rather than assumed. */
    min-block-size: max(24px, var(--u-target-size, 0px));
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: inherit;
  }

  .suffix-item {
    cursor: pointer;
    flex: none;
  }

  /* The clear icon is a 1em glyph; the box that takes the pointer is 24x24 (WCAG 2.2 SC 2.5.8).
     content-box keeps the glyph at 1em whatever the icon's own box-sizing; the negative margin
     gives back exactly the container's 0.25rem gap on each side, so the box meets the text field
     and the find button without covering either, and nothing visible moves. */
  .clear-btn {
    /* 호스트 하한(--u-target-size)이 있으면 상자가 그 값 — 세로로만 되돌려 주고 가로는 종전 간격만큼만
       되돌려 이웃(입력칸·찾기 버튼)을 덮지 않는다. 미설정이면 0.25rem 그대로(종전). */
    --_pad: max(0.25rem, calc((var(--u-target-size, 0px) - 1em) / 2));
    box-sizing: content-box;
    padding: var(--_pad);
    margin: calc(-1 * var(--_pad)) -0.25rem;
  }

  u-popover {
    display: block;
    max-height: var(--record-picker-popover-max-height, 50vh);
    overflow: auto;
  }

  .no-results {
    padding: 0.5rem 0.75rem;
    opacity: 0.6;
    font-size: 0.875rem;
  }

  .popover-loading {
    padding: 0.5rem 0.75rem;
    display: flex;
    justify-content: center;
  }

  .dialog-error {
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    color: var(--u-danger-color, #D32F2F);
    font-size: 0.875rem;
  }

  .dialog-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
  }

  .dialog-search input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    box-sizing: border-box;
    min-height: var(--u-target-size, 0px);
    border: 1px solid currentColor;
    border-radius: 0.25rem;
    font: inherit;
  }

  .dialog-table-wrap {
    min-height: 16rem;
    max-height: 60vh;
    overflow: auto;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
`;
