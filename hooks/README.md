# Optional skill reminders

Enable with `pwsh -File ./install.ps1 -WireHooks`. The script is copied to `~/.agents/hooks/skill-guard.cjs`; registrations use `node "absolute/path/skill-guard.cjs" --platform=claude` or `--platform=codex`. Each command has a five-second timeout and uses only Node's built-in modules.

| Event | Purpose |
|---|---|
| SessionStart | Establish concise workflow context |
| UserPromptSubmit | Suggest relevant core skills |
| SubagentStart | Remind a delegated agent to retain scope and evidence |
| PreToolUse | Remind before a matched edit |
| PostToolUse | Record an observed successful matched edit |
| Stop | Request a bounded follow-up after an observed edit |

PreToolUse and PostToolUse use `^(Write|Edit|MultiEdit|apply_patch)$`. Shell commands, MCP tools, and other write mechanisms are not observed by this matcher. No SubagentStop registration is installed.

Claude registrations are merged into `~/.claude/settings.json`; Codex registrations into `~/.codex/hooks.json`. The installer preserves unrelated hooks, permissions, authentication, model choices, and MCP settings, and never changes Codex `config.toml`. Codex requires the user to review and trust new or changed commands through `/hooks` before execution.

The hook gives context and a bounded Stop check. It is not a security sandbox, authorization engine, deployment gate, or proof that tests ran and every requested target is complete. Host event support and user trust affect whether it runs. Skill instructions retain the detailed workflow.

The default plugin hook file is empty: plugin installation alone does not enable hooks. Avoid installing both the plugin skills and physical-copy skills. To disable these optional hooks, back up client settings and remove only command entries referencing your installed `skill-guard.cjs`; preserve other hooks. Do not remove the script while registrations still reference it.

Run `node --test hooks/test-skill-guard.cjs` to test the guard.
