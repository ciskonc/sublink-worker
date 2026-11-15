/**
 * Output completeness guard.
 *
 * A converted config is only safe to hand to a client when it is structurally
 * complete. The `rules:` section is written last in the Clash output, so any
 * truncation (upstream body cut mid-flight, CF aborting the response) removes
 * the trailing rules first — most importantly the private-network direct rules.
 * Without them the client falls through to the final `MATCH` rule and routes
 * LAN traffic into the proxy, which makes local routers unreachable.
 */

/**
 * Check that a generated Clash YAML looks structurally complete.
 * @param {string} text - Generated YAML
 * @returns {{ok: boolean, reason?: string}}
 */
export function checkClashOutput(text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
        return { ok: false, reason: 'empty output' };
    }
    if (!/^rules:/m.test(text)) {
        return { ok: false, reason: 'missing rules section' };
    }
    if (!/^\s*-\s*MATCH,/m.test(text)) {
        return { ok: false, reason: 'missing MATCH rule' };
    }
    if (!/^proxies:/m.test(text)) {
        return { ok: false, reason: 'missing proxies section' };
    }
    if (!/^proxy-groups:/m.test(text)) {
        return { ok: false, reason: 'missing proxy-groups section' };
    }
    return { ok: true };
}

/**
 * Check that a generated Sing-box JSON looks structurally complete.
 * @param {string} text - Generated JSON
 * @returns {{ok: boolean, reason?: string}}
 */
export function checkSingboxOutput(text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
        return { ok: false, reason: 'empty output' };
    }
    if (!text.includes('"outbounds"')) {
        return { ok: false, reason: 'missing outbounds' };
    }
    if (!text.includes('"route"')) {
        return { ok: false, reason: 'missing route' };
    }
    return { ok: true };
}

/**
 * Generic completeness check used by the request handlers.
 * @param {string} text - Generated output
 * @param {string} format - 'clash' | 'singbox' | 'surge' | 'unknown'
 * @returns {{ok: boolean, reason?: string}}
 */
export function checkOutput(text, format) {
    if (format === 'singbox') {
        return checkSingboxOutput(text);
    }
    // Surge output has no `rules:` key; fall back to a section presence check.
    if (format === 'surge') {
        if (typeof text !== 'string' || text.trim().length === 0) {
            return { ok: false, reason: 'empty output' };
        }
        if (!/^\[Proxy\s*\]/im.test(text)) {
            return { ok: false, reason: 'missing [Proxy] section' };
        }
        return { ok: true };
    }
    return checkClashOutput(text);
}
