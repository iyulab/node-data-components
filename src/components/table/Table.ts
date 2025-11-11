import { html } from "lit";
import { property } from "lit/decorators.js";

import { BaseElement } from "@iyulab/components/dist/components/BaseElement.js";
import { styles } from './Table.styles.js';

/**
 * 테이블 컴포넌트 스타일
 */
export class Table extends BaseElement {
  static styles = [ super.styles, styles ];
  static dependencies: Record<string, typeof BaseElement> = {};

  @property({ type: Array }) data: any[] = [];

  render() {
    return html`<div>Table Component</div>`;
  }
}