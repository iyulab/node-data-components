/**
 * Data Components Utilities
 *
 * Auto-initializes:
 * 1. Shadow DOM style protection (protects Lit styles from Vite HMR)
 * 2. DevExtreme CSS injection (injects styles into Shadow DOMs)
 *
 * These utilities are automatically executed when data-components is imported.
 */

// Import for side effects (auto-initialization)
import './shadowDomProtection';
import './devExtremeCssInjection';

// Re-export for manual usage if needed
export { initShadowDomProtection, registerProtectedStylesheet } from './shadowDomProtection';
export {
    initDevExtremeCssInjection,
    injectCssToShadowDoms
} from './devExtremeCssInjection';
