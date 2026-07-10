# Idempotency-Key — the full server contract

Loaded on demand from SKILL.md §4. The body states the rule; this is the state machine the
contract must publish for every unsafe, retryable write.

## Key + fingerprint
- The key is **client-generated** (a UUID), sent as `Idempotency-Key` on any POST/PATCH that
  creates money or side-effects.
- Persist `key → first-response`, keyed **also** by a request-payload fingerprint — the key
  alone can't tell a legitimate retry from a client bug reusing it.

## State machine
- Retry after completion → **replay** the stored response (same status + body).
- Original still in flight → **409 Conflict** — never run the work twice concurrently.
- Same key, **different** payload → **422** (this catches client bugs).
- Publish the key-retention/expiry window — the replay guarantee is only as good as its stated
  lifetime.

## On one box
This is cheap — one indexed table whose unique constraint *is* the dedup lock — and it's the
single highest-leverage reliability feature in the contract. `truestack-backend-development`
builds the table; the contract names the header and these rules.
