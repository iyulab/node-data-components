# u-simple-sheet

```ts
import '@iyulab/data-components/dist/components/simple-sheet/USimpleSheet.js';
```

**Tag:** `u-simple-sheet`

Spreadsheet-like grid of text cells: range selection, fill handle, clipboard
copy/paste, per-column dropdowns, computed columns, display formatting,
resizable columns and undo/redo history.

```html
<u-simple-sheet rows="30" cols="6"></u-simple-sheet>
```

```ts
const sheet = document.querySelector('u-simple-sheet')!;
sheet.columns = [
  { key: 'item',  label: 'Item',  width: 180 },
  { key: 'qty',   label: 'Qty',   format: { maximumFractionDigits: 0 } },
  { key: 'price', label: 'Price', format: { style: 'currency', currency: 'USD' } },
  { key: 'total', label: 'Total', compute: (row, data) => String(+data[row][1] * +data[row][2]) },
  { key: 'state', label: 'State', options: ['draft', 'sent'], strict: true },
];
sheet.addEventListener('change', e => save(sheet.getDataAsObjects()));
```

The data is a **2-D array of strings** — the sheet stores what the user typed and
never coerces it. `format` changes only what is displayed; `getData()` returns
the raw values.

## Cell-oriented, not record-oriented

Use `u-simple-sheet` when the grid itself is the input surface (an estimate, a
bulk-entry form, a paste target). When rows are records fetched page by page
from a server, use [`u-rich-table`](./rich-table.md) instead.

## Properties

| Property | Type | Default | Reflect | Description |
|----------|------|---------|---------|-------------|
| `data` | `string[][]` | `[]` | | Initial cell values, row-major |
| `columns` | `SheetColumn[]` | — | | Column definitions; omit for generic `A`, `B`, `C`… columns |
| `rows` | `number` | `20` | | Row count when `data` is shorter |
| `cols` | `number` | `10` | | Column count when neither `data` nor `columns` says otherwise |
| `readonly` | `boolean` | `false` | | Blocks editing, paste and fill |
| `noMatchMessage` | `string` | `''` | | Text shown when a `strict` dropdown has no match (falls back to the locale string) |
| `theme` | `'light'\|'dark'` | — | ✓ | Forces a theme. Unset follows the ancestor `theme`/`data-theme` context (`:host-context`, Chromium only) |

## Methods

| Method | Description |
|---|---|
| `getData(): string[][]` | Current values as a copied 2-D array |
| `getDataAsObjects(): Record<string, string>[]` | Rows keyed by `SheetColumn.key` (or `A`, `B`, `C`… when `columns` is unset) |
| `setData(data: string[][]): void` | Replace all values and re-render |
| `setCell(row, col, value): void` | Set one cell — recomputes, pushes history and emits `change` |
| `getSelection(): { minRow, maxRow, minCol, maxCol } \| null` | Current range, normalized |
| `setSelection(range): void` | Select a range programmatically (clamped to the grid) |
| `selectAll(): void` | Select every cell |

## Getters

| Getter | Description |
|---|---|
| `canUndo: boolean` | History has an earlier state |
| `canRedo: boolean` | History has a later state |

## Events

| Event | `detail` | Fired when |
|---|---|---|
| `change` | `{ data: string[][] }` | Any edit, paste, fill or `setCell()` committed a value |

## SheetColumn

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Object key used by `getDataAsObjects()` |
| `label` | `string` | Header text |
| `width` | `number` | Column width in px |
| `readonly` | `boolean` | Column cannot be edited |
| `options` | `string[] \| ((row, col) => string[])` | Dropdown choices, static or per cell |
| `strict` | `boolean` | Only listed options may be entered (default: free text) |
| `compute` | `(rowIndex, data) => string` | Derived value. Makes the column read-only; evaluated left→right, top→bottom |
| `format` | `Intl.NumberFormatOptions \| ((value, rowIndex) => string)` | Display formatting only — the stored value is untouched |

## Keyboard

| Keys | Action |
|---|---|
| Arrow keys | Move the active cell |
| `Shift` + arrows | Extend the selection |
| `Home` / `End` | Jump to the first / last column |
| `PageUp` / `PageDown` | Jump a screenful of rows |
| `Enter` / `F2` | Start editing; `Enter` again commits and moves down |
| `Escape` | Cancel editing |
| `Tab` | Commit and move right (`Shift` + `Tab` moves left) |
| `Delete` / `Backspace` | Clear the selected cells |
| `Ctrl`/`Cmd` + `C` / `V` | Copy / paste the selection as TSV |
| `Ctrl`/`Cmd` + `Z` | Undo (`Shift` + `Ctrl`/`Cmd` + `Z` redoes) |
| `Ctrl`/`Cmd` + `Y` | Redo |
| `Ctrl`/`Cmd` + `D` / `R` | Fill down / fill right from the selection |
| `Ctrl`/`Cmd` + `A` | Select every cell |

Cut (`Ctrl`/`Cmd` + `X`) is not handled — copy, then `Delete`.
