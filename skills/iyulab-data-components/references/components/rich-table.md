# u-rich-table

```ts
import '@iyulab/data-components/dist/components/u-rich-table/URichTable.js';
```

**Tag:** `u-rich-table`

Record-oriented table for **server-paged** data: selection that survives paging,
inline editing with validation, column filters, expandable detail rows and
TSV clipboard paste.

```html
<u-rich-table selectable editable filterable></u-rich-table>
```

```ts
const table = document.querySelector('u-rich-table')!;
table.columns = [
  { key: 'name',  label: 'Name',  sortable: true, editable: true, required: true },
  { key: 'state', label: 'State', type: 'badge', badgeColors: { open: 'green' } },
];
table.data = rows;          // the CURRENT page only
table.totalCount = 1240;    // the total the query matches
table.currentPage = 1;
table.pageSize = 25;
```

---

## Read this first: give every row an `_id`

The component does **not** assign row identity. Selection, expansion and row
errors are all tracked by `row._id`.

```ts
table.data = rows.map(r => ({ ...r, _id: r.documentNo }));
```

If `_id` is missing, every row's identity is `undefined`, a `Set` holds exactly
one of those — so **selecting one row appears to select all of them**. The
component falls back to the row's *position* and warns once on the console, but
position-based identity moves the selection to a different row as soon as the
data is re-sorted or re-paged.

## Read this second: the app owns the query

`u-rich-table` never fetches, sorts, filters or slices. It renders the page you
give it and tells you what the user asked for:

```ts
table.addEventListener('page-change',   e => load({ page: e.detail.page, size: e.detail.pageSize }));
table.addEventListener('sort-change',   e => load({ sort: e.detail.field, dir: e.detail.direction }));
table.addEventListener('filter-change', e => load({ filters: e.detail.filters }));
```

`totalCount` is what the pager counts — not `data.length`. Setting `data` alone
produces a table that believes it holds every matching record.

## Sizing: give the host a height

The component manages its own vertical layout. Constrain the host and the row
area is what scrolls — the toolbar and the pager keep their positions, and the
header row stays visible while rows move under it:

```css
u-rich-table { height: calc(100vh - 280px); }
```

That is the shape a query screen wants: filters above, the pager always in the
same place, and column names readable no matter how far down you are.

Leave the height off and the table grows to its content instead — no inner
scrollbar, the page scrolls. Both are supported; pick per screen. What you
should **not** do is wrap it in your own `overflow: auto` container, which puts
the header and toolbar back inside the scrolling region.

## Selection across pages

Two facts are deliberately separate, because in server paging they differ:

| What you want | Where to read it |
|---|---|
| The selected **row objects on this page** | `getSelectedRows()` / `event.detail.selectedRows` |
| Every selected **identifier**, across all pages visited | `selectedRowIds` / `event.detail.selectedIds` |

The component cannot return row objects it was never given, so a bulk action
spanning pages must work from the identifiers:

```ts
table.addEventListener('selection-change', e => {
  bulkBar.count = e.detail.selectedIds.length;   // accumulated
  preview.rows  = e.detail.selectedRows;         // this page
});

await deleteAll([...table.selectedRowIds]);
table.clearSelection();
```

The header checkbox is scoped to the **current page** — that is what makes it
truthful when the other pages are not loaded. `select-all` fires alongside
`selection-change` so the app can distinguish *"the user ticked three rows"*
from *"the user asked for everything"* and offer a "select all N matching"
affordance of its own:

```ts
table.addEventListener('select-all', e => {
  offerSelectEntireQuery.hidden = !e.detail.checked;   // e.detail.pageRowIds = this page's ids
});
```

`setSelection(ids)` replaces the accumulated set (identifiers not on the current
page are allowed). It is a no-op when the set is unchanged — without that, the
natural wiring of *listen to `selection-change` → store → write back* would loop
forever.

---

## Properties

| Property | Type | Default | Reflect | Description |
|----------|------|---------|---------|-------------|
| `columns` | `ColumnDef[]` | `[]` | | Column definitions — see *ColumnDef* below |
| `data` | `Record<string, unknown>[]` | `[]` | | Rows of the **current page**. Give each a unique `_id` |
| `totalCount` | `number` | `0` | | Total rows the query matches, across all pages |
| `pageSize` | `number` | `25` | | Rows per page |
| `currentPage` | `number` | `1` | | 1-based page number |
| `loading` | `boolean` | `false` | | Shows the loading message instead of rows |
| `emptyMessage` | `string` | `''` | | Text shown when there are no rows (falls back to the locale string) |
| `loadingMessage` | `string` | `''` | | Text shown while `loading` |
| `filterPlaceholder` | `string` | `''` | | Placeholder of the column filter inputs |
| `filterAllLabel` | `string` | `''` | | Label of the "all" option in `select` filters |
| `addRowLabel` | `string` | `''` | | Label of the add-row button |
| `pageInfoFormatter` | `(total, start, end) => string` | locale string | | Builds the pager caption. A function rather than a template, because word order differs per language |
| `selectable` | `boolean` | `false` | | Renders the selection column |
| `editable` | `boolean` | `false` | | Enables inline cell editing on columns marked `editable` |
| `addable` | `boolean` | `false` | | Renders the add-row control |
| `filterable` | `boolean` | `false` | | Renders the filter row for columns marked `filterable` |
| `expandable` | `boolean` | `false` | | Renders the expander column; pair with `detailRenderer` |
| `detailRenderer` | `(row) => TemplateResult` | — | | Renders the expanded detail row |

