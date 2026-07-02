#!/usr/bin/env node
//
// truestack-orchestrate-reminder.js -- UserPromptSubmit hook (cross-platform).
//
// Makes truestack-orchestrate the default front-door router: injects a soft
// routing reminder via additionalContext on each prompt, so non-trivial work
// runs through the router without the user typing a command.
//
// Tuned to the router's OWN contract: encourage routing for real engineering
// work, explicitly allow skipping trivial one-offs / plain conversation -- so it
// does NOT nag like a mandatory every-prompt hook.
//
// Output: JSON with hookSpecificOutput on stdout. Exit code: always 0 (never blocks).

"use strict";

const fs = require("fs");

function extractPromptText(jsonPayload) {
  if (!jsonPayload) return "";
  let payload;
  try {
    payload = JSON.parse(jsonPayload);
  } catch {
    return "";
  }
  if (typeof payload !== "object" || payload === null) return "";

  const candidates = [payload.prompt, payload.userPrompt, payload.message, payload.text];
  for (const key of ["input", "hookInput", "hookSpecificInput", "payload"]) {
    const node = payload[key];
    if (node && typeof node === "object") {
      candidates.push(node.prompt, node.userPrompt, node.message);
    }
  }
  for (const item of candidates) {
    if (typeof item === "string" && item.length > 0) return item;
  }
  return "";
}

function emit(ctx) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: ctx,
      },
    })
  );
}

const REMINDER = `<system-reminder>
<truestack-routing>
For any non-trivial request (building, fixing, planning, reviewing, researching, migrating, multi-step work, or unclear scope), invoke the \`truestack-orchestrate\` skill FIRST. It classifies the request, right-sizes the effort, runs the canonical chain, and gates the result through \`truestack-quality-control\`. It may route to skills from other installed sets for domain depth.
Skip it only for a single trivial one-off, a pure factual answer, or plain conversation.
Honor the truestack contracts throughout: read project memory first (ground, don't recall), honesty over agreement, and keep the code <-> memory tally true.
</truestack-routing>
</system-reminder>`;

try {
  let inputJson = "";
  if (!process.stdin.isTTY) {
    try {
      inputJson = fs.readFileSync(0, "utf8");
    } catch {
      // no stdin / read failure
    }
  }

  const prompt = extractPromptText(inputJson).trim();

  // Skip when the user is already directing routing explicitly, to avoid double-routing.
  const isSlashCommand = prompt.startsWith("/");
  const mentionsOrchestrate = /orchestrate/i.test(prompt);

  emit(isSlashCommand || mentionsOrchestrate ? "" : REMINDER);
} catch {
  emit(""); // never block
}

process.exit(0);
