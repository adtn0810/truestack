---
name: truestack-api-design
description: Design the interface contract for an API before it's implemented — protocol
  choice, resource and error modeling, versioning, pagination, idempotency, and rate-limit
  rules. Use whenever the user wants to "design an API", define an "API contract",
  "contract-first" / "schema-first" work, write or lint an "OpenAPI" / "Swagger" spec, pick
  "REST vs GraphQL" / "REST vs gRPC" / "which API style", decide "how to version my API" /
  "deprecate an endpoint" / "sunset header" / a "breaking change" / "backward compatible API",
  shape an "error response" / "problem+json" / "RFC 9457" / "what status code", add an
  "idempotency key" / "prevent double charge on retry" / "make POST safe to retry", choose
  "pagination" / "cursor vs offset" / "next page token", publish "rate limit headers" / "429
  / quota", do "resource modeling" / "filtering and sorting" query params, "contract testing"
  / "consumer-driven contracts", or design a "request/response shape" against "mass assignment".
---

# truestack-api-design

Own the *contract* — the promise the API makes to its callers — and get it right before a line
of it is implemented. The contract is the artifact; the code conforms to it, not the reverse.
Accuracy and stability over cleverness: a boring REST endpoint that every proxy, cache, and
client already understands beats a clever one that re-invents what HTTP gave you free.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the stack, existing API conventions, and the reverse proxy in front of the
box. If none exists, run `truestack-project-memory`. Keep the **code↔memory tally** balanced: when you
lock a convention (casing, versioning scheme, error `type` URIs), record it in the same change.

A public-facing or versioned API contract is a high-risk, hard-to-reverse decision — once a
client depends on a shape, you own it. Route the contract through `truestack-architecture-planning`'s
approval gate before it ships, and let `truestack-quality-control` gate it before "done". Don't guess on a
coin-flip: if more than one reasonable contract fits, clarify with a short, capped round of
questions-with-defaults first.

**Auto-research, don't recall:** the rules below cite living standards (RFC 9457, RFC 9745/8594,
the IETF Idempotency-Key and RateLimit drafts, OWASP API Top 10). Confirm the current status and
exact member/header names from the authoritative source before asserting them — drafts advance and
status codes have edge cases.

**Where this skill sits (seams):**
- `truestack-api-design` owns the **interface contract**; `truestack-backend-development` **implements** it (owner-scoped
  auth, validation, the idempotency table). Define the shape here, build it there.
- `truestack-architecture-planning` does **system** design (modules, data flow, services); this skill designs
  the **interface** between a service and its callers.
- This skill owns the **authorization rules in the contract** (BOLA/BOPLA below) — the design
  discipline. `truestack-quality-control` runs the one-shot **SAFETY pass** that checks a given change against
  OWASP; it doesn't author the contract.
- `truestack-mcp-integration` owns **untrusted tool output** crossing into the app; this skill owns the
  request/response schema that validates **client** input at the edge.
- `truestack-observability` owns **PII redaction in telemetry**; keep PII out of URLs/query strings here so it
  never reaches a log in the first place, but the redaction policy is theirs.
- `truestack-ci-and-delivery` runs the spec lint + backward-compat diff **as a CI gate**; this skill defines
  *what* "breaking" means so that gate has a rule to enforce.

## 1. Protocol — default REST, justify anything else
REST/JSON over HTTP is the default for a self-hosted single server: debuggable with `curl`,
CDN/proxy-cacheable, rate-limitable at the edge, no extra infra. Reach past it only for a concrete,
named reason:
- **gRPC** — internal service-to-service hops where you own *both* ends and need low latency or
  streaming. It needs HTTP/2 end-to-end, which many single-box reverse-proxy setups quietly break — verify the path before committing.
- **GraphQL** — only when many heterogeneous clients cause *real* over/under-fetching pain. On one
  server it adds N+1 risk, loses HTTP caching, and hands you a query-cost-limiting burden you now own.

The common mistake: adopting GraphQL/gRPC for resume reasons on a workload REST handles fine, then
re-inventing the caching and rate-limiting HTTP gave for free. State the tradeoff; default to REST.

## 2. Errors are part of the contract — RFC 9457, never 200-with-error
Ship `application/problem+json` with the standard members — `type` (a **stable, documented URI**),
`title`, `status`, `detail`, `instance` — plus extension members (e.g. `errors[]` for field-level
validation). The cardinal sin: HTTP **200 with `{"error":…}`**. That lies to every proxy, cache, retry
library, and SLO dashboard — the CDN caches the "error", monitoring shows 100% success while users
fail. Pick the status precisely:
- **400** malformed syntax vs **422** well-formed but semantically invalid.
- **401** "who are you" vs **403** "I know you, denied".
- **409** conflict · **429** throttled.

Clients branch on the stable `type` URI, **not** on the human-readable `detail` string — so `type`
must never change meaning under a client's feet.

## 3. Authorization lives in the contract (OWASP API1 BOLA + API3 BOPLA)
The two top API risks are interface-design failures, not code bugs — so they belong here:
- **BOLA (object-level):** any endpoint taking an object id (`/orders/{id}`) **must** specify
  owner-scoped authorization in the contract — never trust a guessable id. Prefer **non-enumerable
  ids (UUID/ULID)** so the contract doesn't hand attackers a map.
