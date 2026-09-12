'use strict';

// Local workflow reminders and one completion checkpoint after observed edit tools.
// No model calls, transcript reads, shell commands, approvals, or project writes.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'apply_patch']);

function context(platform, event) {
  const skills = platform === 'claude' ? '~/.claude/skills' : '~/.agents/skills';
  if (event === 'PreToolUse') return `Before this edit, read and apply execution-loop at ${skills}/execution-loop/SKILL.md and the relevant engineering skill if not already read. Preserve the user's full criteria, existing authorization and other agents' work. For all/every requests, establish every target first. Do not reload unchanged skills or rerun unrelated checks.`;
  return `Apply only relevant skills from ${skills}. For implementation/handoffs, read execution-loop/SKILL.md: preserve all criteria, inventory all targets, edit, evaluate, correct and continue available authorized work. For diagnosis, read systematic-debugging/SKILL.md and provide causal evidence before confirming a cause; keep hypotheses labelled. For deployments, read deployment-safety/SKILL.md: obtain the user's confirmation of server name/IP/absolute path, artifact, usable rollback and bounded cleanup for that operation. Never invent approval or silently reuse another deployment's approval. Read-only questions need no implementation loop. Keep replies short and decisions clear. Carry coverage, raw evidence and remaining work into handoffs. User scope, stop requests and actual tool permissions take precedence; no automatic commits, full-suite ritual or extra approval gates.`;
}

function evaluate(input, previous, platform) {
  const event = input.hook_event_name;
  const state = {...(previous || {})};
  const turn = typeof input.turn_id === 'string' ? input.turn_id : null;
  const emit = text => ({hookSpecificOutput: {hookEventName: event, additionalContext: text}});
  if (event === 'UserPromptSubmit') {
    // Store only flags, never the user's prompt or tool arguments.
    const stopped = /^\s*(?:stop|pause|cancel|abort|停止|暂停)(?:\s+(?:now|working|the task|this task|here))?[.!。\s]*$/i.test(String(input.prompt || ''));
    return {state: {turn, edited: false, checked: false, reminded: false, stopped}, output: stopped ? {} : emit(context(platform, event))};
  }
  if (event === 'SessionStart' || event === 'SubagentStart') return {state, output: emit(context(platform, event))};
  if (turn && state.turn && turn !== state.turn) return {state, output: {}}; // stale tool completion
  if (!state.turn && turn) state.turn = turn;
  if (event === 'PreToolUse' && EDIT_TOOLS.has(input.tool_name) && !state.reminded && !state.stopped) {
    state.reminded = true;
    return {state, output: emit(context(platform, event))};
  }
  if (event === 'PostToolUse' && EDIT_TOOLS.has(input.tool_name)) {
    const result = input.tool_response;
    const failed = result && typeof result === 'object' &&
      (result.isError === true || result.is_error === true ||
       (typeof result.exit_code === 'number' && result.exit_code !== 0) ||
       (typeof result.exitCode === 'number' && result.exitCode !== 0));
    if (!failed) state.edited = true;
  }
  if (event === 'Stop' && state.edited && !state.checked && !state.stopped) {
    state.checked = true; // never repeatedly force continuation, even if runtime flag is absent
    const message = String(input.last_assistant_message || '');
    const waiting = /[?？]\s*$/.test(message) || /\b(?:awaiting|waiting for) (?:your|user) (?:approval|confirmation|input|answer)\b/i.test(message);
    if (input.stop_hook_active !== true && input.stopHookActive !== true && !waiting) return {state, output: {
      decision: 'block',
      reason: 'One completion checkpoint after an observed edit: apply execution-loop to the original criteria and every target, including integrated agent work. Check current evidence and state remaining gaps honestly. If an authorized next step remains, do it now. If everything is verified, finish briefly without repeating passed checks. If the user stopped, a limit was reached, or a required approval/input blocks progress, preserve that pause and state what remains; do not bypass it. This checkpoint runs once, does not establish correctness, and never authorizes deployment, commits or extra work.'
    }};
  }
  return {state, output: {}};
}

function stateFile(base, input, platform) {
  if (typeof input.session_id !== 'string' || !input.session_id) return null;
  const id = crypto.createHash('sha256').update(platform + ':' + input.session_id + ':' + (input.agent_id || '')).digest('hex');
  return path.join(base, id + '.json');
}

function prune(base, keep) {
  // Only this guard's flat metadata directory; never traverse symlinks or projects.
  const files = fs.readdirSync(base, {withFileTypes: true})
    .filter(x => x.isFile() && /^[a-f0-9]{64}\.json$/.test(x.name))
    .map(x => ({file: path.join(base, x.name), mtime: fs.lstatSync(path.join(base, x.name)).mtimeMs}))
    .sort((a, b) => b.mtime - a.mtime);
  for (let i = 0; i < files.length; i++) {
    if (files[i].file !== keep && (i >= 255 || Date.now() - files[i].mtime > 7 * 86400000)) fs.unlinkSync(files[i].file);
  }
}

async function processEvent(input, platform, home = os.homedir()) {
  // Start events are stateless, including arbitrarily many delegated agents.
  if (['SessionStart', 'SubagentStart'].includes(input.hook_event_name)) return evaluate(input, {}, platform).output;
  const base = path.join(home, '.agents', 'hook-state', 'skill-guard');
  const file = stateFile(base, input, platform);
  if (!file) return {}; // no reliable identity: never create shared fallback state
  let dir = home;
  for (const part of ['.agents', 'hook-state', 'skill-guard']) {
    dir = path.join(dir, part);
    try { fs.mkdirSync(dir); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const stat = fs.lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return {};
  }
  const lock = file + '.lock';
  let lockHandle;
  for (let attempt = 0; attempt < 20; attempt++) {
    try { lockHandle = fs.openSync(lock, 'wx', 0o600); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      // Recover only this exact owned stale lock after a crashed process.
      try {
        const stat = fs.lstatSync(lock);
        if (stat.isFile() && !stat.isSymbolicLink() && Date.now() - stat.mtimeMs > 30000) fs.unlinkSync(lock);
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  if (lockHandle === undefined) return {}; // bounded fail-open contention
  try {
    let state = {};
    if (fs.existsSync(file)) {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2048) return {};
      try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { state = {}; }
    }
    const result = evaluate(input, state, platform);
    fs.writeFileSync(file, JSON.stringify(result.state), {encoding: 'utf8', mode: 0o600});
    prune(base, file);
    return result.output;
  } finally {
    fs.closeSync(lockHandle);
    fs.unlinkSync(lock);
  }
}

function main() {
  const platform = process.argv.includes('--platform=claude') ? 'claude' : 'codex';
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { raw += chunk; if (raw.length > 8 * 1024 * 1024) process.exit(0); });
  process.stdin.on('end', async () => {
    try {
      const input = JSON.parse(raw);
      if (!input || typeof input !== 'object') return;
      process.stdout.write(JSON.stringify(await processEvent(input, platform)));
    } catch {
      // A broken advisory hook must not stall work or alter an approval decision.
      process.stdout.write('{}');
    }
  });
}

module.exports = {evaluate, context, stateFile, prune, processEvent};
if (require.main === module) main();
