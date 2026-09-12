# truestack

Ten focused engineering skills for Claude Code and Codex. Version **0.1.0** replaces the earlier 23-skill router with concise, independently discoverable guidance. Use the skills that fit the task; ordinary work does not require a forced orchestrator, model alias, role hierarchy, blanket tests, or an approval ritual.

| Skill | Use it for |
|---|---|
| architecture-planning | Material architecture decisions and cross-module plans |
| backend-engineering | Server logic, jobs, integrations, and concurrency |
| frontend-engineering | Interfaces, components, styling, and interactions |
| systematic-debugging | Causal diagnosis and measured performance investigation |
| ui-ux-review | Read-only usability, layout, and accessibility assessment |
| code-review | Actionable defects in a defined code or diff scope |
| test-verify | Proportionate checks and evidence for acceptance |
| database-api-evolution | Schema, migration, persisted-data, and API compatibility |
| execution-loop | Full requested coverage, correction loops, and continuity |
| deployment-safety | Confirmed targets, usable rollback, and bounded release storage |

The execution loop tracks every requested target through evidence or an explicit blocker. Debugging distinguishes symptoms, hypotheses, and demonstrated causes. Deployment guidance requires a concrete target and recovery plan before live mutation and reuses confirmation already given for that exact operation. These are instructions, not guarantees of agent behavior.

## Install or refresh

Use PowerShell 7 or later. Node.js is required only for optional hooks.

```powershell
git clone https://github.com/adtn0810/truestack.git
cd truestack
pwsh -File ./install.ps1
# Optional: register hook reminders for both clients
pwsh -File ./install.ps1 -WireHooks
```

The default installs physical files into canonical `~/.agents/skills` and matching physical Claude copies in `~/.claude/skills`. Codex discovers the canonical directory; no duplicate `~/.codex/skills` copy is created. Use `-Platform codex` for canonical files only or `-Platform claude` for canonical files plus the Claude mirror. After an authorized `git pull`, rerun the installer to refresh copies.

The installer:

- Preflights collisions, malformed hook JSON, and linked/reparse paths before writing.
- Tracks hashes of managed files. It updates unchanged managed copies; locally edited or unrelated files with the same name require explicit `-ReplaceExisting`.
- Backs up each changed existing file under `~/.agents/truestack/backups/<run-id>` before overwriting it. Review those backups before any manual cleanup.
- Keeps unrelated files and hooks, configuration permissions, authentication, models, and MCP settings. It never edits `config.toml` or global instruction files.
- Supports `-UserHome /absolute/isolated/home` for testing. That directory must already exist. It never deletes directories or follows junctions/symlinks.

`-ReplaceExisting` authorizes replacing the ten named skill entrypoint files and, with `-WireHooks`, the managed hook script. It does not delete extra files in those folders. Review collisions first. Filesystem or disk failures can interrupt an install; backups permit recovery, and rerunning resumes after the underlying issue is resolved.

## Upgrade from 0.0.x

This is a breaking discovery change. Before installing, disable the old plugin and back up then move old `truestack-*` skills and slash commands outside all active discovery directories. The installer refuses detected legacy entries rather than deciding ownership from their names or deleting them. Inspect any links before moving them; preserve their targets. Also disable any old plugin installation that discovery-directory checks cannot see.

The old eight slash commands, forced router, governance gate, MCP templates, and committed-memory workflow are retired. Invoke a core skill by its name instead. Legacy specialty documents remain available in Git history; they are not shipped as competing active skills.

With `-WireHooks`, the installer replaces the recognized old truestack hook commands in selected client settings, preserving sibling hooks. Without that flag, existing hooks remain unchanged: remove old truestack registrations manually after backing up those settings. Plugin-managed old hooks disappear when that old plugin is disabled.

## Optional hooks

`-WireHooks` copies `hooks/skill-guard.cjs` to `~/.agents/hooks/skill-guard.cjs`, and merges selected registrations into Claude's `settings.json` and/or Codex's `hooks.json`. New or changed Codex commands need the user's review and trust through `/hooks`; the installer does not grant trust.

Hooks provide relevant skill reminders and a bounded completion check after an observed file edit. They do not enforce deployment authorization or prove completion. Shell and MCP writes are outside the edit matcher. See [hook behavior and limits](hooks/README.md). Plugin installation does not automatically activate hooks.

## Claude plugin alternative

The repository also packages the skills as a Claude Code plugin:

```text
/plugin marketplace add ./truestack
/plugin install truestack@truestack
```

Choose plugin installation or physical-copy installation to avoid duplicate discovery. The plugin loads the ten skills under its namespace and has no default hooks, slash commands, or MCP configuration. Codex support in this release uses the physical-copy installer.

[Optional global working agreements](templates/working-agreements.md) can be reviewed and merged into your existing instructions. They contain no personal paths or settings. The installer never applies them.

## Verify

```powershell
node --test tests/package.test.cjs
node --test hooks/test-skill-guard.cjs
pwsh -File tests/install.tests.ps1
```

The installer tests create isolated homes and check actual files, backup contents, configuration preservation, collision refusal, legacy detection, and link refusal. CI is configured to run package, hook, and installer tests on Windows and Linux, plus secret scanning. These checks establish tested behavior, not complete host compatibility or guaranteed agent compliance.

MIT licensed. See [CHANGELOG.md](CHANGELOG.md) and [SECURITY.md](SECURITY.md).
