# u-data-view

```ts
import '@iyulab/data-components/dist/components/data-view/UDataView.js';
```

**Tag:** `u-data-view`

Read-only viewer that renders the same records as a card **grid**, a **list**, or
a **table**, without the app rebuilding markup per layout.

```html
<u-data-view mode="list"></u-data-view>
```

```ts
const view = document.querySelector('u-data-view')!;
view.data = records;
view.columns = [           // used by mode="table"; inferred from the first item when omitted
  { key: 'name',  label: 'Name' },
  { key: 'owner', label: 'Owner', width: '160px' },
];
```

A toolbar above the content shows the item count and one button per layout;
clicking a button sets `mode`. `mode` is also a plain property, so the app can
set it directly and persist the user's choice.

Switching layout is a **local** interaction — the component does not emit an
event for it. Read `view.mode` when you need the current layout.

Cell and card rendering can be replaced without giving up the layout logic:

```ts
view.renderCard = (item, index) => html`<strong>${item.name}</strong>`;
view.renderCell = (item, column) => column.key === 'size' ? formatBytes(item.size) : item[column.key];
```

## Opening a record

A click on a card, list item or table row, or Enter on the focused one, fires `row-activate` — the same event, with
the same detail, as `u-rich-table` and `flex-table`, so a list that opens a record behaves the same in whichever view
shows it:

```ts
view.addEventListener('row-activate', (e) => openDetail(e.detail.id)); // { row, id, via: 'click' | 'keyboard' }
```

`id` is the record's `_id` (`#<index>` when it has none). A click on a control an item renders (a link, a button) is
that control's, not an activation. The records are one Tab stop: Tab reaches the first (or last focused) record,
arrow keys move between records, Home / End jump to the ends. The layout switcher above them is one Tab stop too — a
named toolbar whose buttons the arrow keys move between — so the whole component takes two Tabs to pass.

It does not select, sort, page or edit — for that use [`u-rich-table`](./rich-table.md).

## Sizing

Content-sized by default: leave the height off and the component grows with the items, and the
page scrolls. Constrain the host and the **content area** is what scrolls — the toolbar keeps its
position above it:

```css
u-data-view { height: calc(100vh - 280px); }
```

This holds in **all three modes**. `mode="table"` also scrolls horizontally when the columns are
wider than the host.

⚠ Because the content area is a scroll container, a card's hover lift and shadow are clipped at
that container's edges — the cost of keeping the content reachable when a height is given.

[`u-rich-table`](./rich-table.md) follows the same contract, so a layout transfers between them
unchanged.

A height given to the host also applies when printing, so the content area prints only what fits
in it. On a screen that can be printed, give the height inside `@media screen { … }` and the
component prints at its content height.

## Properties

| Property | Type | Default | Reflect | Description |
|----------|------|---------|---------|-------------|
| `data` | `DataItem[]` | `[]` | | Records to display — the same name as both tables' `data` (one page for a server-paged list). `DataItem` is `Record<string, any>` — the component deliberately does not constrain the app's domain type |
| `totalCount` | `number` | — | | What the toolbar's item count counts; `data.length` when omitted. A server-paged list passes the source's `totalCount` |
| `loading` | `boolean` | `false` | | Shows `loadingMessage` in place of the content |
| `loadingMessage` | `string` | `''` | | Loading text; the locale string when empty |
| `error` | `{ message: string } \| null` | `null` | | The last load failure — shown as an alert (`role="alert"`) in place of the content, so a failed query does not read as "no data". A data source's `error` as is |
| `emptyMessage` | `string` | `''` | | Text for an empty `data`; the locale string when empty |
| `hideToolbar` | `boolean` | `false` | | Leaves out the built-in toolbar (layout switcher and item count) — for a list that switches views and counts results itself (`u-list-page`'s `view`, a bound `u-pagination`). `mode` still sets the layout. Attribute `hide-toolbar` |
| `mode` | `'grid'\|'list'\|'table'` | `'grid'` | | Current layout |
| `columns` | `DataColumn[]` | — | | Columns for `mode="table"`; inferred from the first item when omitted |
| `gridMinWidth` | `string` | `'200px'` | | Minimum card width in `mode="grid"` (CSS length) |
| `gap` | `string` | `'1rem'` | | Gap between cards or rows (CSS length) |
| `renderCard` | `(item, index) => TemplateResult` | — | | Replaces card content in `grid` / `list` |
| `renderCell` | `(item, column, index) => TemplateResult \| string` | — | | Replaces cell content in `table` |

## Events

| Event | Detail | When |
|---|---|---|
| `row-activate` | `{ row, id, via }` | A record was opened — clicked (`via: 'click'`) or Enter on the focused record (`'keyboard'`). Typed by `DataViewEventMap`; React `onRowActivate` |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--dc-muted-color` | Secondary text/labels (default `--u-txt-color-weak`) |
| `--dc-header-color` | Column/row headers in `mode="table"` (default `--u-txt-color-weak`) |
| `--dc-empty-color` | Empty-state message (default `--u-txt-color-weak`) |

⚠ Grid gap and card min-width are set via the `gap`/`gridMinWidth` properties (applied as
inline styles), not custom properties — a stylesheet override of `--gap`/`--min-width` would
lose to them.

## DataColumn

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Property read from the item |
| `label` | `string` | Header text (defaults to `key`) |
| `width` | `number\|string` | A number is pixels; a string is a CSS width |
