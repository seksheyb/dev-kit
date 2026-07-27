# devex-review

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/devex-review/SKILL.md`
- **file_lines**: 249
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 12

---

## Invocation 1 — step 12 (Final review — milestone gate), block 2, lines 1014-1020

### verbatim_text

```text
Dispatch the devex-review skill; it runs the getting-started flow for real — CLI commands,
builds, actual errors — but makes no commits and changes nothing. Have it walk that real,
now-stable flow — time-to-hello-world, CLI --help output, the errors a newcomer actually
hits — and produce a scorecard, not prose. This is a gate: tell me plainly whether it passed,
because a failing scorecard blocks the ship.
```

### surrounding_prose

Conditioning line immediately above the fence: '*(only if the milestone shipped a developer-facing surface — API/CLI/SDK — across any of its phases)*' — this is the second functional-gate sub-block ('a shipped developer-facing surface triggers the second'). Followed by section header '**b. Security — always runs**' and prose: '**Scope it explicitly.** Bare, this command defaults to "the whole repo or current change" — which silently narrows a milestone gate down to one change. The gate is every threat model this milestone declared.' (that scoping prose conditions the NEXT block, block_index 3).

---
