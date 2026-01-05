import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import '../src';
import "@iyulab/components/dist/components/button/UButton.js";
import { theme } from "@iyulab/components/dist/utilities/theme.js";

@customElement('preview-app')
export class PreviewApp extends LitElement {

  firstUpdated(changedProperties: any): void {
    super.firstUpdated(changedProperties);
    theme.init();
  }

  render() {
    return html`
      <div class="header">
        <h1>Data Components Preview</h1>
        <u-button @click=${this.toggleTheme}>테마 변경</u-button>
      </div>

      <section class="section">
        
      </section>
    `;
  }

  private toggleTheme() {
    const currentTheme = theme.get();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    theme.set(newTheme);
  }

  static styles = css`
    :host {
      display: block;
      width: 100vw;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
      background-color: var(--u-bg-color);
      color: var(--u-txt-color);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--u-border-color);
    }

    .header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .section {
      margin-bottom: 60px;
    }

    .section h2 {
      margin: 0 0 30px 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--u-txt-color);
    }
  `;
}