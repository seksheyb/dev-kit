# ui-researcher

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/ui-researcher.md`
- **file_lines**: 414
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 06

---

## Invocation 1 — step 06 (Phase specs), block 4, lines 464-474

### verbatim_text

```text
Use the ui-researcher agent to write PHASE/UI-SPEC.md. Hand it a required_reading list of
docs/global/design/DESIGN.md (when step 4 produced one), PHASE/CONTEXT.md, PHASE/RESEARCH.md and
docs/milestones/<M>/REQUIREMENTS.md — it maps DESIGN.md's declared tokens onto this phase's
contract instead of re-asking. Then the ui-checker agent validates it against the 6 quality
dimensions; give it PHASE/UI-SPEC.md plus that same DESIGN.md / CONTEXT.md / RESEARCH.md set,
because DESIGN.md is the authority its spacing, typography and color dimensions check against
and CONTEXT.md's locked and deferred decisions are what it checks the spec for contradictions
of. It BLOCKs on undeclared drift from DESIGN.md as well as the usual checks. A BLOCKED verdict
halts planning until it is fixed.
```

### surrounding_prose

Preceded by '(only if this phase has UI work)' — a separate conditional gate from the AI/eval-contract chain, independent of it. DESIGN.md is conditionally referenced ('when step 4 produced one'). A BLOCKED verdict from ui-checker halts planning until fixed — load-bearing gate language. After this block, prose (not inside a fence) states: '(if this phase has both AI and UI work, run the two chains concurrently — they share no files. Each chain is internally sequential: every block in the AI chain reads a section the block above it wrote, and the UI checker needs the spec the UI researcher wrote.)' This is the final prose before the step boundary '---' at line 480, followed by '## 7. Plan the phase' at line 482 (out of this slice's range).

---
