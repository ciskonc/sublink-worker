/**
 * Converted-output cache with stale fallback.
 *
 * Purpose: a client must never receive a broken config. When the upstream
 * fetch fails, times out, or the produced output fails the completeness
 * check, the last known-good conversion is served instead.
 *
 * Storage: the KV adapter already bound to the worker (SUBLINK_KV). Keys are
 * derived from every parameter that influences the output, so different
 * clients/targets never share an entry.
 */

const DEFAULT_TTL_SECONDS = 1800; // 30 minutes

/**
 * Build a stable cache key for a conversion request.
 * @param {object} parts - All output-relevant request parameters
 * @returns {string} - Cache key (short, KV-safe)
 */
export function buildCacheKey(parts) {
    const raw = [
        parts.target ?? 'clash',
        parts.configId ?? '',
        parts.config ?? '',
        parts.selectedRules ?? '',
        parts.customRules ?? '',
        parts.ua ?? '',
        parts.lang ?? '',
        parts.groupByCountry ?? '',
        parts.includeAutoSelect ?? '',
        parts.enableClashUI ?? '',
        parts.externalController ?? '',
        parts.externalUiDownloadUrl ?? '',
        parts.globalGroupNodeSelect ?? '',
        parts.skipTlsVerify ?? ''
    ].join('|');

    // FNV-1a (32 bit) — short, stable, collision-safe enough for cache keys.
    let hash = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `conv:${parts.target ?? 'clash'}:${hash.toString(16)}`;
}

/**
 * Read the last known-good output for a key.
 * @param {object} kv - KV adapter (may be null)
 * @param {string} key - Cache key
 * @returns {Promise<string|null>}
 */
export async function readCached(kv, key) {
    if (!kv || typeof kv.get !== 'function') return null;
    try {
        const value = await kv.get(key);
        return typeof value === 'string' && value.length > 0 ? value : null;
    } catch (error) {
        console.warn(`cache read failed for ${key}: ${error?.message}`);
        return null;
    }
}

/**
 * Store a known-good output.
 * @param {object} kv - KV adapter (may be null)
 * @param {string} key - Cache key
 * @param {string} value - Generated output
 * @param {number} [ttlSeconds] - TTL
 */
export async function writeCached(kv, key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    if (!kv || typeof kv.put !== 'function') return;
    try {
        // Cloudflare KV requires expirationTtl >= 60.
        await kv.put(key, value, { expirationTtl: Math.max(60, ttlSeconds) });
    } catch (error) {
        console.warn(`cache write failed for ${key}: ${error?.message}`);
    }
}
