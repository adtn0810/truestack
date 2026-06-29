---
name: application-security
description: Design and harden the security of a self-hosted app — authentication (sessions vs
  JWT, OAuth2/OIDC, MFA, passkeys/WebAuthn), authorization (RBAC/ABAC, least privilege,
  deny-by-default, IDOR/BOLA/broken-access-control), the OWASP Top 10 (injection, broken
  access control, SSRF, security misconfiguration), input validation + context-aware output
  encoding (XSS/SQLi/command injection), CSRF, password/credential storage (argon2id/bcrypt),
  secrets management, security headers/CSP/HSTS, and lightweight STRIDE threat modeling. Use
  whenever the user asks "is this secure" / "secure this app" / "security review", builds a
  login / sign-in / sign-up / auth flow, weighs session vs JWT, adds MFA/2FA/passkeys, sets up
  RBAC/roles/permissions/access control, mentions IDOR/SSRF/CSRF/XSS/SQLi/injection, hashes
  passwords, manages secrets/API keys/.env, sets CSP/security headers, threat-models / sizes an
  attack surface, or handles user data / GDPR/CCPA. The DESIGN discipline.
---

# application-security

Security is a *design* property, not a checklist you bolt on at the end. The job is to make
the safe path the only path: authorization that denies by default, injection that's
structurally impossible, credentials that survive a database leak. On a self-hosted single
server there's no WAF, no managed identity, no cloud security team — the app *is* the
perimeter. Accuracy and honesty over a green-looking dashboard: name the real risk, don't
hand-wave it.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the stack, auth model, framework, and recorded security decisions. If none
exists, run `project-memory`. Keep the **code↔memory tally** balanced: an auth model, a CSP, a
session strategy, a threat-model decision are architecture — record them in the same change.

**Auto-research, don't recall.** OWASP Top 10 rankings, NIST password/MFA minimums, CVEs, and
GDPR/CCPA specifics change and are version- and date-specific — ground every such claim in an
authoritative source (OWASP Cheat Sheets, NIST SP 800-63B, the current Top 10, the CVE record)
before asserting it. Abstain when you can't verify; never quote a parameter or regulation from
memory.

A new auth model, a session/JWT switch, or a credential-handling change is **high-risk,
security-touching** design — route it through `architecture-planning`'s approval gate before
code. The PreToolUse gate in `hooks/` is a *different layer*: it governs agent **actions**
(destructive / secret / outbound calls at run time), not the app's security design — don't
confuse the two.

**Where this skill sits:** this skill owns the security **design and discipline** — the threat
model, the auth/authz architecture, the standing controls. It is **not** the one-shot SAFETY
pass `quality-control` runs on a specific change (QC enforces per-change; here you set what QC
checks against). Untrusted **tool/MCP output** is `mcp-integration`'s boundary; the agent-action
gate is `hooks/`. `observability` redacts PII from **telemetry** but defers the privacy
**policy** to `data-privacy`. `ci-and-delivery` SHA-pins actions and runs the scan **in CI**,
while `dependency-management` owns the ongoing dependency **policy/lifecycle**.
`backend-development` **implements** the API; `api-design` owns the **contract**;
`architecture-planning` does **system** design. State which seam you're on and stay on it.

## 1. Authorization: deny by default, on the server, scoped to the subject
Broken Access Control is currently the #1 risk (OWASP A01 in the present Top 10 — confirm the live
ranking, don't quote it from memory; found in ~100% of tested apps and it now also absorbs SSRF).
Default-deny every route, and derive the subject from the **session/token, never from request input**.
- **IDOR/BOLA is the failure most teams miss.** Any time the client names a resource
  (`/orders/123`, `?user_id=`), re-check ownership at the **data layer for that exact record on
  every path — read *and* write** — even when the user is authenticated and the UI hid the link.
  Concretely `WHERE id=:id AND owner_id=:current_user` from the session: the authenticated subject
  (`sub`) from a verified session/token *is* authoritative, but never trust a client-influenced
  `user_id`/`org_id`/`tenant_id` from the request body (or a user-settable claim) as the resource scope.
- **Centralize the check** so non-controller paths — background jobs, GraphQL resolvers, bulk
  endpoints — can't bypass it. A check that lives only in the controller is a hole everywhere else.

## 2. Authentication: prefer server-side sessions on one box
JWT's only real win is stateless horizontal scale you don't have on a single server, and its
weakness is you can't instantly revoke a stolen token without a server-side denylist — at which
point you've rebuilt sessions with worse ergonomics. **Default to opaque-cookie → server-store
sessions.** If you must use JWTs, keep access tokens short-lived (minutes) with refresh-token
rotation. Either way: cookies `HttpOnly; Secure; SameSite=Lax` (or Strict) with the `__Host-`
prefix; **never** store tokens in `localStorage` (XSS-readable). Invalidate server-side on
logout and on password/MFA change.

## 3. MFA: phishing-resistant by design
TOTP and push are phishable via real-time reverse-proxy (AiTM) kits that relay the code. Only
**FIDO2/WebAuthn passkeys** (and PKI smartcards) are phishing-resistant — the signature is
cryptographically bound to the real origin and can't be replayed to a fake domain. Support
passkeys as the **strong** factor, keep TOTP as fallback, not primary. Syncable passkeys meet
NIST AAL2; hardware-bound keys are needed for AAL3.