- **BOPLA / mass-assignment:** define **explicit** request and response schemas — allow-list writable
  fields, return-list readable fields. Never bind the request body onto your entity, or a client sets
  `"role":"admin"` (the real GitHub/Twitter breaches). Mark server-controlled fields `readOnly` and set
  `additionalProperties: false` on inputs to reject unknown properties.

`truestack-backend-development` enforces these at runtime; the contract is where they're *specified*.

## 4. Idempotency-Key on every unsafe, retryable write
Any POST/PATCH that creates money or side-effects **must** accept a client-generated
`Idempotency-Key` (a UUID). Server contract:
- Persist `key → first-response`, keyed **also** by a request-payload fingerprint.
- On retry after completion → **replay** the stored response (same status + body).
- While the original is still in flight → **409 Conflict**.
- Same key, **different** payload → **422** (this catches client bugs).
- Publish the key-retention/expiry window.

On one box this is cheap — one indexed table whose unique constraint *is* the dedup lock — and it's
the single highest-leverage reliability feature: without it, one network blip double-charges a
customer. `truestack-backend-development` builds the table; the contract names the header and the rules.

## 5. Pagination — keyset/cursor by default, with a tie-breaker
OFFSET/LIMIT degrades (the DB scans and discards N rows) and silently skips or duplicates rows when
data shifts between page fetches. Use **keyset (cursor)** pagination over a **stable, indexed, unique**
sort key. The trap teams hit: sorting by a non-unique column (`created_at`, `name`) needs the primary
key as a **secondary tie-breaker**, and the opaque cursor must encode **both** columns — else rows
sharing a timestamp are lost at the page boundary. Make the cursor **opaque** (base64 of the key tuple)
so you can change the underlying sort without breaking clients. Return a `next` cursor, **not** a total
count (counts are expensive and stale). Offset is acceptable only for small, bounded, admin-facing lists.

## 6. Version in the URI path; deprecate with standard headers
Put the **major** version in the path (`/v1/`) — visible in logs, routable by the reverse proxy
without header parsing, trivially CDN-cacheable. Bump the major **only** for breaking changes; ship
everything backward-compatible without a bump. When retiring a version, every response from it carries
**`Deprecation`** (RFC 9745) and **`Sunset`** (RFC 8594, an HTTP-date) plus a `Link rel="deprecation"`
to migration docs. Give a 6–24 month window, then return **410 Gone** (not 404/500) after the sunset
date so the deprecation is credible and observable.

## 7. Define "breaking" precisely — enforce it in CI, not in review
Encode the compatibility rule as a gate; humans miss breakage in PR review.
- **Safe (additive, no bump):** adding an optional request field, adding a response field, a new
  endpoint, a new enum value for tolerant readers.
- **Breaking (new major):** removing/renaming a field, tightening a type or validation, making an
  optional input required, removing an enum value, changing a status code or an error `type` URI.

Commit the **OpenAPI spec next to the code**, lint it on every PR (e.g. Spectral) for
consistency/security rules, and run an automated **backward-compat diff** to fail the build on any
breaking change. **Generate clients/stubs from the spec** so it can't drift from the implementation.
`truestack-ci-and-delivery` wires these as the actual PR checks; this skill supplies the definition they enforce.

## 8. Rate limit / quota is published, not a surprise 429
Advertise limits with `RateLimit` (remaining + reset) and `RateLimit-Policy` (quota + window) headers
so well-behaved clients self-throttle. On a **429** (and a **503**) always send `Retry-After`; when both
`Retry-After` and `RateLimit` are present, `Retry-After` wins. Document the limits **in the OpenAPI
spec**, not just prose. This matters *more* on a single box: there's no elastic autoscaling, so the rate
limiter is your primary overload-protection and fairness mechanism — size it to what the one box can
actually sustain.

## 9. Resource & convention discipline — decided once, up front
- **Nouns, plural collections** (`/orders`, `/orders/{id}/items`); HTTP verbs for actions — no
  `/getOrder`, `/createOrder` in the path. **201 + `Location`** for creates, **204** for empty success.
- **Lock conventions before the first endpoint:** one JSON casing (snake_case *or* camelCase, never
  both), timestamps as **RFC 3339 UTC** strings, money as **minor-units integers or decimal strings
  (never floats)**, explicit nullability.
- **Filtering/sorting** in query params with a **documented allow-list** of filterable/sortable fields —
  an open-ended filter language is an injection and performance footgun on one shared DB.

The hidden cost: inconsistency is itself a breaking-change generator — every later "fix" to a naming or
format inconsistency breaks a client. Get it right once.

## Honest exit
Claim only what the contract actually specifies and you've verified — a status code, a header name, a
standard's current status — against the source, not memory. If a decision turns on a fact you can't
ground (a draft's exact member names, whether the proxy passes HTTP/2), say so and abstain rather than
assert (honesty contract). When the contract changes a recorded convention or decision, update project
memory in the same change; then hand off to **truestack-quality-control** before "done".

## Explain it simply
Say what each choice *means* in one plain line — "a cursor is a bookmark, not a page number, so it
doesn't skip rows when the list shifts under you". Show protocol and versioning tradeoffs as a short
list or table, not prose. After designing the contract, state in one line what a client can now rely on
that it couldn't before — and hand off to **truestack-backend-development** to implement it.