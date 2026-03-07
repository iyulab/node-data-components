import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import type { SheetColumn } from '../src/components/simple-sheet/USimpleSheet.js';

import '../src';

@customElement('preview-simple-sheet')
export class PreviewSimpleSheet extends LitElement {

  render() {
    return html`
      <div class="header">
        <h1>USimpleSheet Component</h1>
      </div>

      <!-- 1. 자동 헤더 -->
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

      <!-- 2. 컬럼 정의 + 초기 데이터 -->
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
          ] satisfies SheetColumn[]}
          .data=${[
            ['김철수', 'kim@example.com',  '개발팀',   '5500', '2021-03-15'],
            ['이영희', 'lee@example.com',  '디자인팀', '4800', '2020-07-01'],
            ['박민수', 'park@example.com', '기획팀',   '5100', '2022-01-10'],
            ['최지은', 'choi@example.com', '개발팀',   '6200', '2019-11-25'],
          ]}
          @change=${(e: CustomEvent) => console.log('sheet objects:', (e.target as any).getDataAsObjects())}
        ></u-simple-sheet>
      </section>

      <!-- 3. 읽기 전용 + 열별 readonly -->
      <section class="section">
        <h2>읽기 전용</h2>
        <p class="description">
          전체 readonly 또는 특정 열만 readonly로 설정할 수 있습니다.<br>
          아래 시트에서 <strong>ID</strong>와 <strong>입사일</strong> 열은 편집할 수 없습니다.
        </p>
        <u-simple-sheet
          style="height: 250px;"
          .columns=${[
            { key: 'id',       label: 'ID',     width: 60,  readonly: true },
            { key: 'name',     label: '이름',   width: 120 },
            { key: 'dept',     label: '부서',   width: 120 },
            { key: 'joinDate', label: '입사일', width: 110, readonly: true },
          ] satisfies SheetColumn[]}
          .data=${[
            ['001', '김철수', '개발팀',   '2021-03-15'],
            ['002', '이영희', '디자인팀', '2020-07-01'],
            ['003', '박민수', '기획팀',   '2022-01-10'],
          ]}
        ></u-simple-sheet>
      </section>

      <!-- 4. 드롭다운 셀렉터 -->
      <section class="section">
        <h2>드롭다운 셀렉터</h2>
        <p class="description">
          열에 options를 설정하면 편집 시 드롭다운 자동완성이 표시됩니다.<br>
          <strong>부서</strong> 열은 strict 모드 (목록 값만 입력 가능), <strong>직급</strong> 열은 자유 입력 + 자동완성입니다.
        </p>
        <u-simple-sheet
          style="height: 300px;"
          .columns=${[
            { key: 'name',  label: '이름', width: 120 },
            { key: 'dept',  label: '부서', width: 120,
              options: ['개발팀', '기획팀', '디자인팀', '마케팅팀', '인사팀'], strict: true },
            { key: 'level', label: '직급', width: 100,
              options: ['사원', '대리', '과장', '차장', '부장'] },
            { key: 'note',  label: '비고', width: 200 },
          ] satisfies SheetColumn[]}
          .data=${[
            ['김철수', '개발팀',   '과장', ''],
            ['이영희', '디자인팀', '대리', ''],
            ['박민수', '기획팀',   '사원', '신입'],
          ]}
        ></u-simple-sheet>
      </section>

      <!-- 5. 자동 계산 (compute) — 가로 계산 -->
      <section class="section">
        <h2>자동 계산 — 가로 (수량 × 단가 = 합계)</h2>
        <p class="description">
          compute 콜백으로 같은 행 내 자동 계산을 설정합니다.<br>
          <strong>합계</strong> 열은 수량 × 단가를 자동 계산하며, 이탤릭 + 파란 배경으로 표시됩니다.<br>
          수량이나 단가를 수정하면 합계가 즉시 업데이트됩니다.
        </p>
        <u-simple-sheet
          style="height: 300px;"
          .columns=${[
            { key: 'item',  label: '품목',  width: 150 },
            { key: 'qty',   label: '수량',  width: 80 },
            { key: 'price', label: '단가',  width: 100 },
            { key: 'total', label: '합계',  width: 120,
              compute: (r: number, data: string[][]) => {
                const qty = Number(data[r][1]) || 0;
                const price = Number(data[r][2]) || 0;
                const v = qty * price;
                return v ? v.toLocaleString() : '';
              }
            },
          ] satisfies SheetColumn[]}
          .data=${[
            ['노트북',   '2', '1500000', ''],
            ['모니터',   '4', '450000',  ''],
            ['키보드',   '10', '85000',  ''],
            ['마우스',   '10', '35000',  ''],
          ]}
        ></u-simple-sheet>
      </section>

      <!-- 6. 자동 계산 (compute) — 세로 계산 -->
      <section class="section">
        <h2>자동 계산 — 세로 (잔액 = 이전 잔액 - 집행)</h2>
        <p class="description">
          compute 콜백에서 다른 행의 데이터를 참조하여 세로 방향 계산도 가능합니다.<br>
          초기 예산 10,000,000원에서 각 행의 집행액을 차감합니다.
        </p>
        <u-simple-sheet
          style="height: 300px;"
          .columns=${[
            { key: 'desc',    label: '내역',  width: 180 },
            { key: 'expense', label: '집행',  width: 120 },
            { key: 'balance', label: '잔액',  width: 120,
              compute: (r: number, data: string[][]) => {
                const expense = Number(data[r][1]) || 0;
                if (r === 0) {
                  const v = 10000000 - expense;
                  return v.toLocaleString();
                }
                const prevRaw = data[r - 1][2].replace(/,/g, '');
                const prevBalance = Number(prevRaw) || 0;
                const v = prevBalance - expense;
                return v.toLocaleString();
              }
            },
          ] satisfies SheetColumn[]}
          .data=${[
            ['사무용품 구매',  '250000',  ''],
            ['출장비',         '1500000', ''],
            ['교육비',         '800000',  ''],
            ['장비 구매',      '3200000', ''],
            ['회의비',         '150000',  ''],
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

    .description strong {
      color: var(--u-txt-color);
    }
  `;
}
