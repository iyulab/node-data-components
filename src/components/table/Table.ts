import { html } from "lit";
import { property } from "lit/decorators.js";

import { UElement } from "@iyulab/components/dist/internals/UElement.js";
import { styles } from './Table.styles.js';

/**
 * 테이블 컴포넌트 스타일
 */
export class Table extends UElement {
  static styles = [ super.styles, styles ];
  static dependencies: Record<string, typeof UElement> = {};

  @property({ type: Array }) data: any[] = [];

  render() {
    return html`<div>Table Component</div>`;
  }
}