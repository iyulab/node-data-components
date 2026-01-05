/**
 * DevExtreme CSS Shadow DOM Injection
 *
 * DevExtreme components render inside Shadow DOM but their CSS is loaded
 * in the Light DOM. Due to Shadow DOM encapsulation, Light DOM CSS doesn't
 * apply to Shadow DOM content.
 *
 * This module:
 * 1. Imports DevExtreme CSS as text (using Vite ?inline query)
 * 2. Creates a CSSStyleSheet from the CSS text
 * 3. Injects the stylesheet into all Shadow DOMs
 * 4. Uses MutationObserver to detect and inject into new Shadow DOMs
 */

// Import DevExtreme CSS as text for Shadow DOM injection
// @ts-expect-error - Vite ?inline query returns string
import devExtremeCssText from 'devextreme/dist/css/dx.light.css?inline';
// @ts-expect-error - Vite ?inline query returns string
import devExtremeOverridesCssText from '../styles/devextreme-overrides.css?inline';
import { registerProtectedStylesheet } from './shadowDomProtection';

let isInitialized = false;
let devExtremeStyleSheet: CSSStyleSheet | null = null;
let devExtremeOverridesStyleSheet: CSSStyleSheet | null = null;
const injectedShadowRoots = new WeakSet<ShadowRoot>();

/**
 * Inject DevExtreme CSS into a specific Shadow Root
 */
function injectToShadowRoot(shadowRoot: ShadowRoot): void {
    if (!devExtremeStyleSheet || injectedShadowRoots.has(shadowRoot)) return;

    try {
        const currentSheets = [...shadowRoot.adoptedStyleSheets];
        const sheetsToAdd: CSSStyleSheet[] = [];

        // Add base DevExtreme CSS
        if (!currentSheets.includes(devExtremeStyleSheet)) {
            sheetsToAdd.push(devExtremeStyleSheet);
        }

        // Add overrides CSS (must come after base for higher specificity)
        if (devExtremeOverridesStyleSheet && !currentSheets.includes(devExtremeOverridesStyleSheet)) {
            sheetsToAdd.push(devExtremeOverridesStyleSheet);
        }

        if (sheetsToAdd.length > 0) {
            shadowRoot.adoptedStyleSheets = [...currentSheets, ...sheetsToAdd];
            injectedShadowRoots.add(shadowRoot);
            if (process.env.NODE_ENV === 'development') {
                console.log('[data-components] DevExtreme CSS injected into Shadow DOM');
            }
        }
    } catch (e) {
        console.warn('[data-components] Failed to inject DevExtreme CSS:', e);
    }
}

/**
 * Scan document for existing Shadow DOMs and inject CSS
 */
function injectToExistingShadowRoots(): void {
    document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
            injectToShadowRoot(el.shadowRoot);
        }
    });
}

/**
 * Initialize DevExtreme CSS injection
 * Sets up MutationObserver to detect new Shadow DOMs
 */
