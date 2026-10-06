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

## Read this second: the app owns the query — unless you hand the table the whole set

By default (`data-mode="server"`) `u-rich-table` never fetches, sorts, filters or
slices. It renders the page you give it and tells you what the user asked for:

```ts
table.addEventListener('page-change',   e => load({ page: e.detail.page, size: e.detail.pageSize }));
table.addEventListener('sort-change',   e => load({ sort: e.detail.field, dir: e.detail.direction }));
table.addEventListener('filter-change', e => load({ filters: e.detail.filters }));
```

`totalCount` is what the pager counts — not `data.length`. Setting `data` alone
produces a table that believes it holds every matching record.

The component doesn't virtualize, either — it puts one `<tr>` in the DOM per
entry in `data`. If you already hold the full result set in memory, slice it
yourself before assigning `data`:

```ts
table.data = allRows.slice((page - 1) * pageSize, page * pageSize);
table.totalCount = allRows.length;
```

When the whole list is already loaded and narrowing it is the entire interaction,
set `data-mode="client"` instead and skip the wiring above: `data` is the full set,
and the table applies the filter row (`filterType: 'select'` matches the value, text
matches case-insensitively as a substring), sorting (`type: 'number'` / `'date'`
columns compare as numbers / dates) and paging itself. `totalCount` is ignored and
the pager counts the filtered rows; a new filter returns to page 1. The events still
fire. Rows without an `_id` keep their selection through filtering and sorting,
because the position used is the row's place in `data`.

```html
<u-rich-table data-mode="client" filterable .columns=${columns} .data=${allRows}></u-rich-table>
```

Binding tens of thousands of rows straight to `data` renders that many `<tr>`s
in one pass and freezes the tab while it does. If the screen actually needs to
scroll through that many rows without paging clicks, `u-rich-table` is the
wrong component — use `@iyulab/flex-table`, which virtualizes rendering for
100,000+ rows.

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

**Printing.** Paper has no scroll: a height you give the host still applies on
print media, so the row area prints only what fits in it (measured: a 300px
table printed 283px of a 2067px row area). Scope the height to the screen when
the screen can be printed — the table then prints at its content height:

```css
@media screen {
  u-rich-table { height: calc(100vh - 280px); }
}
```

The same applies to `u-data-view`.

## Column widths

Give **every** column an absolute width and each one is honoured exactly; when they add up to more
than the component, the row area scrolls sideways and the toolbar, header and pager stay put:

```ts
columns = [
  { key: 'id',     label: 'Order',   width: '120px' },
  { key: 'status', label: 'Status',  width: '140px' },
  { key: 'total',  label: 'Total',   width: '120px' },
];
```

**It has to be every column, and the units have to be absolute** (`px`, `rem`, `em`, `ch`, …).
That is not a style preference — it is what makes the guarantee possible:

- Leave one column without a width and the table stays in its default sizing mode, where widths are
  hints that compete with cell content. Measured at 600px wide with 17 columns declared `120px`
  each, the columns render at **71px** in that mode — the declaration loses.
- Percentages are resolved against the component, so "the widths add up to more than the container"
  can never be true for them. They keep the default mode too.
- A number (`width: 150`) is pixels, so it counts as absolute.

Nothing changes for tables that don't meet the condition, and nothing changes for a table whose
declared widths already fit — there the columns share the leftover space as before.

### A column that takes the rest — `minWidth`

The usual line-of-business table has one column that should take whatever space is left (customer,
item, note) but must not be squeezed to nothing on a phone. Give it a floor instead of a width:

```ts
columns = [
  { key: 'id',    label: 'Order', width: 100 },
  { key: 'item',  label: 'Item',  minWidth: 200 },   // flexible: the rest, never below 200px
  { key: 'qty',   label: 'Qty',   width: 80 },
];
```

- A column with `minWidth` and no `width` counts as "known" for the rule above, so the table keeps
  its declared widths: the fixed columns stay exact and the flexible one takes the leftover space.
- When the container is narrower than the fixed widths plus the floors, the row area scrolls — the
  flexible column does not wrap its text letter by letter.
