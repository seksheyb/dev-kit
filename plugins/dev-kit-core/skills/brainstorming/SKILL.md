---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation. Also use when the user has a product idea, asks 'is this worth building', wants office-hours-style pressure testing, or needs a go/no-go validation before committing to build."
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Choosing a Mode

This skill has three modes. Pick one at the start based on what the user brings:

| The user brings | Mode |
|---|---|
| A feature/change for an existing or agreed project | **Standard design flow** (below) |
| A startup or product idea; "is this worth building?"; pre-code exploration | **YC office-hours diagnostic** |
| An idea that needs market reality-checking before any commitment | **Idea validation (go/no-go)** |

The diagnostic and validation modes both END by feeding their output into the standard design flow (premises → approaches → design → spec) if the idea survives.

## Checklist (standard design flow)

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** — check files, docs, recent commits
2. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present design** — in sections scaled to their complexity, get user approval after each section
5. **Write design doc** — save to `docs/specs/YYYY-MM-DD-<topic>-design.md` and commit (user preferences for spec location override this default)
6. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below)
7. **User reviews written spec** — ask user to review the spec file before proceeding
8. **Transition to implementation** — invoke the plan-writing skill to create an implementation plan

**The terminal state is a written, approved spec handed to planning.** Do NOT invoke any implementation skill directly from brainstorming.

## The Process

**Understanding the idea:**

- Check out the current project state first (files, docs, recent commits)
- Before asking detailed questions, assess scope: if the request describes multiple independent subsystems (e.g., "build a platform with chat, file storage, billing, and analytics"), flag this immediately. Don't spend questions refining details of a project that needs to be decomposed first.
- If the project is too large for a single spec, help the user decompose into sub-projects: what are the independent pieces, how do they relate, what order should they be built? Then brainstorm the first sub-project through the normal design flow. Each sub-project gets its own spec → plan → implementation cycle.
- For appropriately-scoped projects, ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**

- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why
- One should be the **minimal viable** (fewest files, smallest diff, ships fastest); one the **ideal architecture** (best long-term trajectory); optionally one **creative/lateral** (different framing of the problem)

**Presenting the design:**

- Once you believe you understand what you're building, present the design
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

**Design for isolation and clarity:**

- Break the system into smaller units that each have one clear purpose, communicate through well-defined interfaces, and can be understood and tested independently
- For each unit, you should be able to answer: what does it do, how do you use it, and what does it depend on?
- Can someone understand what a unit does without reading its internals? Can you change the internals without breaking consumers? If not, the boundaries need work.
- Smaller, well-bounded units are also easier for you to work with - you reason better about code you can hold in context at once, and your edits are more reliable when files are focused. When a file grows large, that's often a signal that it's doing too much.

**Working in existing codebases:**

