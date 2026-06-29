---
name: truestack-deploy-and-runtime
description: Package, deploy, and run a self-hosted app on a single VPS without dropping
  requests. Use whenever the user is writing a Dockerfile or docker-compose for production,
  shrinking an image / multi-stage build, running a container as non-root, adding a
  healthcheck / liveness / readiness endpoint, fixing graceful shutdown / SIGTERM / dropped
  requests on deploy / stop_grace_period / a SIGKILLed container, putting nginx in front of
  the app, setting up TLS / HTTPS / certbot / Let's Encrypt / SSL renewal, doing a
  zero-downtime or blue-green deploy / reload without 502s, running docker compose under
  systemd so it survives reboot, injecting secrets / env / .env, or writing a deploy and
  rollback runbook. Triggers on "deploy to my VPS / one box", "my deploy causes downtime".
---

# truestack-deploy-and-runtime

Get the app onto one box and keep it serving through every deploy, cert rotation, and reboot.
One server, fixed resources, no autoscale — so "low-downtime" is a connection-draining
*reload*, never a *restart*, and every change has a sub-second rollback ready before it ships.
Stability over cleverness; a deploy that can't roll back isn't done.

Read project memory first — `CLAUDE.md` is auto-loaded (Principles + Boundaries); consult
`.ai/memory/` for the deploy commands, ports, domains, and ops decisions already recorded.
If none exists, run `truestack-project-memory`. A deploy, image, or cert change is **high-risk and
irreversible-shaped** — route the plan through `truestack-architecture-planning`'s approval gate before
touching the live box, and know the enforced **PreToolUse gate in `hooks/`** asks before the
destructive shell/MCP ops it classifies (`docker volume rm`, `rm -rf`, `git reset --hard`, a DB
migration) until a human approves.

**Where this skill sits:** the app/server logic is `truestack-backend-development`; this skill packages and
runs that app on the box. The CI workflow that *triggers* this deploy is `truestack-ci-and-delivery`; the
migration DDL it runs is `truestack-database-migrations`; the app's instrumentation/SLO signal is
`truestack-observability` (this skill owns the container/compose healthcheck and the cutover readiness gate).

## 1. Make SIGTERM reach the app, then handle it
The #1 silent failure: shell-form `CMD node server.js` makes `/bin/sh` PID 1, which swallows
SIGTERM — Docker waits the full grace period then SIGKILLs mid-request. Fixes:
- **Exec form** `CMD ["node","server.js"]` (or `init: true` / tini if you need an entrypoint wrapper) so the app is PID 1 and actually receives the signal.
- **Trap SIGTERM** and drain in order: (1) flip readiness to failing so the proxy stops routing, (2) `server.close()` to finish in-flight requests, (3) close DB pools, (4) hard-exit on a bounded timeout.
- Set **`stop_grace_period` LONGER than that timeout** — the 10s default is almost always too short and truncates a clean drain into a kill.

## 2. Liveness and readiness are two endpoints — never one
Conflating them causes restart loops and black-hole deploys.
- **`/healthz` (liveness)** — cheap, **no dependency checks**; only fails if the process is wedged. A DB check here lets a flapping database kill an otherwise-healthy app.
- **`/readyz` (readiness)** — checks dependencies **and returns failing during SIGTERM drain** so the proxy and the deploy gate stop sending traffic.
- The Docker/compose `HEALTHCHECK` hits **liveness**; the traffic switch gates on **readiness** returning 200. Set `start_period` so a slow boot isn't marked unhealthy prematurely.

## 3. Build small, non-root, reproducible
Smaller image = faster pull on deploy = shorter cutover window on one box.
- **Multi-stage** build, slim/distroless or alpine base, a dedicated `.dockerignore`.
- **Pin the base image by digest** (not `:latest`) so a build is reproducible and rollback-able.
- **Order layers** so dependency install caches *before* app code is copied.
- **`USER` with a fixed non-root UID/GID**; own only the files the app needs as that UID so it can still write its volumes/tmp.

