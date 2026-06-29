#!/usr/bin/env node
// truestack PreToolUse gate — enforces the Ask-first boundary (money / destructive /
// schema / outbound) that the truestack-mcp-integration + truestack-project-memory skills describe as guidance.
//
// Registered via hooks/hooks.json (matcher "*", so it sees EVERY tool call). Claude Code
// pipes a PreToolUse JSON object on stdin; we answer with exit 0 + JSON on stdout:
//   { "hookSpecificOutput": { "hookEventName": "PreToolUse",
//       "permissionDecision": "deny"|"ask"|"defer", "permissionDecisionReason": "..." } }
//
// DESIGN (deliberate, after adversarial review):
//   * We NEVER emit "allow". Emitting allow would suppress the user's own permission
//     settings and silently widen access — the source of the worst bypasses. Instead:
//       deny  = block outright (only the unambiguously catastrophic).
//       ask   = force human approval (any positively-detected money/destructive/schema/
//               outbound ACTION), even if the user's settings would have allowed it.
//       defer = no opinion → fall back to Claude Code's normal permission flow. This is
//               the path for all reads and anything we don't positively flag, so we add
//               restriction without ever removing it.
//   * We classify by command / tool STRUCTURE, never by scanning argument text. Reading a
//     file called payment.ts or grepping for "delete" is not performing that action.
//   * Edit/Write/MultiEdit/NotebookEdit are DEFERRED: writing text into a file is not
//     executing it. The destructive act (running a migration, a DROP) is caught when a
//     shell/MCP tool actually executes — which this gate does see.
//   * Fail-safe: unreadable/garbled stdin → ask (we cannot see the call, so a human must).
//
// Zero dependencies; Node is always present wherever Claude Code runs.

function decide(permissionDecision, permissionDecisionReason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision, permissionDecisionReason },
  }));
  process.exit(0);
}
const deny = (r) => decide("deny", r);
const ask = (r) => decide("ask", r);
const defer = (r) => decide("defer", r || "no gate match — normal permission flow");

function readStdin() {
  return new Promise((resolve) => {
    let data = "", done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    try {
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (c) => (data += c));
      process.stdin.on("end", () => finish(data));
      process.stdin.on("error", () => finish(null));
    } catch { finish(null); }
    setTimeout(() => finish(data || null), 10_000).unref?.();
  });
}

function safeStringify(v) { try { return JSON.stringify(v) ?? ""; } catch { return ""; } }

