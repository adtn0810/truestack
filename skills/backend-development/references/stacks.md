# Per-language stack playbook

Detect the project's language from memory (`CLAUDE.md` / `.ai/memory/project-profile.md`).
For an existing repo, **match the stack in use — don't switch it**; the recommend-a-stack
step in `backend-development` is only for new/greenfield work. Then apply the idioms below.

## Node.js / Express.js
**Defaults**: Express (or Fastify) + TypeScript; Postgres via `pg` Pool or Prisma.
**Data accuracy**
- Validate every body/params/query with zod or Joi at the boundary; trust nothing.
- Wrap multi-step writes in a transaction (`pg` `BEGIN/COMMIT`, Prisma `$transaction`).
- One central error-handling middleware; use `express-async-errors` (or wrap handlers) so async throws aren't swallowed.
**Performance & anti-overload (self-hosted)**
- Never block the event loop — push CPU-heavy work to a worker thread or a queue.
- `pg` Pool with `max` tuned below Postgres `max_connections`; never a client per request.
- `helmet`, `compression`, `express-rate-limit` at the edge; cap `express.json({ limit })`.
- Run under pm2 (cluster mode) or systemd; handle SIGTERM for graceful shutdown.
- Paginate/stream large queries; index filtered/sorted columns; kill N+1.

## .NET / C#
**Defaults**: ASP.NET Core (Minimal APIs or controllers) on Kestrel; EF Core + Postgres/SQL Server.
**Data accuracy**
- Validate with FluentValidation or data annotations at the boundary.
- EF Core transactions (`BeginTransactionAsync`) for multi-step writes; idempotency keys for retried ops.
- Enforce constraints in the DB via migrations, not only in code.
- Money: `decimal`, never `double`/`float`.
**Performance & anti-overload (self-hosted)**
- **async all the way** — never `.Result` / `.Wait()` (thread-pool starvation, deadlocks).
- EF Core: `AsNoTracking()` for reads; avoid N+1 with `Include`/projection; compiled queries on hot paths; `AddDbContextPool`.
- Cache with `IMemoryCache` / `IDistributedCache` with size limits.
- Kestrel limits (max body size, concurrent connections); `IAsyncEnumerable` to stream large sets.
- Structured logging (Serilog).

## Python
**Defaults**: FastAPI (async) + uvicorn behind gunicorn; SQLAlchemy (async) or Django ORM; Postgres.
**Data accuracy**
- Validate and parse with Pydantic models at the boundary.
- Use a transaction / `session.begin()` for multi-step writes; idempotency for retries.
- Money: `decimal.Decimal`, never `float`.
**Performance & anti-overload (self-hosted)**
- Don't block the event loop in async code — run blocking/CPU work in a thread/process pool or a task queue (Celery/RQ).
- SQLAlchemy: pool sized to the box; avoid N+1 with `selectinload`/`joinedload`; stream large queries with `yield_per`.
- gunicorn with a bounded worker/thread count matched to CPU; uvicorn workers behind it.
- Cache (Redis, or `functools.lru_cache` for pure functions); rate-limit (slowapi); cap request size.
