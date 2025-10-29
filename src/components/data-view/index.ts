import React from 'react';
import { createComponent } from '@lit/react';
import { DataView } from './DataView';

customElements.define("u-data-view", DataView);

declare global {
  interface HTMLElementTagNameMap {
    "u-data-view": DataView;
  }
}

const UDataView = createComponent({
  react: React,
  tagName: "u-data-view",
  elementClass: DataView
})

export {
  DataView,
  UDataView 
};