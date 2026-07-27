# context-save

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/context-save/SKILL.md`
- **file_lines**: 127
- **has_references**: no
- **complexity**: high
- **invocation_count**: 6
- **invoked by steps**: 00, 02, 03, 04, 07, 11

---

## Invocation 1 — step 00 (Bootstrap), block 8, lines 117-120

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next.
```

### surrounding_prose

No conditioning italic tag precedes this block — it follows directly after the graphify/cso block, and appears to run unconditionally at the end of step 0, regardless of which of the preceding conditional branches were taken. Followed immediately by the final block in this step, a bare `/clear` command.

---

## Invocation 2 — step 02 (Architecture & tech stack), block 3, lines 239-242

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next.
```

### surrounding_prose

No prose between this block and the previous one (block 2) other than the blank line. Followed immediately by the '/clear' block (lines 244-246) with no prose in between, and then the '---' step-boundary divider at line 248.

---

## Invocation 3 — step 03 (Research & roadmap), block 2, lines 283-286

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next.
```

### surrounding_prose

A standalone checkpoint prompt placed after the roadmapper block, following the guide's recurring pattern of checkpointing at section boundaries. Describes what the checkpoint should capture: what is done, what got decided, and what is next.

---

## Invocation 4 — step 04 (Design system), block 2, lines 333-336

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next.
```

### surrounding_prose

No explicit conditioning prose beyond the preceding block; follows immediately after the design-html binding block, before the /clear block.

---

## Invocation 5 — step 07 (Plan the phase), block 6, lines 553-556

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next.
```

### surrounding_prose

No prose directly precedes or follows other than blank lines; sits between the analyze block above and the /clear block below.

---

## Invocation 6 — step 11 (Verify the goal), block 8, lines 954-958

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next. If verification surfaced a convention or a recurring gap pattern that
generalizes beyond this phase, also record it with the learn skill before the checkpoint.
```

### surrounding_prose

No explicit conditional gate; appears to run at the end of the step regardless. Conditional clause inside the block itself: the learn skill is invoked only 'if verification surfaced a convention or a recurring gap pattern that generalizes beyond this phase', and must run 'before the checkpoint' (i.e. before context-save).

---
