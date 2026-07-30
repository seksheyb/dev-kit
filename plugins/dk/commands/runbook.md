---
description: Print the RUNBOOK — the full stage map, every command, every condition.
argument-hint: "[stage number or name]"
---
Read `${CLAUDE_PLUGIN_ROOT}/RUNBOOK.md` and show it. With `$ARGUMENTS`, show only that stage's
entry plus the one before and after it, so the operator sees where it sits in the sequence.

This command reads no state. It is the map, not your position — `/dk:status` is your position.