- Several flexible columns share the leftover space equally, and none goes below its own floor.
- With `width` as well, the column is `max(width, minWidth)`.
- A column with neither still puts the whole table in the default mode.

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
| `dataMode` | `'client' \| 'server'` | `'server'` | | Who applies the filter row, sorting and paging (attribute `data-mode`) — `'client'`: the table does, over `data` as the whole set (`0.27.0~`) |
| `loading` | `boolean` | `false` | | Shows the loading message instead of rows |
| `emptyMessage` | `string` | `''` | | Text shown when there are no rows (falls back to the locale string) |
| `noMatchMessage` | `string` | `''` | | `data-mode="client"`: text shown when `data` has rows but none pass the filters — a different state from "no data" (falls back to the locale string) |
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
| `detailRenderer` | `(row) => TemplateResult \| HTMLElement \| string` | — | | Renders the expanded detail row. In `URichTableReact` it may also return a `ReactNode`, mounted per row while the row is expanded and unmounted when it collapses or leaves `data` |
| `deletable` | `boolean` | `false` | | Declares a table that handles row deletion: renders a trash-can delete button (accessible name "Delete row"; a "⋯" before `0.33.0`) and enables the `Delete` key (`0.25.0~`) |
| `rowActions` | `RowAction[]` | — | | Configures the action-cell buttons (`0.20.0~`) — see *RowAction* below |

## CSS Parts

| Part | Description |
|------|-------------|
| `sort-button` | A column header's sort toggle |

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
| `filteredRowCount: number` | Rows that pass the filter row — the table's own count across pages in `data-mode="client"`, `totalCount` otherwise |

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
| `filter-change` | `{ filters, filteredCount? }` | A column filter changed. `filteredCount` is present in `data-mode="client"` |
| `page-change` | `{ page, pageSize }` | The pager or page-size selector moved |
| `row-update` | `{ row, field, value, oldValue }` | An inline edit was committed |
| `row-create` | `{ row }` | The add-row control produced a row |
| `row-delete` | `{ row }` | The trash-can delete button was clicked, or `Delete` was pressed on selected rows (only when `deletable`) |
| `row-expand` | `{ row, expanded }` | A detail row was opened or closed |
| `row-activate` | `{ row, id, via }` | A row was clicked, or `Enter` was pressed on a focused non-editable cell (`via` is `'click'` or `'keyboard'`). Independent of `selectable` — selection is "what to act on", activation is "what to view" |
| `clipboard-paste` | `{ rows }` | `Ctrl`/`Cmd` + `V` outside an editor: the pasted TSV, parsed into rows for the app to insert. Named apart from the native `paste`, which also bubbles out of the cell editors |
| `clipboard-error` | `{ action: 'copy' \| 'paste', error }` | Neither the browser's clipboard event nor the Clipboard API took (or gave) the text |

