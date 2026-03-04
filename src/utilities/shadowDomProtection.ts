/**
 * Shadow DOM Style Protection
 *
 * Protects Lit component styles from being overwritten by Vite HMR.
 * When DevExtreme or other libraries load CSS, Vite HMR may clear/replace
 * Shadow DOM's adoptedStyleSheets, causing Lit component styles to be lost.
 *
 * This module intercepts adoptedStyleSheets setter to:
 * 1. Detect and save Lit styles (identified by :host selector)
 * 2. Block HMR reset attempts that would clear Lit styles
 * 3. Merge Lit styles with other styles (like DevExtreme)
 * 4. Protect registered custom stylesheets from being lost during re-renders
 */

let isInitialized = false;

// Global registry for custom stylesheets that should be protected
const protectedCustomStylesheets = new Set<CSSStyleSheet>();

/**
 * Register a custom stylesheet to be protected
 * Protected stylesheets will always be preserved when adoptedStyleSheets changes
 */
export function registerProtectedStylesheet(stylesheet: CSSStyleSheet): void {
    protectedCustomStylesheets.add(stylesheet);
}

/**
 * Check if a stylesheet is a protected custom stylesheet
 */
function isProtectedCustomStylesheet(sheet: CSSStyleSheet): boolean {
    return protectedCustomStylesheets.has(sheet);
}

/**
 * Check if a stylesheet is a Lit component stylesheet
 * Lit styles typically start with :host selector
 */
function isLitStyleSheet(sheet: CSSStyleSheet): boolean {
    try {
        if (!sheet.cssRules || sheet.cssRules.length === 0) return false;
        const firstRule = sheet.cssRules[0];
        return firstRule.cssText.startsWith(':host');
    } catch {
        // Cross-origin stylesheets may throw
        return false;
    }
}

/**
 * Check if the sheets array is empty or an HMR reset attempt
 * Vite HMR may set adoptedStyleSheets to empty array or sheets without rules
 */
function isEmptyOrHMRReset(sheets: CSSStyleSheet[]): boolean {
    if (!sheets || sheets.length === 0) return true;
    return sheets.every(sheet => {
        try {
            return !sheet.cssRules || sheet.cssRules.length === 0;
        } catch {
            return true;
        }
    });
}

/**
 * Initialize Shadow DOM style protection
 * Should be called before any Lit components are loaded
 */
export function initShadowDomProtection(): void {
    if (isInitialized) return;
    if (typeof window === 'undefined') return;

    const originalDescriptor = Object.getOwnPropertyDescriptor(
        ShadowRoot.prototype,
        'adoptedStyleSheets'
    );

    if (!originalDescriptor) {
        console.warn('[data-components] adoptedStyleSheets descriptor not found');
        return;
    }

    // Store Lit styles per ShadowRoot using WeakMap (allows garbage collection)
    const protectedLitStylesMap = new WeakMap<ShadowRoot, CSSStyleSheet[]>();

    Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
        get(this: ShadowRoot) {
            return originalDescriptor.get?.call(this) ?? [];
        },
        set(this: ShadowRoot, sheets: CSSStyleSheet[]) {
            const savedLitStyles = protectedLitStylesMap.get(this) || [];

            // Separate Lit styles from non-Lit styles in incoming sheets
            const newLitStyles = sheets?.filter(isLitStyleSheet) || [];
            const newNonLitStyles = sheets?.filter(s => !isLitStyleSheet(s)) || [];

            // Save new Lit styles if present
            if (newLitStyles.length > 0) {
                protectedLitStylesMap.set(this, [...newLitStyles]);
            }

            // Get protected custom stylesheets that should always be included
            const protectedSheets = Array.from(protectedCustomStylesheets);

            // Block HMR reset attempts - preserve Lit styles and protected custom stylesheets
            if (isEmptyOrHMRReset(sheets) && (savedLitStyles.length > 0 || protectedSheets.length > 0)) {
                const preserved = [...savedLitStyles, ...protectedSheets.filter(s => !savedLitStyles.includes(s))];
                originalDescriptor.set?.call(this, preserved);
                return;
            }

            // Merge mode: Lit styles + new non-Lit styles + protected custom stylesheets
            if (savedLitStyles.length > 0 && newLitStyles.length === 0 && newNonLitStyles.length > 0) {
                // Filter out protected stylesheets from newNonLitStyles to avoid duplicates
                const nonProtectedNewStyles = newNonLitStyles.filter(s => !isProtectedCustomStylesheet(s));
                // Merge: Lit + protected custom + new non-protected
                const mergedSheets = [
                    ...savedLitStyles,
                    ...protectedSheets.filter(s => !savedLitStyles.includes(s)),
                    ...nonProtectedNewStyles.filter(s => !protectedSheets.includes(s))
                ];
                originalDescriptor.set?.call(this, mergedSheets);
                return;
            }

            // Normal case: apply sheets + protected custom stylesheets
            const finalSheets = sheets ? [...sheets] : [];
            protectedSheets.forEach(ps => {
                if (!finalSheets.includes(ps)) {
                    finalSheets.push(ps);
                }
            });
            originalDescriptor.set?.call(this, finalSheets);
        },
        configurable: true,
        enumerable: true
    });

    isInitialized = true;
}

// Auto-initialize on module load
initShadowDomProtection();
