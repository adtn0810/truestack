---
description: Run the project's tests / build / lint commands for the detected stack and report results in a scannable table.
argument-hint: [tests | build | lint | all | specific command]
---
Run the project's checks and report what happened.

What to run: $ARGUMENTS (default: the test suite)

Detect the stack from project memory (`CLAUDE.md` / `.ai/memory/`) and use the right tools
(see truestack-quality-control `references/tooling.md`) — e.g. jest/vitest, `dotnet test`, or pytest; build and
lint as asked. Show each command → result in a small table. On failure, surface the actual
error and hand off to **truestack-root-cause-debugging**; never report a pass you didn't run.
