# truestack enforced governance gate

The skills describe an **Ask-first boundary** (money · destructive · schema · outbound) as
*guidance* the model is asked to follow. This directory makes one layer of it **enforced** by
the Claude Code harness, so a destructive or financial call is stopped *before* it runs — not
just discouraged.

## Files
| File | Purpose |
|---|---|
| `pretooluse-gate.mjs` | The gate. A zero-dependency Node PreToolUse hook (Node ships with Claude Code, so it runs everywhere). |
| `hooks.json` | Registers the gate on **every** tool call (`"matcher": "*"`) when this plugin is enabled. |
| `permissions.template.json` | Optional defense-in-depth `permissions` policy to merge into your project `.claude/settings.json`. |
| `test-gate.mjs` | 54-case test suite that runs the real hook and asserts each decision. `node hooks/test-gate.mjs`. |

## Decision model (deliberate)
The gate **never says `allow`** — emitting `allow` would suppress your own permission settings
and silently widen access (the classic hook bypass). It only ever:

- **`deny`** — blocks the unambiguously catastrophic (`rm -rf /`, fork bomb, `dd` to a raw disk, `mkfs`, wiping a drive root).
- **`ask`** — forces human approval for any positively-detected **money / destructive / schema / outbound** action, *even if your settings would have allowed it*.
- **`defer`** — no opinion; falls back to Claude Code's normal permission flow. This is the path for all reads and anything not positively flagged, so the gate only ever *adds* restriction.

It classifies by command/tool **structure**, never by scanning argument text — so `cat
payment.ts`, `grep -r delete`, and a read-only `aggregate` are *not* gated.

## What is gated
- **Bash / PowerShell** — recursive/forced deletes, `git clean -f*`, `truncate`/`tee`/`>` onto sensitive files, `DROP`/`TRUNCATE`/`deleteMany`/`flushall`, `docker volume rm`, `kubectl delete`, `terraform destroy`, `aws s3 rb`, pipe-into-shell / `curl … | bash` / `base64 -d | sh` / `eval` / `Invoke-Expression`, and PowerShell `Remove-Item`/`ri`/`del`/`Clear-Content` regardless of flag order or alias.
- **MCP tools** — the leaf tool name is matched as whole tokens for money/destructive/schema/outbound/write verbs (so `get_and_delete`, `resolve_and_charge`, `find_and_modify` are all gated — a read-verb prefix does **not** exempt them), plus write-class input stages (`$out`, `$merge`, `bulkWrite`, …).

## What is intentionally **not** gated (deferred)
- **Edit / Write / MultiEdit / NotebookEdit** — writing text into a file is not executing it; the destructive act is caught where it *runs* (shell/MCP). Your normal edit-permission flow still applies.
- **WebFetch and reads** — deferred to the normal flow. (Outbound *exfiltration* via WebFetch is out of scope for this structural gate; the untrusted-data boundary in `mcp-integration` covers the injection side.)

This is a guardrail, **not a sandbox**: it stops the obvious-and-catastrophic and forces a human
yes on write-class effects. It does not make a compromised host safe.

## Enable it
- **As part of the plugin:** `hooks/hooks.json` is picked up automatically when the plugin is enabled — no action needed.
- **In a single project (without the plugin):** copy `pretooluse-gate.mjs` into `<project>/hooks/` and add to `.claude/settings.json`:
  ```json
  { "hooks": { "PreToolUse": [ { "matcher": "*", "hooks": [
    { "type": "command", "command": "node \"${CLAUDE_PROJECT_DIR}/hooks/pretooluse-gate.mjs\"", "timeout": 30 }
  ] } ] } }
  ```
- **Defense-in-depth:** merge `permissions.template.json` into your `.claude/settings.json`. The MCP rules use `mcp__*__<tool>` wildcards; **replace `*` with your real server id** (e.g. `mcp__plugin_mongodb_mongodb__delete-many`) for exact matching — the hook already gates these server-agnostically, so the template is a backstop.

## Verify
```sh
node hooks/test-gate.mjs   # 54/54 should pass
```
The suite covers reads (defer), write-class (ask), catastrophic (deny), the adversarial bypasses
(read-prefix MCP, `git clean -fdx`, `curl|bash`, redirect-to-db, PowerShell aliases), and the
garbled-input fail-safe (ask).
