# guard

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/guard/SKILL.md`
- **file_lines**: 109
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 08, 13

---

## Invocation 1 — step 08 (Build it, test-first), block 3, lines 628-633

### verbatim_text

```text
Also apply: secure-code-guardian (this track touches auth / input handling / crypto),
fullstack-guardian (this feature spans frontend and backend together), refactoring-specialist
(this track touches existing code), guard (this track touches prod / shared / destructive
surface). Skip any that do not apply.
```

### surrounding_prose

Preceded by plain prose: 'Add the guards this phase actually needs:'. Each guard skill is parenthetically conditioned on a specific track property (touches auth/input/crypto; spans frontend+backend; touches existing code; touches prod/shared/destructive surface), and the block closes with 'Skip any that do not apply' — these are all conditional, not mandatory, additions to the track brief.

---

## Invocation 2 — step 13 (Ship — open the PR), block 0, lines 1081-1090

### verbatim_text

```text
Use the guard skill in safety mode for the rest of this milestone — destructive-command
warnings only. Do not set an edit-scope freeze and do not ask me which directory to lock edits
to: step 14 rewrites README, CHANGELOG and docs/** across the whole repo, and a freeze boundary
blocks writes outright rather than warning on them, so it would stop step 14 dead. From here
through the deploy at the end of step 14 I want destructive-command warnings active: stop and
ask before anything matching force-push, git reset --hard, rm -rf, DROP TABLE/DATABASE, kubectl
delete, or a docker prune, and tell me the specific risk rather than just naming the pattern.
This is a speed bump, not a wall — I can always override — but I want to be the one overriding.
```

### surrounding_prose

Header for the whole step: 'Ship — open the PR, do not merge yet.' Bold callout: 'Stop at the PR.' Step 14 documents the milestone while the diff is still unmerged, and the merge/deploy half happens at the end of step 14. Immediately before this block: 'This is the most destructive surface in the pipeline — it merges, it deploys, and it touches prod. Turn the safety rails on first, and leave them on through the deploy at the end of step 14:' This block runs unconditionally, first, before the deploy-surface setup and before opening the PR.

---