## 4. Secrets as mounted files, not env vars
Env vars leak into `docker inspect`, child processes, crash dumps, and logs, and `.env` files
get committed by accident.
- Prefer Compose **`secrets:`** (mounted read-only at `/run/secrets/<name>`) or a path the app reads at startup.
- Keep the real secret file **outside the repo, `chmod 600`, owned by the deploy user, `.gitignore`d**.
- Non-secret config can use **`env_file:`** — the rule is *files for secrets, env for config*.
- Any new credential is an Ask-first / Never-commit boundary — record where it lives, not its value, in memory.

## 5. nginx in front: reload, don't restart
Low-downtime on one box is `nginx -s reload` (or `systemctl reload`): new workers pick up the
new config/cert while old workers finish in-flight requests — zero dropped connections.
- **Always `nginx -t` BEFORE reload** — a bad config on reload keeps the old workers serving; a bad config on a full *restart* takes the site down.
- **Set `worker_shutdown_timeout` explicitly** — the default is unbounded, so one long-lived/streaming connection blocks old workers from ever exiting during a deploy or cert swap.
- Harden TLS: **TLS 1.2/1.3 only, OCSP stapling on, modern ciphers**.

## 6. TLS renewal via deploy hook, not a restart cron
Certbot's systemd timer renews twice daily. Put the reload in
`/etc/letsencrypt/renewal-hooks/deploy/` (runs **only after a successful renewal**) running
`nginx -t && nginx -s reload` — a renewal never takes the site down and a fresh cert is picked
up with zero downtime. Use **DNS-01** for wildcard certs or when there's no inbound port 80.

## 7. Blue/green on one box: atomic swap + instant rollback
Don't `compose up` over the live container. Run two colors behind nginx:
1. **Record the current color / image digest** before touching anything.
2. Bring up the **new color on a second internal port**; poll its `/readyz` until 200 (hard timeout).
3. `nginx -t` → change **one upstream line** → `nginx -s reload` (<10ms cutover, no dropped requests).
4. Sleep a drain window, then `docker stop` the **old** container — but **keep it**.
- **Rollback** is then: point nginx back at the still-running old color and reload — sub-second, no rebuild. Teams that delete the old container turn a 1-second rollback into a multi-minute one.

## 8. Run Compose under systemd (survive reboots and crashes)
Let systemd, not Docker, own lifecycle:
- A unit with `ExecStart=docker compose up`, `ExecStop=docker compose down`, `Restart=on-failure` + `RestartSec`, and **`TimeoutStopSec` ABOVE `stop_grace_period`** so systemd doesn't SIGKILL a stack mid-drain.
- `restart: unless-stopped` (not `always`) on services; enable Docker **`live-restore`** so a daemon restart doesn't kill running containers.
- (Podman: Quadlet `.container` units are the supported path; `podman generate systemd` is deprecated.)

## 9. Deploy as an idempotent, fail-closed runbook
Capture the previous tag/color before you touch anything, and gate before *and* after the switch:
**record current SHA/digest → build & start new color → wait for `/readyz` (hard timeout) →
`nginx -t` → reload → smoke-test through the public URL → drain → stop (keep) old.** If any
gate fails **before** the nginx switch, abort and leave the old version serving — the deploy is
a clean no-op. Pin images by immutable tag/digest so "roll back" means "point at the previous
digest" deterministically — never rebuild "the last commit" and hope.

## Explain it simply
Say in one plain line what the deploy will do and how to undo it before running it ("Bring up
green, health-check it, flip nginx, keep blue for instant rollback"). Show the runbook as the
numbered gate list, not prose. After deploying, report what's live (color, digest), what was
kept for rollback, and the one command to roll back. If a gate failed and you left the old
version serving, say so plainly — a verified no-op beats an unverified "shipped" (honesty
contract).

When the Dockerfile/compose/nginx/systemd config changes, hand off to **truestack-quality-control** before
calling it done — and if the deploy command, port, domain, or rollback step changed, update
`.ai/memory/` in the same change so the code↔memory tally stays balanced.
