import { html, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';

import '@iyulab/components/dist/components/field/UField.js';
import '@iyulab/components/dist/components/icon/UIcon.js';
import '@iyulab/components/dist/components/button/UButton.js';
import '@iyulab/components/dist/components/spinner/USpinner.js';
import '@iyulab/components/dist/components/popover/UPopover.js';
import '@iyulab/components/dist/components/option/UOption.js';
import '@iyulab/components/dist/components/dialog/UDialog.js';
import '../u-rich-table/URichTable.js';

import { UFormControlElement } from '@iyulab/components/dist/components/UFormControlElement.js';
import { Locale } from '@iyulab/components/dist/utilities/Locale.js';
import type { UPopover } from '@iyulab/components/dist/components/popover/UPopover.js';
import type { UDialog } from '@iyulab/components/dist/components/dialog/UDialog.js';
import type { URichTable } from '../u-rich-table/URichTable.js';
import type { ColumnDef } from '../u-rich-table/types.js';
import { messages } from '../../utilities/messages.js';
import type { PickerItem } from './types.js';
import { styles } from './styles.js';

/**
 * Form control that picks one record from a remote-searched list. Typing filters an inline
 * dropdown; Enter (with nothing highlighted) or the trailing find button opens a modal lookup
 * dialog backed by `u-rich-table`.
 *
 * @slot header - Extra content above the dialog's search bar.
 * @slot footer - Replaces the dialog's default Cancel/Confirm buttons.
 *
 * @event change - Fired when the selected record changes (bubbles, composed, non-cancelable —
 *   same contract as `USelect`/`UInput`). Read `.value` (id) and `.selectedItem` (full record)
 *   from the target.
 */
@customElement('u-record-picker')
export class URecordPicker extends UFormControlElement<string> {
  static styles = [super.styles, styles];

  /** Async lookup — shared by the inline dropdown and the dialog's search bar. */
  @property({ attribute: false }) search!: (query: string) => Promise<PickerItem[]>;
  /** Column definitions for the lookup dialog's `u-rich-table` (same shape as `u-rich-table`). */
  @property({ type: Array }) columns: ColumnDef[] = [];
  /** Lookup dialog header title. Defaults to a localized "Select a record". */
  @property({ type: String, attribute: 'dialog-title' }) dialogTitle?: string;
  /** Placeholder text for the main input. */
  @property({ type: String }) placeholder?: string;
  /** Show a clear ("x") button when a value is selected. */
  @property({ type: Boolean, reflect: true }) clearable = false;
  /** Inline-dropdown search debounce, in ms. */
  @property({ type: Number }) debounce = 250;

  @query('.container', true) containerEl?: HTMLElement;
  @query('input.main-input', true) inputEl?: HTMLInputElement;
  @query('u-popover', true) popoverEl?: UPopover;
  @query('u-dialog', true) dialogEl?: UDialog;
  @query('u-rich-table', true) tableEl?: URichTable;

  /** Typed text — distinct from `.value` (the committed id). */
  @state() private query = '';
  @state() private items: PickerItem[] = [];
  @state() private loading = false;
  @state() private activeIndex = -1;
  @state() private error = false;

  private inlineDebounceTimer?: number;
  private inlineSearchSeq = 0;

  @state() private dialogQuery = '';
  @state() private dialogItems: PickerItem[] = [];
  @state() private dialogLoading = false;
  @state() private pendingId: string | null = null;
  @state() private dialogError = false;

  private _selectedItem: PickerItem | null = null;
  /** The full record behind `.value`, or `null` before any selection. */
  get selectedItem(): PickerItem | null {
    return this._selectedItem;
  }

  render() {
    return html`
      <u-field part="field"
        ?required=${this.required}
        ?disabled=${this.disabled}
        ?invalid=${this.invalid}
        .label=${this.label}
        .description=${this.description}
        .validationMessage=${this.validationMessage}
      >
        <div class="container" part="container">
          <input class="main-input" type="text"
            aria-label=${ifDefined(this.label)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            placeholder=${ifDefined(this.placeholder)}
            .value=${live(this.query)}
            @input=${this.handleInlineInput}
            @keydown=${this.handleInlineKeydown}
          />
          <u-icon class="suffix-item"
            ?hidden=${!this.clearable || !this.value || this.disabled || this.readonly}
            lib="internal" name="x"
          ></u-icon>
          <u-button class="suffix-item find-btn" variant="ghost"
            ?disabled=${this.disabled}
            aria-label=${messages.text('pickerFind')}
          >
            <u-icon lib="internal" name="search"></u-icon>
          </u-button>
        </div>
      </u-field>

      <u-popover part="popover" role="listbox" for=".container" trigger="manual"
        strategy="fixed" placement="bottom-start" offset="1"
      >
        ${this.loading
          ? html`<div class="popover-loading"><u-spinner></u-spinner></div>`
          : this.error
            ? html`<div class="no-results">${messages.text('pickerSearchError')}</div>`
            : this.items.length === 0
              ? html`<div class="no-results">${messages.text('noMatch')}</div>`
              : this.items.map((item, i) => html`
                <u-option .value=${item.id} ?selected=${i === this.activeIndex}
                  @click=${() => this.commitInline(item)}
                >${item.label}</u-option>
              `)}
      </u-popover>

      <u-dialog placement="center">
        <span slot="header">${this.dialogTitle ?? messages.text('pickerDialogTitle')}</span>
        <slot name="header"></slot>
        <div class="dialog-search">
          <input type="text" .value=${live(this.dialogQuery)} />
        </div>
        ${this.dialogError
          ? html`<div class="dialog-error">${messages.text('pickerSearchError')}</div>`
          : ''}
        <div class="dialog-table-wrap">
          <u-rich-table
            .columns=${this.columns}
            .data=${this.dialogItems.map(item => ({ ...item, _id: item.id }))}
            .loading=${this.dialogLoading}
          ></u-rich-table>
        </div>
        <slot name="footer">
          <div class="dialog-footer">
            <u-button variant="ghost">${messages.text('pickerCancel')}</u-button>
            <u-button color="primary" ?disabled=${!this.pendingId}
            >${messages.text('pickerConfirm')}</u-button>
          </div>
        </slot>
      </u-dialog>
    `;
  }

  private handleInlineInput = (e: InputEvent) => {
    this.query = (e.target as HTMLInputElement).value;
    this.activeIndex = -1;
    window.clearTimeout(this.inlineDebounceTimer);

    if (!this.query) {
      this.inlineSearchSeq++;
      this.items = [];
      this.popoverEl?.hide();
      return;
    }

    this.inlineDebounceTimer = window.setTimeout(() => {
      this.runInlineSearch(this.query);
    }, this.debounce);
  };

  private async runInlineSearch(query: string): Promise<void> {
    const seq = ++this.inlineSearchSeq;
    this.loading = true;
    this.error = false;
    this.popoverEl?.show(this.containerEl!);
    try {
      const results = await this.search(query);
      if (seq !== this.inlineSearchSeq) return; // superseded by a newer keystroke
      this.items = results;
      await this.updateComplete;
      if (results.length > 0) {
        this.popoverEl?.show(this.containerEl!);
      } else {
        this.popoverEl?.hide();
      }
    } catch {
      if (seq !== this.inlineSearchSeq) return;
      this.items = [];
      this.error = true;
      await this.updateComplete;
      this.popoverEl?.show(this.containerEl!);
    } finally {
      if (seq === this.inlineSearchSeq) this.loading = false;
    }
  }

  private commitInline(item: PickerItem): void {
    this._selectedItem = item;
    this.query = item.label;
    const changed = this.value !== item.id;
    this.value = item.id;
    this.items = [];
    this.popoverEl?.hide();
    if (changed) this.emitChange();
  }

  private handleInlineKeydown = (e: KeyboardEvent) => {
    if (this.items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
        break;
      case 'Enter':
        e.preventDefault();
        if (this.activeIndex >= 0) this.commitInline(this.items[this.activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        this.items = [];
        this.popoverEl?.hide();
        break;
    }
  };

  private emitChange(): void {
    if (!this.novalidate) this.validate();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this.internals?.setFormValue(this.value ?? '');
    }
  }

  protected setValidity(): void {
    let flags: ValidityStateFlags = {};
    let message = '';
    if (this.required && !this.value) {
      flags = { valueMissing: true };
      message = Locale.getValue('valueMissing');
    }
    this.commit(flags, message, this.containerEl ?? undefined);
  }

  public reset(): void {
    this.value = undefined;
    this.query = '';
    this._selectedItem = null;
    this.invalid = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-record-picker': URecordPicker;
  }
}
