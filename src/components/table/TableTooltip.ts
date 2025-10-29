import { html,  } from 'lit';
import { customElement, state } from "lit/decorators.js";

import { UFlyout, UFlyoutPosition } from "@iyulab/components";
import { styles } from './TableTooltip.styles';

type getTooltipData = (data: any) => string | HTMLElement;

@customElement("table-tooltip")
export class TableTooltip extends UFlyout {
  keepHover: boolean = true;
  position: UFlyoutPosition = 'BottomCenter';

  @state()
  content?: HTMLElement | string;

  render() {
    return html`
      <div class="tooltip">
        <p class="content">
          ${this.content}
        </p>
      </div>
    `;
  }

  // 버튼 호버링시
  async hoverButton(event: MouseEvent, display: string) {
    // 툴팁 설정
    this.position = 'TopCenter';
    this.keepHover = false;

    // 툴팁 내용 설정
    this.content = display;
    await this.updateComplete;

    // 툴팁 호버링
    this.hoverAsync(event);
  }

  // 테이블 데이터 호버링시
  async hoverData(event: MouseEvent, item: any, tooltip?: getTooltipData) {
    if (!tooltip) return;

    // 툴팁 설정
    this.position = 'BottomCenter';
    this.keepHover = true;

    // 툴팁 내용 설정
    this.content = tooltip(item);
    if (!this.content) return;
    if (typeof this.content === "string" && this.content.length === 0) return;
    await this.updateComplete;

    // 툴팁 호버링
    this.hoverAsync(event);
  }

  static styles = [styles];
}