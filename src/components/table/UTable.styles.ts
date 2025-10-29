import { css } from 'lit';

export const styles = css`
  /* Table.scss */

  /* 테이블 컨테이너 스타일 */
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    font-family: 'Noto Sans', sans-serif;
    font-family: 'Noto Sans KR', sans-serif;
  }

  /* 테이블 메뉴 스타일 */
  .menu {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;
    user-select: none;

    /* 테이블 메뉴 선택갯수 */
    .item-count {
      font-size: 14px;
      color: #888;
      padding: 0 1px;
      margin-left: 5px;
    }

    /* 테이블 메뉴 버튼 */
    .table-buttons {
      margin-right: 5px;
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;

      .button {
        display: block;
        width: 26px;
        height: 26px;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: var(--sl-color-neutral-0);
        transition: background-color 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        fill-rule: evenodd;

        &:hover {
          background-color: var(--sl-color-gray-100);
          transform: scale(1.05);
        }

        &:active {
          transform: scale(0.9);
        }
      }
    }
  }
    
  /* 테이블 스타일 */
  .table {
    position: relative;
    width: 100%;
    border-collapse: collapse;

    /* 테이블 헤더 스타일 */
    .header {
      user-select: none;
      border-top: 1px solid var(--sl-color-gray-200);
      border-bottom: 1px solid var(--sl-color-gray-200);

      /* 테이블 헤더 로우 스타일 */
      .header-row {
        position: relative;
        height: 40px;

        /* 테이블 로딩 스타일 */
        .loading-container {
          display: none;
          justify-content: center;
          align-items: center;
          position: absolute;
          z-index: 1;
          top: 40px;
          left: 0;
          width: 100%;
          height: 60px;
          background-color: transparent;
          padding: 10px 0px;

          &.active {
            display: flex;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 5px solid #3498db;
            border-top: 5px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          /* 로딩 애니메이션 정의 */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }

        /* 테이블 헤더 셀 스타일 */
        .header-content {
          position: relative;
          min-width: 20px;
          vertical-align: middle;
          padding: 0 10px;

          /* 헤더 셀 체크박스 스타일 */
          .header-checkbox {
            width: 20px;
            text-align: center;
          }

          /* 헤더 셀 번호 스타일 */
          .header-number {
            width: 30px;
            text-align: center;
            font-size: 14px;
            font-weight: 600;
          }

          /* 헤더 셀 스타일 */
          .header-flex {
            display: flex;
            flex-direction: row;
            align-items: center;

            &:hover {
              .filter-menu {
                opacity: 1;
              }
            }

            /* 헤더 타이틀 */
            .header-title {
              flex-grow: 1;
              display: -webkit-box;
              -webkit-line-clamp: 2; /* 라인수 */
              -webkit-box-orient: vertical;
              font-size: 14px;
              font-weight: 600;
              overflow: hidden;
            }

            /* 헤더 정렬 메뉴 */
            .sort-menu {
              width: 12px;
              height: 12px;
              cursor: pointer;
              margin-right: 10px;

              &:hover {
                opacity: 0.5;
              }
              
              &.trans {
                transform: rotate(180deg);
              }

              path {
                fill: currentColor;
                fill-rule: evenodd;
              }
            }

            /* 헤더 필터 메뉴 */
            .filter-menu {
              opacity: 0;
              width: 18px;
              height: 18px;
              cursor: pointer;

              &:hover {
                opacity: 0.5;
              }

              &.active {
                opacity: 1;
              }

              &.selected {
                opacity: 1;
              }

              path {
                fill: currentColor;
                fill-rule: evenodd;
              }
            }
          }

          /* 헤더 셀 너비 조절 스타일 */
          .width-control {
            opacity: 0;
            position: absolute;
            z-index: 1;
            top: 0px;
            right: -4px;
            width: 8px;
            height: 100%;
            cursor: col-resize;

            &:hover {
              opacity: 1;
            }

            &.active {
              opacity: 1;
            }

            &::before {
              content: "";
              position: absolute;
              z-index: 1;
              top: 0;
              left: 3px;
              width: 2px;
              height: 100%;
              background-color: var(--sl-color-gray-200);
            }
          }
        }
      }
    }

    /* 테이블 바디 스타일 */
    .body {
      /* 테이블 바디 로우 스타일 */
      .body-row {
        position: relative;
        height: 40px;
        border-bottom: 1px solid var(--sl-color-gray-200);

        &:hover {
          background-color: var(--sl-color-gray-100);

          .body-content {
            .button-cell {
              opacity: 1;
            }
          }
        }

        &.select {
          background-color: var(--sl-color-gray-200);

          &::after {
            content: "";
            position: absolute;
            z-index: 1;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background-color: cornflowerblue;
            opacity: 0.5;
          }
        }

        /* 테이블 바디 셀 스타일 */
        .body-content {
          vertical-align: middle;
          padding: 0 10px;

          /* 셀 체크박스 스타일 */
          .body-checkbox {
            width: 20px;
            text-align: center;
          }

          /* 셀 번호 스타일 */
          .body-number {
            width: 30px;
            text-align: center;
            font-size: 14px;
            font-weight: 300;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* 셀 기본 스타일 */
          .basic-cell {
            display: -webkit-box;
            -webkit-line-clamp: 2; /* 라인수 */
            -webkit-box-orient: vertical;
            font-size: 14px;
            font-weight: 300;
            overflow: hidden;
            overflow-wrap: anywhere;
          }

          /* 셀 뱃지 스타일 */
          .badge-cell {
            display: inline-block;
            min-width: 30px;
            max-width: 80px;
            height: 20px;
            line-height: 20px;
            vertical-align: middle;
            padding: 3px 5px;
            border-radius: 5px;
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            background-color: red;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            user-select: none;
          }

          /* 셀 이미지 스타일 */
          .img-cell {
            padding: 5px;
            object-fit: cover;
            vertical-align: -webkit-baseline-middle;
          }

          /* 셀 버튼 스타일 */
          .button-cell {
            opacity: 0;
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;

            .button {
              display: block;
              width: 24px;
              height: 24px;
              cursor: pointer;
              fill-rule: evenodd;

              &:hover {
                opacity: 0.5;
              }
            }
          }
        }

        /* 테이블 데이터 Not Found */
        .body-none {
          font-size: 16px;
          height: 200px;
          text-align: center;
          vertical-align: middle;
          border-bottom: 1px solid var(--sl-color-gray-200);

          .not-found {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 10px;

            .icon {
              width: 48px;
              height: 48px;
              fill: currentColor;
              fill-rule: evenodd;
            }
          }
        }

        /* 로우 높이 조절 스타일 */
        .height-control {
          opacity: 0;
          position: absolute;
          z-index: 1;
          left: 0px;
          bottom: -4px;
          width: 100%;
          height: 8px;
          cursor: row-resize;

          &:hover {
            opacity: 1;
          }

          &.active {
            opacity: 1;
          }

          &::before {
            content: "";
            position: absolute;
            z-index: 1;
            top: 5px;
            width: 100%;
            height: 2px;
            background-color: var(--sl-color-gray-200);
          }
        }
      }
    }
  }

  /* 테이블 푸터 스타일 */
  .footer {
    width: 100%;
    margin-top: 20px;
    user-select: none;

    /* 테이블 페이지네이션 스타일 */
    .pagination {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      font-size: 14px;
    
      /* 테이블 페이지 제한 스타일 */
      .per-page {
        display: flex;
        flex-direction: row;
        align-items: center;

        .text {
          font-size: 16px;
        }
      }

      /* 테이블 페이지 네비게이션 스타일 */
      .navigate-page {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 0px 20px;

        .text {
          font-size: 16px;
          margin-right: 5px;
        }

        .first-page,
        .last-page {
          width: 20px;
          height: 20px;
          cursor: pointer;
          fill: currentColor;
          fill-rule: evenodd;

          &:hover {
            opacity: 0.5;
          }
        }

        .before-page,
        .next-page {
          cursor: pointer;
          width: 20px;
          height: 20px;
          fill: currentColor;
          fill-rule: evenodd;

          &:hover {
            opacity: 0.5;
          }
        }
      }

      /* 테이블 페이지 정보 입력 스타일 */
      .page-info {
        margin: 0px 5px;
        display: flex;
        flex-direction: row;
        align-items: center;
        border: 1px solid var(--sl-color-gray-200);
        border-radius: 5px;

        .page-input {
          width: 30px;
          height: 20px;
          border: none;
          outline: none;
          background-color: transparent;
          text-align: center;
          color: currentColor;
          appearance: none;
          -moz-appearance: textfield;

          &::-webkit-inner-spin-button {
            -webkit-appearance: none;
          }
        }

        .button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 30px;
          border-left: 1px solid var(--sl-color-gray-200);
          cursor: pointer;

          &:hover {
            background-color: var(--ui-subtle-hover);
          }
        }
      }
    }
  }
`;