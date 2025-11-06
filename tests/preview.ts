import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import '../src';
import { getTheme, importTheme, setTheme } from "@iyulab/components/dist/utilities/theme.js";

@customElement('preview-app')
export class PreviewApp extends LitElement {

  firstUpdated(changedProperties: any): void {
    super.firstUpdated(changedProperties);
    importTheme();
  }

  render() {
    return html`
      <div class="header">
        <h1>Data Components Preview</h1>
        <u-button @click=${this.toggleTheme}>테마 변경</u-button>
      </div>

      <section class="section">
        <h2>Data Grid</h2>
        
        <div class="demo-item">
          <h3>Basic Data Grid</h3>
          <u-data-grid
            .columns=${[
              { field: 'id', headerName: 'ID', width: 100 },
              { field: 'name', headerName: '이름', width: 150 },
              { field: 'email', headerName: '이메일', width: 200 },
              { field: 'role', headerName: '역할', width: 120 }
            ]}
            .rows=${[
              { id: 1, name: '홍길동', email: 'hong@example.com', role: '관리자' },
              { id: 2, name: '김철수', email: 'kim@example.com', role: '사용자' },
              { id: 3, name: '이영희', email: 'lee@example.com', role: '사용자' },
              { id: 4, name: '박민수', email: 'park@example.com', role: '편집자' }
            ]}
          ></u-data-grid>
        </div>
      </section>

      <section class="section">
        <h2>Data View</h2>
        
        <div class="demo-item">
          <h3>Grid Data View</h3>
          <u-data-view
            .items=${[
              { id: 1, title: '아이템 1', description: '첫 번째 아이템입니다.', image: 'https://via.placeholder.com/150' },
              { id: 2, title: '아이템 2', description: '두 번째 아이템입니다.', image: 'https://via.placeholder.com/150' },
              { id: 3, title: '아이템 3', description: '세 번째 아이템입니다.', image: 'https://via.placeholder.com/150' },
              { id: 4, title: '아이템 4', description: '네 번째 아이템입니다.', image: 'https://via.placeholder.com/150' }
            ]}
          ></u-data-view>
        </div>
      </section>

      <section class="section">
        <h2>Table</h2>
        
        <div class="demo-item">
          <h3>Simple Table</h3>
          <u-table>
            <u-table-header>
              <u-table-row>
                <u-table-cell header>번호</u-table-cell>
                <u-table-cell header>제목</u-table-cell>
                <u-table-cell header>작성자</u-table-cell>
                <u-table-cell header>날짜</u-table-cell>
              </u-table-row>
            </u-table-header>
            <u-table-body>
              <u-table-row>
                <u-table-cell>1</u-table-cell>
                <u-table-cell>첫 번째 게시글</u-table-cell>
                <u-table-cell>홍길동</u-table-cell>
                <u-table-cell>2025-11-01</u-table-cell>
              </u-table-row>
              <u-table-row>
                <u-table-cell>2</u-table-cell>
                <u-table-cell>두 번째 게시글</u-table-cell>
                <u-table-cell>김철수</u-table-cell>
                <u-table-cell>2025-11-02</u-table-cell>
              </u-table-row>
              <u-table-row>
                <u-table-cell>3</u-table-cell>
                <u-table-cell>세 번째 게시글</u-table-cell>
                <u-table-cell>이영희</u-table-cell>
                <u-table-cell>2025-11-03</u-table-cell>
              </u-table-row>
            </u-table-body>
          </u-table>
        </div>
      </section>
    `;
  }

  toggleTheme() {
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
  }

  static styles = css`
    :host {
      display: block;
      width: 100vw;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
      background-color: var(--u-color-background);
      color: var(--u-color-text);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--u-color-border);
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
      color: var(--u-color-primary);
    }

    .demo-item {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid var(--u-color-border);
      border-radius: 8px;
      background-color: var(--u-color-surface);
    }

    .demo-item h3 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--u-color-text-secondary);
    }

    u-data-grid {
      width: 100%;
      height: 400px;
    }

    u-data-view {
      width: 100%;
      min-height: 300px;
    }

    u-table {
      width: 100%;
    }
  `;
}