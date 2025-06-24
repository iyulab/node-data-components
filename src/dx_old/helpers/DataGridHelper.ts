import { IColumnProps } from "devextreme-react/cjs/data-grid";
import { LookupSource } from "./ODataStoreBuilder";

export class ColumnBuilder {
  
  static DateTime(dataField: string, caption: string): IColumnProps {
    const convertToLocalTime = (value: Date | string): string => {
      if (typeof value === 'string' || value instanceof Date) {
          const utcDate = new Date(value); // UTC 기준으로 Date 객체를 생성합니다.
          const kstOffset = 9 * 60; // KST는 UTC보다 9시간 빠릅니다.
          const localDate = new Date(utcDate.getTime() + kstOffset * 60000); // UTC 시간에 9시간을 더합니다.
  
          const year = localDate.getFullYear(); // 년도
          const month = (localDate.getMonth() + 1).toString().padStart(2, '0'); // 월
          const day = localDate.getDate().toString().padStart(2, '0'); // 일
          const hours = localDate.getHours().toString().padStart(2, '0'); // 시간
          const minutes = localDate.getMinutes().toString().padStart(2, '0'); // 분
          return `${year}-${month}-${day} ${hours}:${minutes}`; // yyyy-MM-dd HH:mm 형식으로 변환합니다.
      }
      return '';
    };
    
    return {
      dataType: "datetime",
      dataField: dataField,
      caption: caption,
      format: "yyyy-MM-dd HH:mm",
      filterOperations: ["=", "<>", "<", ">", "<=", ">=", "between"],
      selectedFilterOperation: "between",
      customizeText: ({ value }) => convertToLocalTime(value) // customizeText 속성에 함수 할당
    };
  }
  
  public static String(dataField: string, caption: string): IColumnProps {
    return { dataType: "string", dataField: dataField, caption: caption };
  }

  public static Money(field: string, caption: string): IColumnProps {
    return {
      dataType: "number",
      dataField: field, 
      caption: caption, 
      format: { type: "number", formatter: (value) => value.toLocaleString() } 
    };
  }

  public static Lookup(p: {
    lookupSource: LookupSource, 
    dataField: string, 
    field: string, 
    caption: string
  }): IColumnProps {

    // 사용법:
    // ColumnBuilder.Lookup({
    //   lookupSource: productListsSource,
    //   dataField: "ProductList_key",
    //   field: "VendorNumber",
    //   caption: "중도매인번호",
    // }),
    // 풀이:
    // {
    //   dataField: "ProductList_key",
    //   caption: "중도매인번호",
    //   lookup: {
    //     dataSource: new ODataStore({
    //       url: `https://localhost:7040/$data/ProductLists`,
    //       key: "_key",
    //       version: 4,
    //     }),
    //     valueExpr: "_key",
    //     displayExpr: "VendorNumber",
    //   },
    // },

    return { 
      dataField: p.dataField, 
      caption: p.caption,
      lookup: p.lookupSource.field(p.field)
    }
  }
}