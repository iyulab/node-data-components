import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import '../src';

interface SampleItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  createdAt: Date;
}

@customElement('preview-data-view')
export class PreviewDataView extends LitElement {

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
      image: i % 3 === 0 ? undefined : `https://picsum.photos/seed/${i}/200/200`
    }));
  }

  render() {
    return html`
      <div class="header">
        <h1>UDataView Component</h1>
      </div>

      <section class="section">
        <h2>Grid 모드</h2>
        <p class="description">
          데이터를 Grid 레이아웃으로 표시합니다.
        </p>

        <u-data-view
          .items=${this.sampleData}
          mode="grid"
          gridMinWidth="250px"
          gap="1rem"
          @select=${(e: CustomEvent) => {
            console.log('선택된 아이템:', e.detail);
          }}
        ></u-data-view>
      </section>

      <section class="section">
        <h2>Table 모드 - 커스텀 컬럼</h2>
        <p class="description">
          컬럼을 커스터마이즈하여 특정 필드만 표시할 수 있습니다.
        </p>

        <u-data-view
          mode="table"
          .items=${this.sampleData}
          .columns=${[
            { key: 'name', label: '상품명' },
            { key: 'category', label: '카테고리' },
            { key: 'price', label: '가격' },
            { key: 'stock', label: '재고' }
          ]}
        ></u-data-view>
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
