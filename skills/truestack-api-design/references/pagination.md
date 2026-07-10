# Keyset pagination — cursor mechanics and the tie-breaker trap

Loaded on demand from SKILL.md §5. Why keyset wins, how the cursor is encoded, and the
boundary bug that silently loses rows.

## Why OFFSET/LIMIT loses
The DB scans and discards N rows — cost grows with page depth — and rows inserted or deleted
between page fetches make offsets silently skip or duplicate results. Offset is acceptable
only for small, bounded, admin-facing lists.

## The tie-breaker trap
Sorting by a non-unique column (`created_at`, `name`) needs the primary key as a **secondary
tie-breaker**, and the cursor must encode **both** columns — else rows sharing a timestamp are
lost at the page boundary. This is the trap teams hit in production, not in review.

## Cursor rules
- Make the cursor **opaque** (base64 of the key tuple) so you can change the underlying sort
  without breaking clients.
- Return a `next` cursor, **not** a total count — counts are expensive and stale.