// ── Shell classification (Bash + PowerShell `command`) ──────────────────────
// Catastrophic & never-legit-in-dev → DENY.
const SHELL_DENY = [
  // rm -rf (any flag order) targeting a filesystem/home root
  [/\brm\b(?=[^\n|;&]*\s-\w*[rf])[^\n|;&]*\s(\/|\/\*|~|\$HOME|\$\{HOME\}|C:\\\\?|%USERPROFILE%)(\s|$)/i, "rm -rf on a filesystem/home root"],
  [/:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, "fork bomb"],
  [/\bdd\b[^\n|]*\bof=\/dev\/(sd|nvme|disk|mmcblk|vd)/i, "dd writing to a raw disk device"],
  [/\bmkfs(\.[a-z0-9]+)?\b/i, "mkfs (format filesystem)"],
  [/>\s*\/dev\/(sd|nvme|disk|mmcblk|vd)/i, "redirect onto a raw disk device"],
  [/\bchmod\b[^\n|;&]*\s-\w*R\w*\b[^\n|;&]*\s(\/|~|\$HOME)(\s|$)/i, "recursive chmod on a root"],
  [/\b(Clear-Disk|Format-Volume|Remove-Item|ri|rd|rmdir)\b[^\n]*\s(C:\\\\?|D:\\\\?|\$HOME|~)(\s|$)/i, "PowerShell wipe of a drive/home root"],
];
// Destructive / dangerous but plausibly legitimate → ASK.
const SHELL_ASK = [
  [/\brm\b[^\n|;&]*\s-\w*[rf]/i, "recursive/forced delete (rm)"],
  [/\brmdir\b[^\n]*\/s/i, "recursive rmdir"],
  [/\btruncate\b\s+-s\s*0/i, "truncate to zero"],
  [/\btee\b[^\n]*<\s*\/dev\/null/i, "tee with empty input (overwrite)"],
  [/(^|[^>\d&])>\s*(?!\/dev\/null)[^\s>|&;]*\.(db|sqlite3?|env|key|pem|pfx|kdbx|sql)\b/i, "overwrite of a sensitive file via >"],
  [/\bgit\s+clean\b[^\n|;&]*-\w*f/i, "git clean -f (wipes untracked/ignored files)"],
  [/\bgit\s+reset\b[^\n]*--hard/i, "git reset --hard"],
  [/\bgit\s+push\b[^\n]*(--force\b|(^|\s)-f\b)/i, "git force-push"],
  [/\b(drop|truncate)\s+(database|table|schema|index|collection)\b/i, "SQL/DDL drop or truncate"],
  [/\bdelete\s+from\b/i, "SQL DELETE FROM"],
  [/\b(dropDatabase|dropCollection|deleteMany|deleteOne|insertMany|updateMany|bulkWrite)\s*\(/i, "destructive/bulk DB call"],
  [/\.\s*remove\s*\(/i, "DB .remove()"],
  [/\b(flushall|flushdb)\b/i, "redis flush"],
  [/\baws\s+s3\s+(rb|rm)\b/i, "aws s3 remove"],
  [/\b(kubectl|helm)\s+(delete|uninstall)\b/i, "kubernetes delete/uninstall"],
  [/\bdocker\s+(rm|rmi|volume\s+rm|system\s+prune)\b/i, "docker remove/prune"],
  [/\bterraform\s+destroy\b/i, "terraform destroy"],
  [/\b(npm|yarn|pnpm)\s+publish\b/i, "package publish"],
  [/\b(userdel|deluser|dropuser|crontab\s+-r)\b/i, "delete user / crontab"],
  [/\bchmod\b[^\n]*\s-\w*R/i, "recursive chmod"],
  [/\bchown\b[^\n]*\s-\w*R/i, "recursive chown"],
  [/\bmv\b[^\n|]*\s\/dev\/null(\s|$)/i, "move to /dev/null (destroys data)"],
  [/\bshred\b/i, "shred"],
  // obfuscated / remote-fetched execution
  [/\|\s*(sudo\s+)?(sh|bash|zsh|pwsh|powershell)\b/i, "pipe into a shell"],
  [/\b(curl|wget|iwr|irm)\b[^\n|]*\|\s*\w*(sh|bash)/i, "download piped into a shell"],
  [/\b(base64\s+(-d|--decode)|xxd\s+-r|openssl\s+enc\s+-d)\b/i, "decode-then-execute payload"],
  [/\beval\b/i, "eval"],
  [/\b(Invoke-Expression|iex)\b/i, "PowerShell Invoke-Expression"],
  // PowerShell destructive (alias/flag-order agnostic)
  [/\b(Remove-Item|ri|del|erase|rd|Clear-Content|Set-Content)\b/i, "PowerShell remove/overwrite"],
  [/\bRemove-Item\b[^\n]*-\w*(Recurse|Force)/i, "PowerShell Remove-Item -Recurse/-Force"],
];

function classifyShell(cmd) {
  for (const [re, reason] of SHELL_DENY) if (reason && re.test(cmd)) return ["deny", reason];
  for (const [re, reason] of SHELL_ASK) if (re.test(cmd)) return ["ask", reason];
  return [null, null];
}

// ── MCP classification (by leaf tool name + input keys, most-dangerous wins) ──
const LEAF_MONEY = /\b(charge|charges|refund|refunds|transfer|transfers|payout|payouts|payment|payments|capture|withdraw|withdrawal|disburse|debit|void|settle|settlement|chargeback)\b/i;
const LEAF_DESTRUCTIVE = /\b(delete|drop|truncate|destroy|purge|wipe|erase|expunge|prune|flush|flushall|flushdb)\b/i;
const LEAF_OUTBOUND = /\b(send|publish|email|notify|dispatch|broadcast|webhook|sms|deliver|emit|message)\b/i;
const LEAF_SCHEMA = /\b(migrate|migration|alter|reindex|ddl)\b|\b(create|drop|rename)\s*(index|collection|table|column|database)\b|\b(add|drop)\s*column\b/i;
const LEAF_WRITE = /\b(insert|update|upsert|replace|modify|write|put|save|create|register|provision)\b/i;
// Mutation indicators inside the MCP tool input (e.g. an aggregate with a $out stage).
const INPUT_WRITE = /(\$out|\$merge|\$set|\$unset|bulkWrite|writeConcern|"?(deleteMany|insertMany|updateMany|drop)"?)/i;

function classifyMcp(toolName, toolInput) {
  const leafTail = toolName.split("__").slice(2).join("__") || toolName; // tool segment(s)
  const hay = leafTail.replace(/[_-]/g, " ");
  const blob = safeStringify(toolInput);
  if (LEAF_MONEY.test(hay)) return ["ask", `MCP money operation (${leafTail})`];
  if (LEAF_DESTRUCTIVE.test(hay)) return ["ask", `MCP destructive operation (${leafTail})`];
  if (LEAF_SCHEMA.test(hay)) return ["ask", `MCP schema/migration change (${leafTail})`];
  if (LEAF_OUTBOUND.test(hay)) return ["ask", `MCP outbound/send operation (${leafTail})`];
  if (LEAF_WRITE.test(hay)) return ["ask", `MCP write operation (${leafTail})`];
  if (INPUT_WRITE.test(blob)) return ["ask", `MCP call with a write-class stage in its input (${leafTail})`];
  return [null, null];
}

async function main() {
  const raw = await readStdin();
  if (!raw) return ask("PreToolUse hook could not read the tool call — approve manually.");
  let input;
  try { input = JSON.parse(raw); } catch { return ask("PreToolUse hook could not parse the tool call — approve manually."); }

  const toolName = String(input?.tool_name ?? "");
  const ti = input?.tool_input ?? {};

  // Shell tools (Bash, PowerShell, and anything shell-shaped that carries a command).
  if (/^(Bash|PowerShell|Shell|Sh)$/i.test(toolName) || typeof ti.command === "string" || typeof ti.script === "string") {
    const cmd = String(ti.command ?? ti.script ?? "");
    if (cmd) {
      const [d, reason] = classifyShell(cmd);
      if (d === "deny") return deny(`Blocked: ${reason}. truestack denies catastrophic, irreversible commands.`);
      if (d === "ask") return ask(`Approval required: ${reason}. truestack gates this Ask-first action.`);
    }
    return defer("shell command not matching a gated pattern");
  }

  // MCP tools.
  if (/^mcp__/i.test(toolName)) {
    const [d, reason] = classifyMcp(toolName, ti);
    if (d === "ask") return ask(`Approval required: ${reason}. truestack gates MCP write/money/destructive/outbound calls.`);
    return defer("MCP read/uncertain call — normal permission flow");
  }

  // Everything else (Read/Glob/Grep/Edit/Write/MultiEdit/NotebookEdit/WebFetch/Task/...) →
  // defer. Edits write text, not effects; effects are gated where they execute (shell/MCP).
  return defer(`${toolName || "tool"} not gated by truestack`);
}

main();
