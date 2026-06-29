---
description: Run a verified, multi-source research pass and return a cited answer — parallel searches, primary sources, adversarial cross-checking, confidence stated.
argument-hint: <the question or decision to research>
---
Use the **truestack-deep-research** skill.

Question: $ARGUMENTS

Scope the question, fan out parallel searches (read-only agents via truestack-agent-coordination for
breadth), prefer primary/authoritative dated sources, and verify every load-bearing claim
against a second independent source while looking for disconfirming evidence. Answer first,
then separate verified / contested / unknown, give a confidence level, and list sources. Don't
invent citations; if sources conflict, show the range.