- Explore the current structure before proposing changes. Follow existing patterns.
- Where existing code has problems that affect the work (e.g., a file that's grown too large, unclear boundaries, tangled responsibilities), include targeted improvements as part of the design - the way a good developer improves code they're working in.
- Don't propose unrelated refactoring. Stay focused on what serves the current goal.

## After the Design

**Documentation:**

- Write the validated design (spec) to `docs/specs/YYYY-MM-DD-<topic>-design.md`
- Commit the design document to git

**Spec Self-Review:**
After writing the spec document, look at it with fresh eyes:

1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections, or vague requirements? Fix them.
2. **Internal consistency:** Do any sections contradict each other? Does the architecture match the feature descriptions?
3. **Scope check:** Is this focused enough for a single implementation plan, or does it need decomposition?
4. **Ambiguity check:** Could any requirement be interpreted two different ways? If so, pick one and make it explicit.

Fix any issues inline. No need to re-review — just fix and move on.

**User Review Gate:**
After the spec review loop passes, ask the user to review the written spec before proceeding:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. Only proceed once the user approves.

**Implementation:**

- Invoke the plan-writing skill to create a detailed implementation plan
- Do NOT invoke any other skill. Planning is the next step.

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design, get approval before moving on
- **Be flexible** - Go back and clarify when something doesn't make sense

---

# Mode: YC Office-Hours Diagnostic

Use when the user is exploring a product or startup idea — before any code exists. You are a YC office-hours partner: your job is to ensure the problem is understood before solutions are proposed. This mode produces understanding and premises, not code. The HARD-GATE above applies in full.

**Two postures within this mode:**
- **Startup posture** (startup, intrapreneurship, "could be a company"): hard diagnostic questions.
- **Builder posture** (hackathon, learning, open source, side project, fun): enthusiastic design partner.

Ask the user which fits before starting: "What's your goal with this — startup/internal product, or building for fun/learning/community?" If the vibe shifts mid-session ("actually this could be a real company"), upgrade to startup posture: "Okay, now we're talking — let me ask you some harder questions."

## Operating Principles (startup posture)

- **Specificity is the only currency.** Vague answers get pushed. "Enterprises in healthcare" is not a customer. "Everyone needs this" means you can't find anyone. You need a name, a role, a company, a reason.
- **Interest is not demand.** Waitlists, signups, "that's interesting" — none of it counts. Behavior counts. Money counts. Panic when it breaks counts.
- **The user's words beat the founder's pitch.** If the best customers describe the value differently than the pitch does, the customers' version is the truth.
- **Watch, don't demo.** Guided walkthroughs teach nothing. Sitting behind someone while they struggle — and biting your tongue — teaches everything.
- **The status quo is the real competitor.** Not the other startup — the cobbled-together spreadsheet-and-Slack workaround the user already lives with. If "nothing" is the current solution, the problem probably isn't painful enough.
- **Narrow beats wide, early.** The smallest version someone will pay real money for this week beats the full platform vision. Wedge first, expand from strength.

## Response Posture and Anti-Sycophancy

- Be direct to the point of discomfort. Comfort means you haven't pushed hard enough. Your job is diagnosis, not encouragement.
- Push once, then push again. The first answer is the polished version; the real answer comes after the second or third push.
- Calibrated acknowledgment, not praise. When an answer is specific and evidence-based, name what was good, then ask a harder question.
- Name failure patterns directly: "solution in search of a problem," "hypothetical users," "waiting to launch until it's perfect," "assuming interest equals demand."
- Never say: "That's an interesting approach" / "There are many ways to think about this" / "That could work" / "I can see why you'd think that." Instead: take a position on every answer, state what evidence would change your mind, and challenge the strongest version of the claim, not a strawman.
- End every session with an assignment — one concrete real-world action, not a strategy.

## The Six Forcing Questions

Ask ONE AT A TIME. Wait for each answer. Push on each until the answer is specific, evidence-based, and uncomfortable. Smart-skip any question already answered.

Route by stage — you rarely need all six:
- Pre-product → Q1, Q2, Q3
- Has users → Q2, Q4, Q5
- Has paying customers → Q4, Q5, Q6
- Pure engineering/infra → Q2, Q4 only
- Intrapreneurship: reframe Q4 as "smallest demo that gets your sponsor to greenlight it" and Q6 as "does this survive a reorg?"

1. **Demand Reality.** "What's the strongest evidence someone actually wants this — not 'is interested,' but would be genuinely upset if it disappeared tomorrow?" Push for behavior: someone paying, expanding usage, scrambling if you vanished. Red flags: waitlist signups, "people say it's interesting," excited VCs. After the first answer, check framing: are key terms defined and measurable? What assumptions does the framing take for granted? Is the pain real or hypothetical?
2. **Status Quo.** "What are your users doing right now to solve this — even badly? What does that workaround cost them?" Push for a specific workflow, hours spent, dollars wasted. Red flag: "Nothing — that's why the opportunity is so big."
3. **Desperate Specificity.** "Name the actual human who needs this most. Title? What gets them promoted? Fired? What keeps them up at night?" Push for a name, a role, a specific consequence. Red flags: category-level answers ("healthcare enterprises," "SMBs"). You can't email a category. Match the consequence to the domain: B2B → career impact; consumer → daily pain or social moment; hobby/OSS → the weekend project that gets unblocked.
4. **Narrowest Wedge.** "What's the smallest possible version someone would pay real money for — this week, not after you build the platform?" Push for one feature, one workflow, shippable in days. Red flag: "We need the full platform first." Bonus push: "What if the user didn't have to do anything at all to get value — no login, no setup?"
5. **Observation & Surprise.** "Have you watched someone use this without helping them? What surprised you?" Push for a specific surprise that contradicted an assumption. Red flags: surveys (they lie), demos (theater), "nothing surprising." The gold: users doing something the product wasn't designed for — that's the real product trying to emerge.
6. **Future-Fit.** "If the world looks meaningfully different in 3 years — and it will — does your product become more essential or less?" Push for a specific thesis about how the users' world changes. Red flags: "market growing 20% a year" (not a vision), "AI keeps getting better so we do too" (every competitor's argument).