## Methods

| Method | Description |
|---|---|
| `getSelectedRows(): Record<string, unknown>[]` | Selected rows **on the current page** |
| `setSelection(ids: Iterable<string>): void` | Replace the accumulated selection; no-op if unchanged |
| `clearSelection(): void` | Clear it entirely, across pages |
| `setRowError(rowId, message): void` | Mark a row as failed (e.g. the server rejected a save) |
| `clearRowError(rowId): void` | Remove that mark |

## Getters

| Getter | Description |
|---|---|
| `selectedRowIds: ReadonlySet<string>` | Snapshot of every selected identifier, across pages |

## Events

All events bubble and cross shadow boundaries. `RichTableEventMap` types every
`detail`:

```ts
import type { RichTableEventMap } from '@iyulab/data-components';
type SelectionChange = RichTableEventMap['selection-change'];
```

| Event | `detail` | Fired when |
|---|---|---|
| `selection-change` | `{ selectedRows, selectedIds }` | Selection changed by any route |
| `select-all` | `{ checked, pageRowIds }` | The header checkbox was toggled |
| `sort-change` | `{ field, direction }` | A sortable header was clicked (`direction` is `null` when cleared) |
| `filter-change` | `{ filters }` | A column filter changed |
| `page-change` | `{ page, pageSize }` | The pager or page-size selector moved |
| `row-update` | `{ row, field, value, oldValue }` | An inline edit was committed |
| `row-create` | `{ row }` | The add-row control produced a row |
| `row-delete` | `{ row }` | A row was deleted |
| `row-expand` | `{ row, expanded }` | A detail row was opened or closed |
| `row-activate` | `{ row, id, via }` | A row was clicked, or `Enter` was pressed on a focused non-editable cell (`via` is `'click'` or `'keyboard'`). Independent of `selectable` — selection is "what to act on", activation is "what to view" |
| `paste` | `{ rows }` | TSV was pasted into the grid |

## ColumnDef

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Property read from the row object |
| `label` | `string` | Header text |
| `width` | `string` | CSS width |
| `type` | `'text'\|'number'\|'date'\|'select'\|'badge'` | Cell renderer and editor |
| `options` | `{ value, label }[]` | Choices for `type: 'select'` |
| `badgeColors` | `Record<string, string>` | Value → color for `type: 'badge'` |
| `align` | `'left'\|'center'\|'right'` | Cell alignment |
| `sortable` | `boolean` | Header emits `sort-change` |
| `editable` | `boolean` | Cell is editable when the table is `editable` |
| `required` | `boolean` | Empty value fails validation |
| `filterable` | `boolean` | Column appears in the filter row |
| `filterType` | `'text'\|'select'` | Filter control |
| `validator` | `(value, row) => string \| null` | Returns an error message, or `null` when valid |
| `render` | `(value, row) => string \| HTMLElement` | Custom cell rendering |
| `clipboardParse` | `(text) => unknown` | Parses a pasted cell |
| `clipboardFormat` | `(value) => string` | Formats a copied cell |

## Slots

| Name | Description |
|------|-------------|
| `bulk-actions` | Toolbar area shown while rows are selected |
| `toolbar-end` | Trailing toolbar area, always shown |

## Keyboard

| Keys | Action |
|---|---|
| Arrow keys | Move the focused cell |
| `Enter` | Editable cell: start editing / commit and move down. Non-editable cell: emit `row-activate` |
| `Escape` | Cancel editing |
| `Tab` | Commit and move to the next cell |
| `Space` | Toggle selection of the focused row (when `selectable`) |
| `Delete` | Emit `row-delete` for every selected row |
| `Ctrl`/`Cmd` + `A` | Select every row **on this page** — same scope as the header checkbox |
| `Ctrl`/`Cmd` + `C` | Copy the selection as TSV |
| `Ctrl`/`Cmd` + `V` | Paste TSV (emits `paste`) |

## Localization

`emptyMessage`, `loadingMessage`, `filterPlaceholder`, `filterAllLabel` and
`addRowLabel` default to `''` and fall back to the package's locale strings —
set them only to override the translation for a specific table.