## 4. Passwords & credential storage
Hash with **Argon2id** at the current OWASP minimum (e.g. 19 MiB / 2 iterations / parallelism 1,
or 46 MiB / 1 / 1 — re-verify the live figure) — not plain bcrypt unless legacy, **never**
SHA-256/MD5. The bcrypt footgun: it silently truncates at **72 bytes**, so long passphrases
collide — if you must use bcrypt, pre-hash with SHA-256+base64 or enforce the limit. Per NIST SP
800-63B: require length (≥8, support ≥64 / passphrases), screen against breached-password lists,
and explicitly do **not** impose composition rules or periodic rotation — both are now
*prohibited*, not merely discouraged. Generate a strong, unique app/session-signing key per
deployment, never a framework default.

## 5. Make injection structurally impossible
Don't sanitize — remove the class. **Parameterized queries / prepared statements for all SQL**
(never concatenate, including `ORDER BY` and identifiers — allowlist those against a fixed column
set). For OS commands pass an **argv array to exec without a shell**, never a built string. The
model most teams get backwards: input **validation** (allowlist by type/format/range — reject,
don't sanitize) defends the boundary, but the actual XSS/SQLi/command-injection fix is
**context-aware output encoding at the sink** (HTML body vs attribute vs JS vs URL each need
different encoding). Validation is not a substitute for encoding.

## 6. CSRF: an explicit token, not just SameSite
Treat `SameSite` cookies as defense-in-depth, **not** your CSRF defense — `Lax` still leaves
top-level GET state-changes, sibling-subdomain, and some method/redirect cases exploitable, and
a strict CORS policy is *not* CSRF protection either. Add an explicit token: **synchronizer
token** for stateful (session) apps, **signed double-submit cookie** for stateless/API-driven;
for pure-JSON APIs, require a custom header (e.g. `X-CSRF-Token`) that a simple cross-site form
can't set.

## 7. SSRF: an access-control problem, allowlist-only
SSRF now lives under A01 — defend it with an **allowlist of permitted hosts, never a denylist of
bad IPs**. The self-host bug: validate-then-fetch is vulnerable to DNS-rebinding/TOCTOU —
**resolve the hostname once, check the resolved IP against the allowlist, then connect to that
exact IP**, and disable HTTP redirect-following on server-side fetches. Block loopback/private/
link-local ranges (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7, fe80::/10).
Even on one box, `169.254.169.254` (cloud metadata) and your own localhost-bound admin/DB ports
are the prize — **bind internal services to 127.0.0.1 and firewall everything but 443.**

## 8. Security misconfiguration: ship hardening as config
The highest-leverage, lowest-effort wins for one server (A02). Serve only HTTPS (**HSTS**); set a
**strict nonce-based CSP** (`script-src 'nonce-…' 'strict-dynamic'`, no `unsafe-inline`/
`unsafe-eval`; deploy Report-Only first, then enforce) — the real second line against XSS after
output encoding. Add `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and
`frame-ancestors`/`X-Frame-Options`. Disable stack traces / debug mode / verbose errors in prod,
remove default accounts and sample apps, keep OS/runtime/deps patched, and run as a **non-root,
least-privilege** service user with the DB on localhost only.

## 9. Secrets: out of code and source control
A committed `.env`, a key pasted for a "quick demo", or a world-readable config is the recurring
self-host breach — a secret in a repo is compromised the moment the repo is. **Inject at
runtime** (restricted-permission env file, systemd credentials, Docker/compose secrets, or a
self-hostable manager like Infisical/Vault), keep secrets out of logs and error pages, add
**pre-commit secret scanning**, and **rotate anything that ever touched a repo or chat**.

## 10. Threat-model at design time (the discipline QC doesn't run)
Do a 30-minute lightweight **STRIDE** pass *before code* — this is what makes this skill the
design discipline, distinct from any per-change review. Draw a one-page data-flow diagram, mark
**trust boundaries** (browser→server, server→DB, server→third-party/outbound fetch), and walk
each crossing through Spoofing / Tampering / Repudiation / Information-disclosure / DoS /
Elevation-of-privilege, writing the mitigating control next to each. Fixing a design flaw here is
~100× cheaper than in prod, and it catches the missing-authz and SSRF-shaped issues no linter
will. Design in **security logging/alerting** for auth events (A09) too — you can't detect
credential-stuffing or IDOR-probing you never log.

## Honest exit
Report against the real risk, not the effort. Claim a control only where you can point at the
code that enforces it — an authz check you verified fires, a CSP you confirmed is served, a hash
you read in the code. If a risk is open, a parameter is unverified, or a regulation needs a
specialist, say so plainly and give a completion score (controls in place / total + what's open)
rather than a false "secure" (honesty contract). When the design changes a recorded decision,
update project memory in the same change; then hand off to **quality-control** before "done" —
its one-shot safety pass enforces, per change, what you designed here.

## Explain it simply
Say the threat and the fix in one plain line — "anyone could read another user's order because
we trusted the id in the URL; now the query also checks it's *their* order." Show the auth model
choice and the header/CSP set as a short list or table, not prose. After hardening anything,
state in one line what an attacker can no longer do that they could before.
