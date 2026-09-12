'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {evaluate, stateFile, prune, processEvent} = require('./skill-guard.cjs');
const event = (name, extra = {}) => ({hook_event_name: name, session_id: 'fixture', turn_id: 'turn-1', ...extra});
const run = (input, state = {}, platform = 'codex') => evaluate(input, state, platform);
test('prompt reminders contain no user prompt data and route read-only work appropriately', () => {
  for (const platform of ['codex', 'claude']) {
    const r = run(event('UserPromptSubmit', {prompt: 'PRIVATE_EXAMPLE'}), {}, platform);
    assert(!JSON.stringify(r).includes('PRIVATE_EXAMPLE'));
    assert.match(r.output.hookSpecificOutput.additionalContext, /Read-only questions need no implementation loop/);
    assert.match(r.output.hookSpecificOutput.additionalContext, /execution-loop/);
    assert(!r.output.decision);
  }
});
test('session and delegated starts receive context without blocking creation', () => {
  for (const name of ['SessionStart', 'SubagentStart']) {
    const r = run(event(name));
    assert.equal(r.output.hookSpecificOutput.hookEventName, name);
    assert(!r.output.decision);
  }
});
test('read-only work and dirty-repo conditions do not trigger stop checkpoint', () => {
  let r = run(event('UserPromptSubmit'));
  r = run(event('PostToolUse', {tool_name: 'Bash', tool_input: {command: 'git status'}, tool_response: {exit_code: 0}}), r.state);
  assert.deepEqual(run(event('Stop'), r.state).output, {});
});
test('actual edit triggers exactly one checkpoint; does not count unrelated tool arguments', () => {
  for (const tool of ['Write', 'Edit', 'MultiEdit', 'apply_patch']) {
    const changed = run(event('PostToolUse', {tool_name: tool})).state;
    const first = run(event('Stop'), changed);
    assert.equal(first.output.decision, 'block');
    assert.deepEqual(run(event('Stop'), first.state).output, {});
  }
  assert.deepEqual(run(event('Stop'), run(event('PostToolUse', {tool_name: 'Read', tool_input: {text: 'apply_patch'}})).state).output, {});
});
test('pre-edit reminder does not block or grant approval and is bounded', () => {
  const first = run(event('PreToolUse', {tool_name: 'Edit'}));
  assert.match(first.output.hookSpecificOutput.additionalContext, /every target first/);
  assert(!first.output.hookSpecificOutput.permissionDecision);
  assert.deepEqual(run(event('PreToolUse', {tool_name: 'Edit'}), first.state).output, {});
});
test('failed edits, stale turns, stop continuation, and approval waits do not restart work', () => {
  const changed = run(event('PostToolUse', {tool_name: 'Edit'})).state;
  assert.deepEqual(run(event('Stop', {stop_hook_active: true}), changed).output, {});
  assert.deepEqual(run(event('Stop', {last_assistant_message: 'Please confirm this target?'}), changed).output, {});
  assert.deepEqual(run(event('Stop', {last_assistant_message: 'Waiting for your confirmation.'}), changed).output, {});
  assert.deepEqual(run(event('Stop', {turn_id: 'other'}), changed).output, {});
  const failed = run(event('PostToolUse', {tool_name: 'Edit', tool_response: {isError: true}})).state;
  assert.deepEqual(run(event('Stop'), failed).output, {});
});
test('explicit stop prompt clears prior edit checkpoint; new task resets state', () => {
  const changed = run(event('PostToolUse', {tool_name: 'Edit'})).state;
  const stopped = run(event('UserPromptSubmit', {prompt: 'Stop now.'}), changed);
  assert.deepEqual(stopped.output, {});
  assert.deepEqual(run(event('Stop'), stopped.state).output, {});
  assert.equal(run(event('UserPromptSubmit', {prompt: 'Fix another task', turn_id: 'turn-2'}), changed).state.edited, false);
});
test('state identity cannot escape its directory and separates users of the runtime', () => {
  const base = path.join(os.tmpdir(), 'guard-id-test');
  const input = event('Stop', {session_id: '../../outside'});
  const c = stateFile(base, input, 'codex');
  assert.equal(path.dirname(c), base);
  assert.notEqual(c, stateFile(base, input, 'claude'));
  assert.equal(stateFile(base, {session_id: null}, 'codex'), null);
});
test('retention prunes only owned metadata and caps retained files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-guard-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'unrelated.txt'), 'keep');
    for (let i = 0; i < 260; i++) fs.writeFileSync(path.join(dir, i.toString(16).padStart(64, '0') + '.json'), '{}');
    prune(dir, path.join(dir, '0'.repeat(64) + '.json'));
    assert(fs.existsSync(path.join(dir, 'unrelated.txt')));
    assert(fs.readdirSync(dir).filter(x => x.endsWith('.json')).length <= 256);
  } finally {
    for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file));
    fs.rmdirSync(dir);
  }
});
test('command contract handles malformed input safely without external writes', () => {
  for (const input of ['not-json', 'null', JSON.stringify({hook_event_name: 'Stop'})]) {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'skill-guard.cjs')], {input, encoding: 'utf8'});
    assert.equal(r.status, 0);
    if (r.stdout) assert.deepEqual(JSON.parse(r.stdout), {});
  }
});

function isolated(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-guard-io-'));
  t.after(() => {
    const target = path.resolve(dir);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert(path.basename(target).startsWith('skill-guard-io-'));
    fs.rmSync(target, {recursive: true});
  });
  return dir;
}
test('many start events are stateless and do not accumulate files', async t => {
  const dir = isolated(t);
  for (let i = 0; i < 270; i++) await processEvent(event('SubagentStart', {agent_id: String(i)}), 'codex', dir);
  assert.deepEqual(fs.readdirSync(dir), []);
});
test('concurrent successful and failed tool events preserve the completion checkpoint', async t => {
  const dir = isolated(t);
  await processEvent(event('UserPromptSubmit', {prompt: 'Edit this fixture'}), 'codex', dir);
  await Promise.all([
    processEvent(event('PostToolUse', {tool_name: 'Edit'}), 'codex', dir),
    processEvent(event('PostToolUse', {tool_name: 'Edit', tool_response: {isError: true}}), 'codex', dir),
    processEvent(event('PreToolUse', {tool_name: 'Edit'}), 'codex', dir)
  ]);
  const stops = await Promise.all([processEvent(event('Stop'), 'codex', dir), processEvent(event('Stop'), 'codex', dir)]);
  assert.equal(stops.filter(x => x.decision === 'block').length, 1);
});
test('metadata storage rejects ancestor links before writing into their targets', async t => {
  const dir = isolated(t);
  const outside = path.join(dir, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(dir, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(await processEvent(event('UserPromptSubmit'), 'codex', dir), {});
  assert.deepEqual(fs.readdirSync(outside), []);
});
