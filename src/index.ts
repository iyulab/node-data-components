/**
 * Data Components
 * 
 * Auto-initializes:
 * 1. Shadow DOM style protection (protects Lit styles from Vite HMR)
 * 2. DevExtreme CSS injection (injects styles into Shadow DOMs)
 */

// Import utilities for side effects (auto-initialization)
import './utilities/shadowDomProtection';
// Note: devExtremeCssInjection is imported by UDataGrid directly,
// so consumers who don't use UDataGrid won't load DevExtreme CSS.

// Export components
export { UDataGrid } from './components/data-grid/UDataGrid';
export type { UDataGridColumn, UDataGridProps } from './components/data-grid/UDataGrid.types';
export * from './components/data-view/UDataView';
export * from './components/simple-sheet/USimpleSheet';