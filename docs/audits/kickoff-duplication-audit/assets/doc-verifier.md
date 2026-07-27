# doc-verifier

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/doc-verifier.md`
- **file_lines**: 201
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 14

---

## Invocation 1 — step 14 (Document), block 5, lines 1248-1264

### verbatim_text

```text
Dispatch the doc-verifier agent last, now that content-qa has finished rewriting. It verifies
exactly one file per dispatch, so this is one agent per doc, not one agent for the doc set:
first list every doc this step created or touched — README, CHANGELOG, and everything under
docs/ — then dispatch one doc-verifier per doc, all in a single message. They only read the
codebase and each writes its own separate result file, so they do not collide.

Give each dispatch a <verify_assignment> block with both inputs it requires: doc_path, the doc's
path relative to the project root, and project_root, the absolute path of this repo. Leave the
output directory at its default, docs/state/tmp/.

Each agent writes docs/state/tmp/verify-<doc filename>.json and returns a one-line confirmation
and nothing else — by design it will not hand back claim detail inline, so do not ask it to.
Once they have all reported, read those JSON files yourself and give me the consolidated result:
every entry from every failures array with its doc, line, claim, expected and actual, plus the
claims_passed / claims_checked totals per doc, and a plain list of which docs came back clean.
```

### surrounding_prose

This is the final 'verify' step in the sequence, run last, after content-qa has finished rewriting. Followed by the standalone line '**Then land it.**' which transitions to the merge/deploy blocks below.

---
