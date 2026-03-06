import { USimpleSheet } from './USimpleSheet.component.js';

USimpleSheet.define('u-simple-sheet');

declare global {
  interface HTMLElementTagNameMap {
    'u-simple-sheet': USimpleSheet;
  }
}

export { USimpleSheet };
export type { SheetColumn } from './USimpleSheet.component.js';
