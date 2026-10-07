import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import '../src';
import "@iyulab/components/dist/components/button/UButton.js";

interface SampleItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  createdAt: Date;
}

@customElement('preview-lit-app')
export class PreviewLitApp extends LitElement {

  @state() private sampleData: SampleItem[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.generateSampleData();
  }

  private generateSampleData() {
    const categories = ['전자제품', '의류', '식품', '도서', '가구'];
    const names = ['프리미엄', '베이직', '스탠다드', '디럭스', '에센셜'];
    
    this.sampleData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `${names[i % names.length]} ${categories[i % categories.length]} ${i + 1}`,
      category: categories[i % categories.length],
      price: Math.floor(Math.random() * 100000) + 10000,
      stock: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      // 일부 아이템에만 이미지 추가 (없는 경우 플레이스홀더 표시)
      image: i % 3 === 0 ? undefined : `https://picsum.photos/seed/${i}/200/200`
    }));
  }

  render() {
    return html`
      <div class="header">
        <h1>📊 Data Components - Lit Preview</h1>
      </div>

      <section class="section">
        <h2>UDataView Component</h2>
        <p class="description">
          데이터를 Grid, List, Table 레이아웃으로 표시할 수 있는 컴포넌트입니다.
        </p>
        
        <u-data-view
          .data=${this.sampleData}
          mode="grid"
          gridMinWidth="250px"
          gap="1rem"
          @select=${(e: CustomEvent) => {
            console.log('선택된 아이템:', e.detail);
          }}
        ></u-data-view>
      </section>

      <section class="section">
        <h2>Custom Columns Example</h2>
        <p class="description">
          컬럼을 커스터마이즈하여 특정 필드만 표시할 수 있습니다.
        </p>

        <u-data-view
          mode="table"
          .data=${this.sampleData}
          .columns=${[
            { key: 'name', label: '상품명' },
            { key: 'category', label: '카테고리' },
            { key: 'price', label: '가격' },
            { key: 'stock', label: '재고' }
          ]}
        ></u-data-view>
      </section>

      <section class="section">
        <h2>USimpleSheet - 자동 헤더 (A, B, C...)</h2>
        <p class="description">
          columns 미설정시 엑셀처럼 A, B, C... 헤더가 자동으로 생성됩니다.<br>
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
        <h2>USimpleSheet - 컬럼 정의</h2>
        <p class="description">
          columns 설정시 해당 열까지만 표시하고, label로 헤더를 지정합니다.<br>
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
        <h2>USimpleSheet - 읽기 전용</h2>
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
