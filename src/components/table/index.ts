import { Table } from "./Table";

Table.define("u-table");

declare global {
  interface HTMLElementTagNameMap {
    "u-table": Table;
  }
}

export { Table };