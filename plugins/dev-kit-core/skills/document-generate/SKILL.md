---
name: document-generate
description: Diataxis documentation generator — researches the code thoroughly, then writes tutorials (learning-oriented), how-to guides (task-oriented), reference docs (information-oriented), and explanations (understanding-oriented) for a feature, module, or whole project. Use when asked to "document this", "write docs", "generate documentation", or fill documentation gaps.
---

# /document-generate — Diataxis Documentation Writer

Your job: produce **high-quality, structured documentation** for features, modules, or an entire project. You research the code thoroughly before writing a single line of documentation.

You follow the **Diataxis framework** — four quadrants, each serving a different reader need:
- **Tutorial** — learning-oriented, walks a newcomer through a working example step-by-step
- **How-to** — task-oriented, shows how to accomplish a specific goal (assumes basic familiarity)
- **Reference** — information-oriented, complete and accurate technical description
- **Explanation** — understanding-oriented, explains why things work the way they do

**Philosophy: research the whole, then write the parts.** Like an architect who surveys the entire site before drawing a single room, read the full codebase surface before writing any documentation. This prevents the "documentation that describes half the feature" failure mode.

## Step 0: Scope & Intent

1. Determine what to document: a specific target (feature, module, file) if one was named; the full project otherwise; or the specific gap list if invoked from a post-release doc-sync workflow.
2. Confirm the documentation target with the user:
   - A) Inline in existing files (README, ARCHITECTURE, etc.)
   - B) Standalone files (a `docs/` directory)
   - C) Both — inline summaries + deep standalone docs (recommended: maximizes discoverability and depth)
3. Output format: follow an existing `docs/` directory's conventions; follow the doc framework if one is in use (Nextra, Docusaurus, MkDocs, VitePress); else plain Markdown in `docs/`.

## Step 1: Codebase Archaeology (Research Phase)

**This is the most important step.** Do not skip or rush it. Documentation quality is directly proportional to how well you understand the code.

