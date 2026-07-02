# truestack enforced governance gate

The skills describe an **Ask-first boundary** (money · destructive · schema · outbound) as
*guidance* the model is asked to follow. This directory makes one layer of it **enforced** by
the Claude Code harness, so a destructive or financial call is stopped *before* it runs — not
just discouraged.

> **Hooks do not install themselves.** Claude Code loads hooks only from your settings files
> or from an **enabled plugin**. Plugin install → `hooks.json` is picked up automatically.
> **Drop-in install (the README's recommended path) → the gate is DEAD until you wire it**
> into settings — see "Enable it" below.

## Files
| File | Purpose |
|---|---|
| `pretooluse-gate.mjs` | The gate. A zero-dependency Node PreToolUse hook. Requires `node` on PATH (verify with `node --version` — a native/binary Claude Code install may not ship one; without node the hook errors and is silently inert). |
| `truestack-orchestrate-reminder.js` | UserPromptSubmit hook that nudges non-trivial requests through the `truestack-orchestrate` router (skips slash commands and trivial chat; never blocks). |
| `hooks.json` | Registers both hooks when this plugin is enabled (plugin installs only). |
| `permissions.template.json` | Optional defense-in-depth `permissions` policy to merge into your project `.claude/settings.json`. |
| `test-gate.mjs` | 77-case test suite that runs the real hook and asserts each decision. `node hooks/test-gate.mjs`. |

## Decision model (deliberate)
The gate **never says `allow`** — emitting `allow` would suppress your own permission settings
and silently widen access (the classic hook bypass). It only ever:

- **`deny`** — blocks the unambiguously catastrophic (`rm -rf /`, fork bomb, `dd` to a raw disk, `mkfs`, `diskpart`/`Format-Volume`, wiping a drive root).
- **`ask`** — forces human approval for any positively-detected **money / destructive / schema / outbound** action, *even if your settings would have allowed it*.
- **`defer`** — no opinion; falls back to Claude Code's normal permission flow. This is the path for all reads and anything not positively flagged, so the gate only ever *adds* restriction.

It classifies by command/tool **structure**, never by scanning argument text — so `cat
payment.ts`, `grep -r delete`, and a read-only `aggregate` are *not* gated.

## What is gated
- **Bash / PowerShell** — recursive/forced deletes, `git clean -f*`, `truncate`/`tee`/`>` onto sensitive files, `DROP`/`TRUNCATE`/`deleteMany`/`flushall`, `find -delete`, `rsync --delete`, SQL clients (`psql`/`mysql`/`sqlite3`) executing destructive statements, `docker volume rm`, `kubectl delete`, `terraform destroy`, destructive `aws`/`az`/`gcloud`/`gh` operations, pipe-into-shell / `curl … | bash` / `base64 -d | sh` / `eval` / `Invoke-Expression`, PowerShell **encoded commands** (`-EncodedCommand`/`-enc`), interpreter one-liners doing filesystem destruction (`node -e … rmSync`, `python -c … rmtree`), and PowerShell `Remove-Item`/`ri`/`del`/`Clear-Content` regardless of flag order or alias.
- **MCP tools** — the leaf tool name is matched as whole tokens for money/destructive/schema/outbound/write verbs (so `get_and_delete`, `resolve_and_charge`, `find_and_modify` are all gated — a read-verb prefix does **not** exempt them), plus write-class input content (`$out`, `$merge`, `bulkWrite`, `DELETE FROM …`, `DROP TABLE …` inside a generic `query`/`execute` tool's input).

## What is intentionally **not** gated (deferred)
- **Edit / Write / MultiEdit / NotebookEdit** — writing text into a file is not executing it; the destructive act is caught where it *runs* (shell/MCP). Your normal edit-permission flow still applies.
- **WebFetch and reads** — deferred to the normal flow. (Outbound *exfiltration* via WebFetch is out of scope for this structural gate; the untrusted-data boundary in `truestack-mcp-integration` covers the injection side.)

## Known accepted gaps (documented, not hidden)
This is a guardrail, **not a sandbox** — a determined adversary can compose commands no regex
list anticipates. Gaps we know about and accept (the permission system + review remain the
outer layers): variable-splitting (`CMD=rm; $CMD -rf /`), quote-splitting (`r''m -rf /`),
generic HTTP deletes (`curl -X DELETE …`), and novel tool combinations. If you find a new
practical bypass, add the pattern **and a regression test** together.

## Enable it
- **Plugin install:** `hooks/hooks.json` is picked up automatically when the plugin is enabled — no action needed.
- **Drop-in install (user-level, covers all projects):** add to `~/.claude/settings.json`, pointing at your clone (adjust the path):
  ```json
  { "hooks": {
    "PreToolUse": [ { "matcher": "*", "hooks": [
      { "type": "command", "command": "node \"$HOME/.claude/truestack/hooks/pretooluse-gate.mjs\"", "timeout": 30 } ] } ],
    "UserPromptSubmit": [ { "hooks": [
      { "type": "command", "command": "node \"$HOME/.claude/truestack/hooks/truestack-orchestrate-reminder.js\"", "timeout": 10 } ] } ]
  } }
  ```
- **In a single project (without the plugin):** copy `pretooluse-gate.mjs` into `<project>/hooks/` and add to `.claude/settings.json`:
  ```json
  { "hooks": { "PreToolUse": [ { "matcher": "*", "hooks": [
    { "type": "command", "command": "node \"${CLAUDE_PROJECT_DIR}/hooks/pretooluse-gate.mjs\"", "timeout": 30 }
  ] } ] } }
  ```
- **Defense-in-depth:** merge `permissions.template.json` into your `.claude/settings.json`. Bash rules use the `Bash(prefix:*)` prefix syntax; MCP rules must be **exact tool ids** (mid-name wildcards like `mcp__*__delete-many` are not supported) — the template ships MongoDB-plugin ids as concrete examples; duplicate the block for your own servers. The hook already gates these server-agnostically, so the template is a backstop.

## Verify
```sh
node hooks/test-gate.mjs   # 77/77 should pass
```
The suite covers reads (defer), write-class (ask), catastrophic (deny), the adversarial bypasses
(read-prefix MCP, `git clean -fdx`, `curl|bash`, encoded commands, interpreter one-liners,
`find -delete`, SQL-in-MCP-input, PowerShell aliases), false-positive guards (`grep truncate`,
"dropdown" in read input), and the garbled-input fail-safe (ask).
