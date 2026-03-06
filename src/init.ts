/**
 * Early Initialization Module
 *
 * This module should be imported at the VERY TOP of your entry file,
 * BEFORE any other imports (especially before @iyulab/modern-app).
 *
 * Usage:
 * ```typescript
 * import '@iyulab/data-components/init'; // First line!
 * import { app } from '@iyulab/modern-app';
 * // ... rest of your imports
 * ```
 *
 * This enables Shadow DOM style protection which prevents Vite HMR
 * from overwriting Lit component styles when DevExtreme CSS loads.
 */

// Only import Shadow DOM protection (no DevExtreme dependencies)
import './utilities/shadowDomProtection';
