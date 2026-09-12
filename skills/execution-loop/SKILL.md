---
name: execution-loop
description: Complete the full scope of assigned implementation tasks, including all/every target requests and agent handoffs, through instructions, edits, evaluation, and focused corrections. Excludes read-only questions, research, and reviews unless changes are requested.
---

# Execution loop

Use one bounded loop: **Instruction → Edit → Evaluate → correction instruction → repeat or finish.** This skill coordinates progress; the relevant engineering skill supplies implementation guidance and test-verify supplies verification methods. Do not load every related skill, start background automation, or create another agent merely to run a loop. A small edit normally needs one short pass.

## Run the loop

1. **Instruction.** Establish the requested outcome, scope, constraints, and observable acceptance criteria from the user and current repository. Resolve material ambiguity; do not demand a formal plan for an obvious change. Preserve these criteria across iterations. Only user direction or newly established requirements justify changing them; never weaken them to make the implementation pass.
2. **Edit.** Inspect the current files and make the smallest coherent change toward an unmet criterion. Respect other agents' ownership and concurrent edits. A review-only evaluator does not gain permission to edit code by joining this workflow.
3. **Evaluate.** Inspect the actual result and run proportionate checks against the criteria. Use test-verify when selecting checks needs guidance. Tie evidence to the tested revision or relevant file state; distinguish inspected, executed, failed, and unverified checks. Passing a build or receiving an author's success claim is insufficient evidence for behavior it does not exercise. For debugging, apply systematic-debugging's evidence gate: a suspected defect is not a confirmed cause. Include causal evidence with a diagnosis and preserve uncertainty across handoffs. Use independent acceptance when the risk or existing instructions require it.
4. **Correct or finish.** If a criterion fails, form a short correction instruction containing the observed failure, expected outcome, relevant evidence, permitted scope, and the check that would establish success. Return to editing. After another relevant edit, refresh affected evidence; do not rerun unrelated checks without a reason. Finish when the requested criteria have adequate evidence, without inventing further polish work.

## Cover the entire request

For “all,” “every,” or multiple targets, discover and list the targets within the requested scope before editing. Record how the list was established: relevant routes, components, configuration, call sites, or runtime inventory. A supplied screenshot or example defines a pattern, not the sole target, unless the user limits the scope that way.

Keep a compact coverage matrix: **target | required behavior | state | evidence or blocker**. Include each separately required behavior and material subtarget; for tables, that can mean each table's columns × filtering and sorting. Track targets as pending, changed, verified, or blocked. Discovery of another target extends the matrix. Never silently drop an awkward target or invent an exemption.

A shared-component fix needs evidence that every listed consumer receives it; checking one screen does not establish that. Use suitable static, automated, and runtime evidence without blindly repeating identical manual work. After each evaluation, the next instruction addresses failed or remaining rows. Report partial coverage as “3 of 7 verified; 4 remain,” and continue authorized work. Claim full completion only when every required row is supported; blocked or unverified rows remain explicit unfinished work.

After two failed fixes for the same issue, switch to systematic-debugging or a fresh investigation before another patch. Carry the attempt count across handoffs. Continue authorized investigation while it can make progress; do not repeat an unsuccessful approach without new evidence. If a necessary decision, permission, dependency, or verification path is unavailable, report the exact blocker and remaining work. Respect user budgets and stop requests. An inability to verify is not a pass.

## Keep work moving

Before ending a turn, check the remaining criteria. If an authorized next action is available, take it now; do not end with a plan, an offer to continue, or a request for another prompt. A progress update is not a stopping point. When an agent or command is still working, use the available wait/resume mechanism and continue from its result. Answer user status questions briefly, then resume unless the user changes or stops the task.

Stop only when complete, explicitly paused, a stated budget/runtime limit is reached, or a concrete blocker prevents further useful authorized work. Finish independent remaining work before waiting on a blocker. State what remains and the smallest required input; never silently stall or call an incomplete task done. Before context compaction or a tool/runtime limit, preserve the goal, coverage, evidence, failed attempts, and exact next action in the existing task state so resumption does not require a new explanation. Do not promise execution after the session stops or create a background job without authorization.

For deployment, apply deployment-safety before any live mutation. The user's target confirmation is a required checkpoint, not an avoidable stall.

## Handoff

Explicitly include execution-loop in a delegated implementation instruction; if the recipient cannot access this skill, include the compact loop and relevant rules. Send only the context needed:

- **Goal:** overall outcome, constraints, acceptance criteria, and recipient's assigned subset.
- **State:** files or revision, relevant uncommitted changes, and work already performed.
- **Coverage:** target matrix, completed rows, remaining rows, and any blocked or unverified targets.
- **Evidence:** checks and results, the state they tested, and remaining uncertainty.
- **Next:** specific next action, failed attempts, hypotheses, and blockers.

The recipient reads applicable instructions and checks current artifacts and evidence freshness before continuing; it does not blindly trust “done.” Recheck only what changed or lacks support. A delegation handoff is a checkpoint, not overall completion. After integrating contributions, the coordinator evaluates the combined result before claiming the user's task is complete. Keep user updates brief: outcome or failure, next action, and a decision only when needed.
