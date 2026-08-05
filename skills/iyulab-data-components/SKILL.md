---
name: iyulab-data-components
description: Data-oriented web components built on Lit — a server-paged rich table with inline editing and cross-page selection, a spreadsheet-like grid, and a multi-layout data viewer. Use when working with @iyulab/data-components package.
license: MIT
metadata:
  author: iyulab
  version: "0.12.0"
---

# @iyulab/data-components

Three custom elements for displaying and editing tabular data. Built on
[Lit](https://lit.dev/); usable from any framework or plain HTML.

## Install

```bash
npm install @iyulab/data-components
```

## Which component do I use?

| Tag | Use it when | Reference |
|---|---|---|
| `u-rich-table` | The rows come from a **server** — paging, sorting and filtering are the app's job, and you need selection, inline editing or expandable detail rows | [rich-table.md](references/components/rich-table.md) |
| `u-simple-sheet` | The data is a **free-form grid** of cells the user types into, spreadsheet-style (fill handle, ranges, clipboard) | [simple-sheet.md](references/components/simple-sheet.md) |
| `u-data-view` | You are **displaying** records and want to switch between grid / list / table layouts without rebuilding markup | [data-view.md](references/components/data-view.md) |

`u-rich-table` and `u-simple-sheet` overlap only superficially. The table is
**record-oriented** (a row is an object with named columns, and the app owns the
query); the sheet is **cell-oriented** (a row is an array of strings, and the
component owns the grid).

## Importing

Import the barrel to register every element:

```ts
import '@iyulab/data-components';
```

…or import one element to keep the bundle small:

```ts
import '@iyulab/data-components/dist/components/u-rich-table/URichTable.js';
```

Registration is a **module side effect** (`@customElement`), so the import must
not be elided — do not mark this package as side-effect-free in a bundler
config, or the elements silently never register.

## Types

Every type the public API asks for is exported from the package root:

```ts
import type {
  ColumnDef, CellPosition, SortState, FilterState, RichTableEventMap,
} from '@iyulab/data-components';
```

Do **not** deep-import from `dist/components/...` for types. The subpath exists,
but it turns the internal layout into a contract you depend on.

## Theming

Colors come from the `@iyulab/components` design tokens (`--u-*`) and follow the
active theme automatically. Per-component knobs are listed in each reference
document under *CSS Custom Properties*.
