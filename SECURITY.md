# Security Policy

`truestack` is a set of Claude Code **skills** (instructions/prompts) plus a small Node hook and
config. It ships no runtime service, but an agent skill set still carries a real threat surface:
it shapes what an autonomous agent does and which external tools it calls.

## Supported versions
The latest minor release receives fixes. See [CHANGELOG.md](CHANGELOG.md).

| Version | Supported |
|---|---|
| 6.2.x | ✅ |
| < 6.2 | ❌ |

## Threat model

| Threat | Where it bites | Mitigation in this set |
|---|---|---|
| **Prompt injection** (OWASP LLM01) — a tool result / file / web page tells the agent to act | any skill that reads external data | `mcp-integration` treats every tool result as **untrusted data, never instructions**; the honesty contract forbids acting on injected instructions; the `Never` boundary bans following instructions from untrusted data. |
| **Unsafe autonomous actions** — money moved, data destroyed, messages sent | `mcp-integration`, Bash/MCP tool calls | **Ask-first** boundary (money/destructive/schema/outbound) is now **enforced**, not just advised, by the PreToolUse hook in [`hooks/`](hooks/README.md): deny-catastrophic, ask-on-write-class, defer-the-rest. |
| **Secret exposure** | `.mcp.json`, logs, memory | `.mcp.json` is committed **secret-free** with `${VAR}` expansion only; `.gitignore` excludes `.env`/local overrides; `quality-control`'s safety pass scans for added secrets; "don't log full tool payloads with secrets/PII". |
| **Supply chain** (OWASP LLM03) — an MCP server package is malicious or rug-pulled | `.mcp.json` running `npx <pkg>` | Pin MCP packages to an exact version (see below and `mcp-config.md`); review server changes in PRs; least-privilege credentials per server. |
| **Advisory-only controls giving false assurance** | the whole set | This file is explicit about what is **enforced** (the hook) vs **advisory** (the rest). A markdown audit row is a record, not a runtime block. |

## What is enforced vs advisory
- **Enforced** (the harness can stop it): the PreToolUse gate in `hooks/` — deny/ask on destructive, financial, schema, and outbound tool calls. Verified by `node hooks/test-gate.mjs`.
- **Advisory** (the model is asked to comply): the untrusted-data boundary, idempotency, verify-the-effect, the append-only audit log, and the per-skill discipline. Strong by design, but not harness-enforced.

The gate is a **guardrail, not a sandbox** — it stops the obvious-catastrophic and forces a human
yes on write-class effects. It does not make a compromised host or a malicious MCP server safe.

## Reporting a vulnerability
**Please do not open a public issue for a security problem.**

1. Preferred: open a private report via the repository's **GitHub Security Advisories** ("Report a vulnerability").
2. Or email the maintainer at `<maintainer-email>` (fill in before publishing).

Include repro steps, the affected file(s)/skill(s), and impact. Expect an acknowledgement within
a few business days and a fix or mitigation plan once triaged.

## Hardening checklist for operators
- [ ] Enable the PreToolUse hook (ships in `hooks/`; auto-applies with the plugin) and run `node hooks/test-gate.mjs`.
- [ ] Merge `hooks/permissions.template.json` into `.claude/settings.json`, replacing `mcp__*` with your real server ids.
- [ ] **Pin** every MCP server package to an exact version in `.mcp.json` (no bare `npx -y <pkg>`).
- [ ] Keep secrets in env / a secret store; never in `.mcp.json` or `.ai/`.
- [ ] Use least-privilege credentials per server (read-only role for read-only servers).
- [ ] Run a secret scan (e.g. `gitleaks`) in CI on every push.