1. **Map the project structure** (find, excluding `.git`, `node_modules`, `dist`, `build`, `.next`).
2. **Read the upstream planning artifacts first — canonical sources, not a fallback.** If this
   project uses the GSD/spec-kit planning convention, read whichever of these exist for the
   target before anything else:
   - The relevant `spec.md` (`docs/specs/<NNN-feature-name>/spec.md`, or wherever this
     project's spec lives if the convention differs) — the "why" and the user-facing
     requirements (`US-xxx` stories) the target was built to satisfy.
   - `docs/architecture/SDD.md` and its ADRs (`docs/architecture/ADRs/`) — the system design
     and the trade-off analysis already written up for each significant decision.
   - The relevant `PLAN.md` (`.planning/phases/<phase>/*-PLAN.md`) — what was actually scoped
     and built, and why it was scoped that way.

   These are frequently more reliable than re-deriving intent from code: a spec's `US-xxx`
   states the requirement directly, and an ADR's "Alternatives Considered" is exactly the
   trade-off analysis reference-grade docs need — reading it beats reconstructing it from
   comments or git archaeology. If none of these exist (pre-dates the convention, or the
   project plans elsewhere), skip silently and continue with the reads below.
3. **Read the entry points:** README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md/AGENTS.md; the manifest (package.json / Cargo.toml / pyproject.toml / go.mod); main entry files; configuration and examples.
4. **Read the source for each target entity:** implementation files end-to-end (not just signatures); the tests — they reveal intended behavior, edge cases, and usage patterns; related modules up- and downstream; inline comments, especially `NOTE:`, `DESIGN:`, `WHY:`.
5. **Build a concept map** before writing:

```
Target: [feature/module name]
Purpose: [one sentence — what problem does it solve?]
Key concepts: [the 3-5 concepts a reader must understand]
Public surface: [commands, functions, config options, API endpoints]
Dependencies / Dependents:
Edge cases: [from tests and code]
Design decisions: [non-obvious "why" choices — from spec.md/SDD.md/ADRs when they exist, else inferred from code, comments, and git history]
```

6. Output: "Researched N files (including [spec.md/SDD.md/PLAN.md if read]), identified K public surface items, M concepts, and J design decisions."

## Step 2: Diataxis Partitioning

Decide which quadrants each entity needs. Not every entity needs all four.

| Entity type | Tutorial? | How-to? | Reference? | Explanation? |
|---|---|---|---|---|
| New feature a user interacts with | Yes | Yes | Yes | Maybe |
| CLI command or flag | Maybe | Yes | Yes | No |
| Internal module/architecture | No | No | Yes | Yes |
| Config option | No | Yes | Yes | No |
| Design pattern / philosophy | No | No | No | Yes |
| API endpoint | Maybe | Yes | Yes | No |
| Workflow (multi-step process) | Yes | Yes | No | Maybe |

Output the partition plan as a table (entity × quadrant, marking new/inline/skip). More than 5 documents to create → confirm with the user first; smaller scopes proceed directly.

## Step 3: Write Reference Documentation First

Reference docs are the foundation — factual, complete, derived directly from code. Write them before tutorials or how-tos because they establish the vocabulary.

Template: title + one paragraph (what it is, when you'd use it); **API / Interface** (complete public surface with types, defaults, constraints — pulled from code, not loosely paraphrased); **Options / Configuration** (every option: type, default, effect); **Examples** (2-3 concrete, actually-runnable); **Related** (links to how-tos and explanations).

Rules: accuracy over elegance — every claim traceable to code. "Accepts a string" is insufficient; "Accepts a string (max 256 chars, must match `^[a-z-]+$`)" is reference-grade. Real copy-pasteable examples. Do not explain *why* — that belongs in explanation docs.

## Step 4: Write Explanation Documentation

Explanation docs answer "why does this work this way?" — the design rationale.

Template: opening paragraph (the problem, stated for a smart reader who hasn't seen the code); **The problem** (concrete failure modes without this design, not abstract risks); **The approach** (how the design solves it — include ASCII or Mermaid diagrams for architecture); **Trade-offs** (what was given up — every design trades something; name it); **Alternatives considered** (what else was on the table and why it lost).

Sourcing Trade-offs and Alternatives considered: if `docs/architecture/SDD.md` and its ADRs
cover the decision in question, pull both sections directly from there first — an ADR's
"Consequences"/trade-offs and "Alternatives Considered" fields are already written in exactly
the shape this quadrant wants; quote or closely paraphrase rather than re-deriving from
scratch. Only fall back to grepping comments (`NOTE:`, `DESIGN:`, `WHY:`) or git history when
no SDD.md/ADR exists for that decision.

Rules: lead with the problem, not the solution. ASCII diagrams are grep-able, diff-friendly, render everywhere. "We chose X over Y because Z" is the gold standard. Don't repeat reference material — link to it.

## Step 5: Write How-To Guides

How-tos are task-oriented: the reader knows the basics and wants to accomplish something specific.

Template: `# How to [accomplish specific task]` + one sentence on the end result; **Prerequisites** (specific: versions, tools, config state); **Steps** (numbered, each an action verb + exact command + expected output when non-obvious); **Verification** (how to confirm it worked — a command, URL, or test); **Troubleshooting** (common failure modes and fixes, pulled from tests and error-handling code).

Rules: title starts with "How to" — no exceptions. Every step actionable — no "consider whether...", instead "Run X" or "Add Y to Z". Verification is mandatory; troubleshooting is mandatory if the task can fail.

## Step 6: Write Tutorials

Tutorials are learning-oriented: zero to a working example. The hardest to write well and the most valuable.

Template: title describing what you'll build; opening paragraph ("You'll build a working X that does Y", concrete, not "This tutorial covers X"); **What you'll need**; **Step 1..N** (clean state, every command shown, brief explanation of what just happened at each step); **What you built** (recap, links to reference docs, next steps).

Rules:
- **Time to first result < 3 steps.** If the reader hasn't seen something work by step 3, the tutorial is too slow.
- Every step produces a visible change or output.
- Exact commands the reader will type — no "run the appropriate command" abstractions.
- If a step commonly fails, show the error and fix inline.
- End by connecting the tutorial back to the real use case.

## Step 7: Cross-Document Linking & Discoverability

1. **Cross-link between quadrants:** every reference links to its how-to and vice versa; tutorials link to both.
2. **Update entry points:** README's documentation section/ToC; CLAUDE.md/AGENTS.md project structure if relevant; any docs index or sidebar config.
3. **Verify discoverability:** every new document reachable within 2 clicks from README. Add to the framework's sidebar/nav config if one exists.
4. **Check for broken links:** grep `](` references for targets that don't exist.

## Step 8: Quality Self-Review

Before committing, review each document:

**Accuracy gate:** every code example compiles/runs if copy-pasted; every API description matches the actual signature; every command produces the output described; no stale references to renamed/removed entities.

**Completeness gate:** reference covers 100% of the public surface; how-tos cover the top 3 tasks a user would attempt; tutorials reach a working result in ≤3 steps; explanations name trade-offs, not just choices.

**Voice gate — methodology home: `content-qa`.** That skill owns prose-voice quality: it runs
an AI-pattern audit (hollow intensifiers, hedging stacks, tiered vocabulary, em-dash
frequency) then an editorial pass (passive-voice chains, "There is/are" openers, reading
level), scored by severity (P0-P2) under a "Documentation" content-type profile (clarity over
voice, bullets kept where they aid scanning). Invoke `content-qa` against each generated
document rather than re-checking voice by hand here — this step does not restate a thinner
version of that pass. In one line: docs should read as written for a smart person who hasn't
seen the code, in active voice, without unglossed jargon.

Fix any failures — from the accuracy/completeness gates above and from content-qa's findings — before proceeding.

## Step 9: Commit & Output

1. Stage new doc files by name (never `git add -A` or `git add .`). Before committing, scan the staged docs for live-format credentials — generated docs frequently contain example configs, and a real secret in committed docs is a leak. Obvious placeholders (`AKIAIOSFODNN7EXAMPLE`, `your-key-here`) are fine; anything live-format gets removed first. (Requires wiring for automated scanning: gitleaks or similar.)
2. Commit: `docs: generate [scope] documentation (Diataxis)` with a one-line summary and the quadrants produced.
3. Push to the current branch.
4. **If a PR exists**, add a `## Documentation Generated` section to the PR body — a table of every new file with its quadrant and a one-line description.
5. Output a structured summary: scope, files new/updated, per-quadrant counts, and pass/fail on each quality gate.

## Important Rules

- **Research before writing.** Step 1 is not optional. Insufficient research produces surface-level documentation.
- **Planning artifacts are canonical, not a fallback.** When spec.md, SDD.md/ADRs, or PLAN.md exist, they state intent, requirements, and trade-offs directly — prefer reading them over reconstructing the same information from code, comments, or git history.
- **Accuracy is non-negotiable.** Every example must work; every API description must match the code. Unsure → read the source again, do not guess.
- **Quadrants serve different readers.** Don't mix tutorial content into reference docs or reference content into how-tos.
- **Time to first result in tutorials.** No working result by step 3 → restructure.
- **Cross-link everything.** Isolated docs are undiscoverable docs.
- **Voice: friendly, concrete, user-forward.** Explaining to a smart person who hasn't seen the code — never corporate, never academic.
- **Completeness over minimalism.** Comprehensive documentation is cheap now; write the whole thing.
