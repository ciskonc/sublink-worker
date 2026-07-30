import { parseServerInfo, parseUrlParams, parseBool } from '../../utils.js';

/**
 * Parse an anytls:// URI into a standardized proxy object.
 * anytls URIs share the same structure as vless:// (UUID@Server:Port?params#name),
 * but the underlying protocol is different. Sing-Box and Clash Meta both
 * treat anytls as a first-class type distinct from vless.
 *
 * Example: anytls://uuid@host:port?security=tls&sni=example.com&fp=firefox&insecure=1&type=tcp#NodeName
 */
export function parseAnytls(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [password, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    // anytls is always TLS-based; do NOT rely on createTlsConfig because it
    // gates TLS on params.security being present. anytls URIs in the wild
    // typically omit security= and only carry sni/fp/insecure, which would
    // cause TLS fields to be dropped and nodes to fail TLS handshake.
    const tls = {
        enabled: true,
        server_name: params.sni || params.host || '',
        insecure: !!params?.allowInsecure || !!params?.insecure || !!params?.allow_insecure,
    };

    // Preserve utls fingerprint if specified (e.g. fp=firefox, fp=chrome)
    if (params.fp) {
        tls.utls = {
            enabled: true,
            fingerprint: params.fp
        };
    }

    const udp = params.udp !== undefined ? parseBool(params.udp) : undefined;

    // idle-session parameters (anytls specific)
    const result = {
        type: 'anytls',
        tag: name,
        server: host,
        server_port: port,
        password: decodeURIComponent(password),
        tcp_fast_open: false,
        tls,
        ...(udp !== undefined ? { udp } : {})
    };

    // AnyTLS specific idle session parameters
    if (params['idle-session-check-interval'] !== undefined) {
        result['idle-session-check-interval'] = params['idle-session-check-interval'];
    }
    if (params['idle-session-timeout'] !== undefined) {
        result['idle-session-timeout'] = params['idle-session-timeout'];
    }
    if (params['min-idle-session'] !== undefined) {
        result['min-idle-session'] = params['min-idle-session'];
    }

    return result;
}