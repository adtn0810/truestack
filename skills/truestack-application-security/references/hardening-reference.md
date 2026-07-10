# Hardening reference — look-up-grade values

Snapshots, not gospel — **re-verify every figure against its live source before citing it**
(OWASP Password Storage Cheat Sheet, the current OWASP Top 10, OWASP/MDN header guidance).
Loaded on demand from SKILL.md sections 4 (passwords), 7 (SSRF), and 8 (misconfiguration).

## Argon2id parameters (OWASP minimum — snapshot)

Either configuration meets the published minimum; raise memory if the box allows:
- **19 MiB memory / 2 iterations / parallelism 1**
- **46 MiB memory / 1 iteration / parallelism 1**

## SSRF: loopback/private/link-local ranges to block

- **IPv4** — `127.0.0.0/8` (loopback), `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  (private), `169.254.0.0/16` (link-local — includes `169.254.169.254` cloud metadata).
- **IPv6** — `::1` (loopback), `fc00::/7` (unique-local), `fe80::/10` (link-local); also reject
  IPv4-mapped forms (`::ffff:a.b.c.d`) that smuggle a blocked IPv4 address past an IPv6 check.

The range block is defense-in-depth only — the control is the **host allowlist**, resolved once
and pinned (SKILL.md, SSRF section).

## Security headers: the full set

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — everything on HTTPS first;
  add `preload` only once committed (it's hard to undo).
- `Content-Security-Policy: script-src 'nonce-<random>' 'strict-dynamic'; object-src 'none';
  base-uri 'none'` — no `unsafe-inline`/`unsafe-eval`; ship as
  `Content-Security-Policy-Report-Only` first, then enforce.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- CSP `frame-ancestors 'none'` — or `X-Frame-Options: DENY` for legacy clients.
