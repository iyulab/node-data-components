/**
 * One searchable/selectable record. `id` is the form value; `label` is what the inline
 * dropdown displays. Extra fields are addressed by `URecordPickerProps.columns[].key` for the
 * lookup dialog's table — the shape those fields take is entirely up to `search()`'s caller.
 */
export interface PickerItem {
  id: string;
  label: string;
  [key: string]: unknown;
}
