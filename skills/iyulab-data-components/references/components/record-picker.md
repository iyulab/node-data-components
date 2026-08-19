# u-record-picker

```ts
import '@iyulab/data-components/dist/components/u-record-picker/URecordPicker.js';
```

**Tag:** `u-record-picker`

Form control that picks one record from a remote-searched list. Typing filters an inline
dropdown; Enter (with nothing highlighted) or the trailing find button opens a modal lookup
dialog backed by [`u-rich-table`](./rich-table.md). Form-associated.

```html
<u-record-picker label="Owner" placeholder="Search people…" clearable></u-record-picker>
```

```ts
const picker = document.querySelector('u-record-picker')!;
picker.search = async (query) => {
  const res = await fetch(`/api/people?q=${encodeURIComponent(query)}`);
  const rows = await res.json();
  return rows.map((r) => ({ id: r.id, label: r.name, ...r }));
};
picker.columns = [                 // used by the lookup dialog's u-rich-table
  { key: 'name',  label: 'Name' },
  { key: 'email', label: 'Email' },
];
```

The inline dropdown and the lookup dialog share the single `search` callback — one async
lookup, two entry points. Both keyboard (`ArrowDown`/`ArrowUp`/`Enter`/`Escape` inline) and
mouse work; a single click on a dialog row previews the selection without closing the dialog,
and only the Confirm button or a row double-click commits it.

## Display only vs. actionable

The dialog's table only previews and commits a row — it does not expose `u-rich-table`'s own
edit affordances. If a `columns` entry marks a column `editable`, a double-click on that cell
enters cell-edit mode **and** commits the dialog selection at the same time (the two gestures
are not distinguished) — avoid `editable` columns in `u-record-picker`'s `columns` until this
is resolved.

## Properties

| Property | Type | Default | Reflect | Description |
|----------|------|---------|---------|-------------|
| `search` | `(query: string) => Promise<PickerItem[]>` | — | — | Async lookup, shared by the inline dropdown and the dialog's search bar. Required |
| `columns` | `ColumnDef[]` | `[]` | — | Column definitions for the lookup dialog's `u-rich-table` (same shape as `u-rich-table`) |
| `dialogTitle` | `string` | — | — | Lookup dialog header title (attribute: `dialog-title`). Defaults to a localized "Select a record" |
| `placeholder` | `string` | — | — | Placeholder text for the main input |
| `clearable` | `boolean` | `false` | ✓ | Show a clear ("x") button when a value is selected |
| `debounce` | `number` | `250` | — | Inline-dropdown search debounce, in ms |
| `value` | `string` | — | — | Selected record's id |
| `disabled` | `boolean` | `false` | ✓ | Disable |
| `readonly` | `boolean` | `false` | ✓ | Read-only |
| `required` | `boolean` | `false` | ✓ | Required |
| `invalid` | `boolean` | `false` | ✓ | Validation failed |
| `name` | `string` | — | — | Form field name |
| `label` | `string` | — | — | Field label |
| `description` | `string` | — | — | Helper text |

`selectedItem` (read-only getter) returns the full `PickerItem` behind `.value`, or `null`
before any selection.

## PickerItem

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Value committed to `.value` and the form |
| `label` | `string` | Text shown in the input and dropdown once selected |
| `...rest` | `any` | Any other fields the app's `search` result carries — read them from `.selectedItem` or a `u-rich-table` column |

## Events

| Event | Description |
|-------|-------------|
| `change` | Fires when the selected record changes (bubbles, composed, non-cancelable — same contract as `u-select`/`u-input`). Read `.value` (id) and `.selectedItem` (full record) from the target |

## Slots

| Slot | Description |
|------|-------------|
| `header` | Extra content above the dialog's search bar |
| `footer` | Replaces the dialog's default Cancel/Confirm buttons |