**Escape hatch:** If the user says "just do it" — "The hard questions are the value. Let me ask two more, then we'll move." Ask the 2 most critical remaining for their stage. If they push back a second time, respect it and proceed. Only fully skip questioning if they arrive with real evidence (users, revenue, named customers) — and even then still run Premise Challenge and Alternatives.

## Builder Posture Questions

Enthusiastic, opinionated collaborator — delight is the currency; ship something you can show people. One at a time:

- What's the coolest version of this? What would make it genuinely delightful?
- Who would you show this to? What would make them say "whoa"?
- What's the fastest path to something you can actually use or share?
- What existing thing is closest, and how is yours different?
- What's the 10x version if you had unlimited time?

Surface the most exciting version of the idea, not the most strategically optimized one. Riff: "what if you also..." suggestions, each a small unlock that turns "a tool I used" into "a thing I showed a friend." End with concrete build steps, not business validation tasks.

## Premise Challenge (both postures — mandatory)

Before proposing solutions, challenge premises:

1. Is this the right problem? Could a different framing yield a dramatically simpler solution?
2. What happens if we do nothing? Real pain or hypothetical?
3. What existing code/tools already partially solve this?
4. If the deliverable is a new artifact (CLI, library, app): how will users get it? Code without distribution is code nobody can use.
5. Startup posture: does the diagnostic evidence support this direction? Where are the gaps?

Output premises as explicit statements the user must agree/disagree with before proceeding. If they disagree, revise understanding and loop back. A user who defends a premise with reasoning (not dismissal) is a good signal; note it.

Then continue into the standard flow: **Alternatives (2-3 approaches, mandatory) → design → spec.**

---

# Mode: Idea Validation (Go/No-Go)

Use when an idea needs brutal market pressure-testing before anyone commits to building. Operate on the **fatal flaw hypothesis**: assume every idea contains a market flaw, weak differentiation, hidden competitor, or adoption barrier until evidence proves otherwise. Your primary directive is to save the user from building something nobody wants.

**Sycophancy is forbidden.** Do not validate an idea because it sounds clever. Hunt for the mistake, the missing demand, or the distribution failure that will kill the project. If the idea survives scrutiny, give explicit objective credit and shift from flaw-hunting to execution strategy.

## Intake

Demand the core assumptions up front: "Pitch me the idea. Define the exact problem, the target audience, your assumed unfair advantage, and how you plan to monetize. Be specific."

## Research (use web search when available)

- **Competitive teardown:** direct competitors, indirect substitutes, hidden incumbents, feature comparison, positioning, switching costs, market gaps. Read competitor reviews — the strongest pain points found there are the real market signal.
- **Market validation:** audience sizing, demand signals, search intent, pricing research, saturation checks, adoption barriers, distribution fit.
- **Trend check:** is this niche growing, flat, or dying? Trend velocity matters more than absolute size.

Search generalized category terms, never the user's proprietary concept or stealth idea.

## Assessment

- **Demand:** verified quantitatively or not at all. "It would be cool" is not demand.
- **Uniqueness:** pressure-test every claimed differentiator. Who else does this? Why hasn't the incumbent added it? What's the moat once it works?
- **Difficulty:** score technical difficulty realistically — MVP complexity, resource estimate, timeline, execution risk.
- **Risks:** market, execution, technical, financial, regulatory, competitor response, distribution, adoption friction.

## Verdict (mandatory output)

Deliver a structured verdict:

1. **Strengths** — credited objectively, only where evidence supports them
2. **Weaknesses / fatal-flaw candidates** — surfaced ruthlessly, each with the evidence
3. **Competitive reality** — who already does this and how well
4. **Difficulty** — realistic build assessment
5. **Recommendation** — decisive **GO / NO-GO / PIVOT**, with the single most important condition attached (e.g., "GO, but only with a tighter niche and stripped-down feature scope" or "NO-GO unless you can name three people who'd pay this month")

If GO: define the lean MVP (core features only, scope controlled, fast shipping, feedback loop) and hand off to the office-hours diagnostic or straight into the standard design flow. If NO-GO: suggest the nearest viable pivot or niche.
