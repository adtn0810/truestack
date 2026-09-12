# Security policy

The latest 0.1.x release receives fixes. Older releases are unsupported.

truestack supplies agent instructions and optional local Node hook reminders. Neither is a security boundary. The hook does not enforce external-action authorization, validate every tool call, or prove that work is complete. Use the host's permissions and trust controls for tool access.

The installer backs up modified existing files, refuses path links and unapproved collisions, and preserves unrelated settings. It cannot protect a compromised machine or concurrent hostile filesystem changes. Review the source before installation and keep secrets out of instructions, diagnostic output, and public contributions.

Report vulnerabilities through this repository's private GitHub Security Advisory reporting when available. Do not post credentials or sensitive reproduction data in a public issue.
