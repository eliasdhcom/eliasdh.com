/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/09/2026
**/

/**
 * localStorage access can throw (SecurityError/QuotaExceededError) on iOS Safari
 * when cookies/storage are blocked (Settings > Safari > Block All Cookies, Private
 * Browsing, restricted in-app browsers, ...). An uncaught throw here aborts whatever
 * click handler triggered it partway through, leaving UI state (e.g. a modal) stuck.
 * These wrappers make storage access a safe no-op instead.
 */

export function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Storage unavailable - ignore, caller must not depend on this succeeding.
    }
}

export function safeRemoveItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // Storage unavailable - ignore.
    }
}
