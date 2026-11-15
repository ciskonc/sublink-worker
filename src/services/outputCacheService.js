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
const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000; // serve a cached body for up to 10 minutes without rebuilding

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
        if (typeof value !== 'string' || value.length === 0) return null;
        // Stored as an envelope so the age can be checked; tolerate plain bodies.
        try {
            const envelope = JSON.parse(value);
            if (envelope && typeof envelope.body === 'string') {
                return envelope.body;
            }
        } catch {
            // not an envelope — treat as raw body
        }
        return value;
    } catch (error) {
        console.warn(`cache read failed for ${key}: ${error?.message}`);
        return null;
    }
}

/**
 * Read the cached output together with its age.
 * @param {object} kv - KV adapter (may be null)
 * @param {string} key - Cache key
 * @returns {Promise<{body: string, ageMs: number}|null>}
 */
export async function readCachedWithAge(kv, key) {
    if (!kv || typeof kv.get !== 'function') return null;
    try {
        const value = await kv.get(key);
        if (typeof value !== 'string' || value.length === 0) return null;
        try {
            const envelope = JSON.parse(value);
            if (envelope && typeof envelope.body === 'string') {
                const savedAt = Number(envelope.savedAt) || 0;
                return { body: envelope.body, ageMs: Date.now() - savedAt };
            }
        } catch {
            // ignore
        }
        return { body: value, ageMs: Number.MAX_SAFE_INTEGER };
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
        const envelope = JSON.stringify({ savedAt: Date.now(), body: value });
        // Cloudflare KV requires expirationTtl >= 60.
        await kv.put(key, envelope, { expirationTtl: Math.max(60, ttlSeconds) });
    } catch (error) {
        console.warn(`cache write failed for ${key}: ${error?.message}`);
    }
}

/**
 * Maximum age (ms) after which a cached body should be rebuilt.
 * @returns {number}
 */
export function defaultMaxAgeMs() {
    return DEFAULT_MAX_AGE_MS;
}
