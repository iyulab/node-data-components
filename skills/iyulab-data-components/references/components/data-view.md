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
view.items = records;
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

## Display only

`u-data-view` renders records; it does not select, sort, page or emit events.
When the user needs to act on rows — selection, inline edit, server paging — use
[`u-rich-table`](./rich-table.md).

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

## Properties

| Property | Type | Default | Reflect | Description |
|----------|------|---------|---------|-------------|
| `items` | `DataItem[]` | `[]` | | Records to display. `DataItem` is `Record<string, any>` — the component deliberately does not constrain the app's domain type |
| `mode` | `'grid'\|'list'\|'table'` | `'grid'` | | Current layout |
| `columns` | `DataColumn[]` | — | | Columns for `mode="table"`; inferred from the first item when omitted |
| `gridMinWidth` | `string` | `'200px'` | | Minimum card width in `mode="grid"` (CSS length) |
| `gap` | `string` | `'1rem'` | | Gap between cards or rows (CSS length) |
| `renderCard` | `(item, index) => TemplateResult` | — | | Replaces card content in `grid` / `list` |
| `renderCell` | `(item, column, index) => TemplateResult \| string` | — | | Replaces cell content in `table` |

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
| `width` | `string` | CSS width |