## ColumnDef

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Property read from the row object |
| `label` | `string` | Header text |
| `width` | `number\|string` | A number is pixels (as in `@iyulab/flex-table`); a string is a CSS length (`'120px'`, `'8rem'`). See [Column widths](#column-widths) for when it is honoured exactly |
| `minWidth` | `number\|string` | Floor for the column, same units as `width`. Without `width` the column is flexible — it takes the leftover space and never narrows below the floor. See [A column that takes the rest](#a-column-that-takes-the-rest--minwidth) |
| `type` | `'text'\|'number'\|'date'\|'select'\|'badge'` | Cell renderer and editor |
| `options` | `{ value, label }[]` | Choices for `type: 'select'` |
| `badgeColors` | `Record<string, string>` | Value → color for `type: 'badge'` |
| `align` | `'start'\|'center'\|'end'` | Cell alignment — logical, so right-to-left locales mirror. Default: `'end'` for `type: 'number'`, otherwise `'start'` |
| `headerAlign` | `'start'\|'center'\|'end'` | Header alignment. Default: the cell alignment, so a header sits over its values |
| `sortable` | `boolean` | Header emits `sort-change` |
| `editable` | `boolean` | Cell is editable when the table is `editable` |
| `required` | `boolean` | Empty value fails validation |
| `filterable` | `boolean` | Column appears in the filter row |
| `filterType` | `'text'\|'select'` | Filter control |
| `validator` | `(value, row) => string \| null` | Returns an error message, or `null` when valid |
| `render` | `(value, row) => string \| HTMLElement` | Custom cell rendering |
| `clipboardParse` | `(text) => unknown` | Parses a pasted cell |
| `clipboardFormat` | `(value) => string` | Formats a copied cell |

## RowAction

Configures the action cell (right edge of each row). The action cell exists only when the table
declares an action (`0.25.0~`): `deletable`, `rowActions`, or both. With neither, there is no
action column at all — header and rows.

⚠ Up to `0.24.x`, a table without `rowActions` always rendered a "⋯" delete button, so read-only
tables put a non-working "Delete row" button in the tab order on every row. If you handle
`row-delete`, add `deletable`.

Set `rowActions` for your own buttons:

| Field | Type | Description |
|---|---|---|
| `event` | `string` | Custom event name dispatched on click (`{ detail: { row } }`, bubbles + composed) |
| `label` | `string` | Button label, also used as the accessible name |
| `icon` | `string` | Symbol shown on the button — defaults to `label`'s first character |

```ts
table.rowActions = [
  { event: 'row-edit', label: 'Edit', icon: '✎' },
  { event: 'row-archive', label: 'Archive', icon: '🗄' },
];
table.addEventListener('row-edit', (e) => editRow(e.detail.row));
```

Each action fires only its own `event` — none of them fall back to `row-delete`. Add
`deletable` if you also want the built-in delete button; it goes after your actions.

## Slots

| Name | Description |
|------|-------------|
| `bulk-actions` | Toolbar area shown while rows are selected |
| `toolbar-end` | Trailing toolbar area, always shown |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--dc-font-size` | Body cell / edit input font size, shared with the edit control so the size doesn't jump on entering edit mode (default `--u-density`, `13px`) |
| `--dc-muted-color` | Secondary text — pager caption, disabled affordances (default `--u-txt-color-weak`) |
| `--dc-icon-color` | Sort indicator, expander, row-menu icon color (default `--u-txt-color-weak`) |
| `--dc-empty-color` | Empty-state message color (default `--u-txt-color-weak`) |

## Keyboard

The table is a data grid with one Tab stop (WAI-ARIA APG Grid): the focused cell — the first data cell
before any, or the first header cell when the body is empty. Clicking a cell or moving with the arrows
puts keyboard focus on that cell, and the keys below apply to keys pressed on a cell. **`Tab` on a cell
leaves the table**; only while editing does `Tab` walk the cells. (The spreadsheet model, where `Tab`
always moves to the next cell, is `u-simple-sheet`'s.)

The header row and the filter row are rows of the grid: ↑ from the first data row reaches the filter
row, then the header row. Their widgets — select all, sort, filter boxes — are not Tab stops. On a
header cell `Enter`/`Space` sorts (or toggles select-all); on a filter cell typing goes into the filter
box, `Enter`/`F2` enters it, and `Escape` returns to the cell.

The row checkbox, the expand button and the row-actions buttons sit in cells of their own and are
reached with the arrows, not Tab: ← from the first data cell lands on the selection cell (Space
toggles the row), Enter on the expand cell opens or closes the detail row, and Enter on the
row-actions cell moves into its buttons (← / → between them, Enter presses one, Escape returns to the
cell). In a filter box keys are the box's own (arrows move the caret, Space types, Delete deletes
text, `Ctrl`/`Cmd` + `A` selects the text). Ending an edit with Enter or Escape returns focus to the
cell.

| Keys | Action |
|---|---|
| Arrow keys | Move the focused cell |
| `Enter` | Editable cell: start editing / commit and move down. Non-editable cell: emit `row-activate` |
| `Escape` | Cancel editing (in a date editor with its calendar open: close the calendar) |
| `Tab` / `Shift` + `Tab` | On a cell: leave the table. While editing: commit and edit the next / previous editable cell, wrapping across rows — on the last editable cell (`Shift` + `Tab`: the first) commit and leave the table |
| `Space` | Toggle selection of the focused row (when `selectable`) |
| `Delete` | Emit `row-delete` for every selected row (when `deletable`) |
| `Ctrl`/`Cmd` + `A` | Select every row **on this page** — same scope as the header checkbox |
| `Ctrl`/`Cmd` + `C` | Copy the selection as TSV |
| `Ctrl`/`Cmd` + `V` | Paste TSV (emits `clipboard-paste`) |

An edit that fails validation (`required`, `validator`, or text that is not a date) stays on its
cell with the message; Enter and Tab move on only after a commit.

A `type: 'date'` column edits with `u-date-picker` from `@iyulab/components`: a text box that shows
and reads `YYYY-MM-DD` in every browser language (it also reads short forms such as `20261231` and
`10-02`), with a calendar beside it — a day picked there is the new value. The committed value is
the ISO day string, as before. Leaving an empty cell empty is not an edit (no `row-update`).

## Localization

`emptyMessage`, `noMatchMessage`, `loadingMessage`, `filterPlaceholder`, `filterAllLabel` and
`addRowLabel` default to `''` and fall back to the package's locale strings —
set them only to override the translation for a specific table.