export function initDevExtremeCssInjection(): void {
    if (isInitialized) return;
    if (typeof window === 'undefined') return;

    // Create base DevExtreme CSSStyleSheet
    try {
        devExtremeStyleSheet = new CSSStyleSheet();
        devExtremeStyleSheet.replaceSync(devExtremeCssText || '');
        if (process.env.NODE_ENV === 'development') {
            console.log('[data-components] DevExtreme base CSS stylesheet created');
            console.log('[data-components] Base CSS length:', devExtremeCssText?.length || 0);
        }
    } catch (e) {
        console.warn('[data-components] Failed to create DevExtreme base CSSStyleSheet:', e);
        return;
    }

    // Create overrides CSSStyleSheet (separate for better maintainability)
    try {
        if (devExtremeOverridesCssText && devExtremeOverridesCssText.length > 0) {
            devExtremeOverridesStyleSheet = new CSSStyleSheet();
            devExtremeOverridesStyleSheet.replaceSync(devExtremeOverridesCssText);
            // Register as protected so it survives HMR and re-renders
            registerProtectedStylesheet(devExtremeOverridesStyleSheet);
            if (process.env.NODE_ENV === 'development') {
                console.log('[data-components] DevExtreme overrides CSS stylesheet created');
                console.log('[data-components] Overrides CSS length:', devExtremeOverridesCssText.length);
            }
        }
    } catch (e) {
        console.warn('[data-components] Failed to create DevExtreme overrides CSSStyleSheet:', e);
        // Continue without overrides - base CSS will still work
    }

    // Set up MutationObserver to detect new elements with Shadow DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node instanceof Element) {
                    // Check if added element has Shadow DOM
                    if (node.shadowRoot) {
                        injectToShadowRoot(node.shadowRoot);
                    }
                    // Check descendants
                    node.querySelectorAll('*').forEach(el => {
                        if (el.shadowRoot) {
                            injectToShadowRoot(el.shadowRoot);
                        }
                    });
                }
            });
        });
    });

    // Initialize based on document ready state
    const startObserving = () => {
        injectToExistingShadowRoots();
        observer.observe(document.body, { childList: true, subtree: true });

        // Additional delayed checks for late-loading Shadow DOMs
        setTimeout(injectToExistingShadowRoots, 1000);
        setTimeout(injectToExistingShadowRoots, 3000);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    isInitialized = true;
}

// Store custom stylesheets for injection into new Shadow DOMs
const customStylesheets: CSSStyleSheet[] = [];

/**
 * Inject all registered custom stylesheets into a Shadow Root
 */
function injectCustomStylesToShadowRoot(shadowRoot: ShadowRoot): void {
    if (customStylesheets.length === 0) return;

    try {
        const currentSheets = [...shadowRoot.adoptedStyleSheets];
        const newSheets = customStylesheets.filter(sheet => !currentSheets.includes(sheet));

        if (newSheets.length > 0) {
            shadowRoot.adoptedStyleSheets = [...currentSheets, ...newSheets];
        }
    } catch (e) {
        console.warn('[data-components] Failed to inject custom styles:', e);
    }
}

/**
 * Register and inject custom CSS into all Shadow DOMs (existing and future)
 * Sets up automatic injection for new Shadow DOMs via MutationObserver
 */
export function injectCssToShadowDoms(cssText: string): CSSStyleSheet | null {
    if (typeof window === 'undefined') return null;

    try {
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(cssText || '');

        // Register as protected stylesheet so it survives re-renders
        registerProtectedStylesheet(stylesheet);

        // Register for future Shadow DOMs
        customStylesheets.push(stylesheet);

        // Inject to existing Shadow DOMs
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                const currentSheets = [...el.shadowRoot.adoptedStyleSheets];
                if (!currentSheets.includes(stylesheet)) {
                    el.shadowRoot.adoptedStyleSheets = [...currentSheets, stylesheet];
                }
            }
        });

        // Set up observer if not already done
        setupCustomStylesObserver();

        if (process.env.NODE_ENV === 'development') {
            console.log('[data-components] Custom CSS registered for Shadow DOM injection');
        }

        return stylesheet;
    } catch (e) {
        console.warn('[data-components] Failed to inject custom CSS:', e);
        return null;
    }
}

let customStylesObserverInitialized = false;

function setupCustomStylesObserver(): void {
    if (customStylesObserverInitialized) return;
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node instanceof Element) {
                    if (node.shadowRoot) {
                        injectCustomStylesToShadowRoot(node.shadowRoot);
                    }
                    node.querySelectorAll('*').forEach(el => {
                        if (el.shadowRoot) {
                            injectCustomStylesToShadowRoot(el.shadowRoot);
                        }
                    });
                }
            });
        });
    });

    const startObserving = () => {
        observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    customStylesObserverInitialized = true;
}

// Auto-initialize on module load
initDevExtremeCssInjection();
