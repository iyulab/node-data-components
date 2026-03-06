import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import '../src';

@customElement('preview-simple-sheet')
export class PreviewSimpleSheet extends LitElement {

  render() {
    return html`
      <div class="header">
        <h1>USimpleSheet Component</h1>
      </div>

      <section class="section">
        <h2>자동 헤더 (A, B, C...)</h2>
        <p class="description">
          columns 미설정 시 엑셀처럼 A, B, C... 헤더가 자동으로 생성됩니다.<br>
          클릭 선택, Shift+클릭 범위 선택, 드래그 선택, Ctrl+C/V (엑셀 호환), Delete 키 지원.
        </p>
        <u-simple-sheet
          style="height: 300px;"
          .rows=${10}
          .cols=${8}
          @change=${(e: CustomEvent) => console.log('sheet change:', e.detail)}
        ></u-simple-sheet>
      </section>

      <section class="section">
        <h2>컬럼 정의 + 초기 데이터</h2>
        <p class="description">
          columns 설정 시 해당 열까지만 표시하고, label로 헤더를 지정합니다.<br>
          초기 데이터도 함께 설정할 수 있습니다.
        </p>
        <u-simple-sheet
          style="height: 350px;"
          .columns=${[
            { key: 'name',     label: '이름',   width: 150 },
            { key: 'email',    label: '이메일', width: 220 },
            { key: 'dept',     label: '부서',   width: 120 },
            { key: 'salary',   label: '연봉',   width: 100 },
            { key: 'joinDate', label: '입사일', width: 110 },
          ] satisfies import('../src/components/simple-sheet/USimpleSheet.js').SheetColumn[]}
          .data=${[
            ['김철수', 'kim@example.com',  '개발팀',   '5500', '2021-03-15'],
            ['이영희', 'lee@example.com',  '디자인팀', '4800', '2020-07-01'],
            ['박민수', 'park@example.com', '기획팀',   '5100', '2022-01-10'],
            ['최지은', 'choi@example.com', '개발팀',   '6200', '2019-11-25'],
          ]}
          @change=${(e: CustomEvent) => console.log('sheet objects:', (e.target as any).getDataAsObjects())}
        ></u-simple-sheet>
      </section>

      <section class="section">
        <h2>읽기 전용</h2>
        <p class="description">
          readonly 속성으로 편집을 비활성화합니다.
        </p>
        <u-simple-sheet
          style="height: 200px;"
          readonly
          .cols=${6}
          .rows=${5}
          .data=${[
            ['읽기', '전용', '모드', '편집', '불가', '예시'],
            ['A',    'B',    'C',    'D',    'E',    'F'],
          ]}
        ></u-simple-sheet>
      </section>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      padding: 2rem;
      box-sizing: border-box;
      background-color: var(--u-bg-color);
      color: var(--u-txt-color);
    }

    .header {
      margin-bottom: 3rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--u-border-color);
    }

    .header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .section {
      margin-bottom: 4rem;
    }

    .section h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .description {
      margin: 0 0 2rem 0;
      color: var(--u-txt-muted);
      font-size: 0.95rem;
    }
  `;
}
