<div align="center">
  <img src="public/favicon.png" alt="Sublink Worker" width="120" height="120"/>

  <h1><b>Sublink Worker</b></h1>
  <h5><i>One Worker, All Subscriptions</i></h5>

  <p><b>A lightweight subscription converter and manager for proxy protocols, deployable on Cloudflare Workers, Vercel, Node.js, or Docker.</b></p>

  <p><i>Fork of <a href="https://github.com/7Sageer/sublink-worker">7Sageer/sublink-worker</a> with AnyTLS support and custom rule defaults.</i></p>

  <p>
    <b>English</b> | <a href="./README_CN.md">中文</a>
  </p>

  <br>

<p style="display: flex; align-items: center; gap: 10px;">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/ciskonc/sublink-worker">
    <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers" style="height: 32px;"/>
  </a>
</p>

<p>
  <a href="https://sublink-worker.nortons.workers.dev/">
    <img src="https://img.shields.io/badge/Live%20Demo-Try%20It%20Now-brightgreen?style=for-the-badge&logo=cloudflare" alt="Live Demo"/>
  </a>
</p>
</div>

## 🚀 Live Demo

Want to try it out before deploying? Check out the live instance:

**👉 [https://sublink-worker.nortons.workers.dev/](https://sublink-worker.nortons.workers.dev/)**

Feel free to test subscription conversion, rule customization, and all supported protocols (SS/VMess/VLESS/AnyTLS/Hysteria2/Trojan/TUIC) directly in your browser. No installation required.

### Web UI Preview

<div align="center">

<img src="public/ui-screenshot.png" alt="Sublink Worker Web UI" width="50%"/>

*Sublink Worker Web Interface — subscription input, rule selection, and output generation*

</div>

## What's Changed (vs Upstream)

### AnyTLS Protocol Support
- Added `anytls://` protocol parser. AnyTLS links are correctly parsed and converted to native AnyTLS nodes in Clash / Sing-Box output, instead of being silently dropped.
- AnyTLS is structurally identical to VLESS (UUID@Host:Port?TLS params) but uses `type: anytls` with `password` field, which is a distinct protocol type in Clash Meta and Sing-Box.

### Multi-Subscription Merge Fix
- **Proxy-provider disabled**: Subscriptions returning Clash YAML format are no longer auto-converted to `proxy-providers`. All nodes from all subscriptions are now inlined into the final config, preventing runtime fetch failures caused by UA restrictions or token auth.
- **Proxy-groups isolation**: Subscription-sourced `proxy-groups` are no longer merged into the output config. Only the rule groups you select in the web UI will appear.

### Custom Rule Defaults (Whitelist Mode)
- **Non-China** and **Fall Back** default to **DIRECT** instead of Node Select.
- **GFWList** rule added (based on `geosite:category-gfw`), defaults to **Node Select** (proxy).
- **GFWList auto-merge**: When GFWList is selected without Social Media/Google/Youtube/Github, it automatically pulls in `twitter/google/youtube/github/gitlab` site rules. This fixes domains like `x.com` that are GFW-blocked but classified under `geosite:twitter` instead of `category-gfw` in v2fly.
- Rule priority: specific rules (Google, Telegram, Github...) > GFWList > Non-China (DIRECT) > Fall Back (DIRECT).
- This implements a whitelist proxy mode: only GFW-blocked domains go through proxy, everything else is direct.

### Optional Explicit GLOBAL Proxy-Group (Clash only)
- Adds a Web UI toggle in **Advanced Options → General Settings**: *"GLOBAL group defaults to Node Select"*.
- When enabled (off by default), the generated Clash config emits an **explicit `GLOBAL` proxy-group** whose first member is the `Node Select` group, instead of relying on mihomo's implicit GLOBAL group.
- **Why**: Clash `global` mode routes all traffic through the GLOBAL group's currently selected node. mihomo's implicit GLOBAL group defaults to `DIRECT`, making `global` mode behave identically to `direct` mode — users clicking "Global" see no effect and mistakenly think the button is broken. With this toggle on, `global` mode immediately routes through the user's selected Node Select node.
- Triggered via URL parameter `global_group_node_select=true` on the `/clash` endpoint.
- Backward compatible: when the toggle is off, behavior is unchanged (mihomo implicit GLOBAL group is used).

### Supported Protocols
ShadowSocks, VMess, VLESS, **AnyTLS**, Hysteria2, Trojan, TUIC

### Client Support
Sing-Box, Clash (Meta/Mihomo), Xray/V2Ray, Surge

## Quick Start

### One-Click Deployment
- Click the "Deploy to Cloudflare Workers" button above
- See the upstream [Documentation](https://sublink.works/guide/quick-start/) for more information

### Alternative Runtimes
- **Node.js**: `npm run build:node && node dist/node-server.cjs`
- **Vercel**: `vercel deploy` (configure KV in project settings)
- **Docker**: `docker pull ghcr.io/7sageer/sublink-worker:latest`
- **Docker Compose**: `docker compose up -d` (includes Redis)

## Core Capabilities
- Import subscriptions from multiple sources (inline merge, no proxy-provider)
- Generate fixed/random short links (KV-based)
- Light/Dark theme toggle
- Flexible API for script automation
- Multi-language support (Chinese, English, Persian, Russian)
- Web interface with predefined rule sets and customizable policy groups

## Upstream Documentation

- [Live Demo](https://app.sublink.works)
- [English Docs](https://sublink.works/en/)
- [Chinese Docs](https://sublink.works)
- [API Reference](https://sublink.works/api/)
- [FAQ](https://sublink.works/guide/faq/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
