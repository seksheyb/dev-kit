/**
 * routing-engine — the shared, side-effect-free core of dev-kit's model router.
 *
 * WHY THIS EXISTS
 * ---------------
 * `complexity-score.mjs` scores *plan tracks* parsed out of a markdown table. That was the only
 * consumer when it was written, so its scoring machinery — the signal scales, the glob matcher, the
 * bucketing, the bands, the floors — lives inside a CLI that also does file I/O, markdown parsing and
 * `process.exit`. Nothing else can call it.
 *
 * The router needs the *same* arithmetic for a different input shape: a descriptor handed over by an
 * orchestrator that is about to dispatch a subagent, where there is no plan file, no table, and
 * sometimes no file list at all. Re-deriving that arithmetic in a second place is exactly the
 * producer/scorer desynchronisation that complexity-score.mjs exists to prevent, one level up.
 *
 * So this module is the extraction: pure functions, no I/O, no `process.exit`, throws `Error` on
 * invalid input. `model-route.mjs` wraps it in a CLI. A follow-up refactor moves
 * `complexity-score.mjs` onto it as well, at which point the copies below become the only copies.
 * Until that lands, the machinery here is a DELIBERATE DUPLICATE of complexity-score.mjs and must
 * stay semantically identical to it — change one, change both.
 *
 * WHAT IT ADDS OVER THE SCORER
 * ----------------------------
 * 1. A descriptor input (agent/profile/surface/signals/context) with documented degradation rules
 *    for non-coding work, where "files" is not a meaningful breadth or sensitivity source.
 * 2. Per-agent pins (`config.agents`): a model pin short-circuits the capability axis; an effort
 *    floor raises the computed effort.
 * 3. Expressibility resolution: the *decision* (model + effort) is separate from how the effort can
 *    actually be TRANSMITTED at the dispatch surface. The Agent tool has no effort parameter at all;
 *    a given model may not accept every effort level. `effortParam` is what the caller may pass as a
 *    real parameter, and `null` means "this effort has to travel as prompt text instead". Effort is
 *    never lowered to fit a model — that would let a transport limitation quietly change a routing
 *    decision, which is the failure this whole axis-independence design exists to avoid.
 */

// ---------------------------------------------------------------------------
// Signal scales. Order is the score: index 0 is the floor.
// Mirrors references/complexity-signals.md — and complexity-score.mjs — exactly.
// ---------------------------------------------------------------------------
export const SCALES = {
  novelty:   ['none', 'low', 'high'],
  logic:     ['low', 'medium', 'high'],
  ambiguity: ['low', 'medium', 'high'],
  // `tests` is scored as RESIDUAL RISK, so the scale is not the doc's declaration order:
  // `existing` (already covered) is the safest, `none` (no test surface touched at all) the riskiest.
  tests:     { existing: 0, new: 1, none: 2 },
};

/**
 * `verifiability` is the non-coding profiles' name for the SAME risk slot as `tests`: how much of
 * the output will actually be checked. It is deliberately NOT in SCALES — SCALES is the scorer's
 * vocabulary and must stay byte-identical to it, and a config floor naming `tests` should not
 * silently start matching a research descriptor's `verifiability` value.
 */
export const VERIFIABILITY = { checked: 0, skim: 1, unverified: 2 };

export const PROFILES = ['coding', 'research', 'review', 'writing', 'ops'];
export const SURFACES = ['agent', 'workflow'];
export const INEXPRESSIBLE_MODES = ['prompt-text', 'bump-model'];

// ---------------------------------------------------------------------------
// Tiny glob matcher — `**` crosses separators, `*` does not. Case-insensitive.
// ---------------------------------------------------------------------------
export function globToRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}

/** One file against a glob list. */
export const matchAny = (file, globs) => globs.some((g) => globToRe(g).test(file));

/** Any file in a list against a glob list; tolerates a missing/undefined glob list. */
export const matchAnyFile = (files, globs) => Array.isArray(globs) && files.some((f) => matchAny(f, globs));

/** `bucket(n, t0, t1, t2)` -> 0..3. n<=t0 is the floor; above t2 is the ceiling. */
export const bucket = (n, t0, t1, t2) => (n <= t0 ? 0 : n <= t1 ? 1 : n <= t2 ? 2 : 3);

/** Band lookup; out-of-range scores clamp to the top band rather than returning undefined. */
export const bandFor = (score, bands, key) =>
  (bands.find((b) => score >= b.min && score <= b.max) ?? bands[bands.length - 1])[key];

/** Position in an ordered tier list. -1 for anything not in it (e.g. "inherit" among models). */
export const rank = (v, order) => order.indexOf(v);

export const scaleValues = (sig) => (Array.isArray(SCALES[sig]) ? SCALES[sig] : Object.keys(SCALES[sig]));

export const scaleScore = (sig, val) => {
  const s = SCALES[sig];
  if (!s) return null;
  const v = String(val).trim().toLowerCase();
  if (Array.isArray(s)) { const i = s.indexOf(v); return i < 0 ? null : i; }
  return v in s ? s[v] : null;
};

// ---------------------------------------------------------------------------
// Config validation
// ---------------------------------------------------------------------------
/**
 * Validates a routing config as loudly as complexity-score.mjs validates its own, plus the router's
 * new keys. Throws `Error` (the CLI turns that into exit 2) — a silently-wrong config produces
 * silently-wrong routing, which is worse than no router at all, because the caller gets a confident
 * decision derived from nonsense.
 *
 * Returns the same object with `_models` / `_efforts` attached, in the tier order the bands declare.
 */
export function validateConfig(cfg) {
  const bad = (m) => { throw new Error(`config: ${m}`); };

  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) bad('config must be a JSON object');

  const models = Array.isArray(cfg.modelBands) ? cfg.modelBands.map((b) => b?.model) : [];
  const efforts = Array.isArray(cfg.effortBands) ? cfg.effortBands.map((b) => b?.effort) : [];
  if (!models.length) bad('modelBands is empty or missing');
  if (!efforts.length) bad('effortBands is empty or missing');
  if (models.some((m) => typeof m !== 'string' || !m)) bad('every modelBands entry needs a "model" name');
  if (efforts.some((e) => typeof e !== 'string' || !e)) bad('every effortBands entry needs an "effort" name');

  for (const f of cfg.capabilityFloors ?? []) {
    if (!models.includes(f.model)) bad(`capabilityFloors names model "${f.model}", absent from modelBands`);
    if (!SCALES[f.signal]) bad(`capabilityFloors names unknown signal "${f.signal}"`);
    if (!scaleValues(f.signal).includes(f.atLeast)) bad(`capabilityFloors "${f.signal}" atLeast "${f.atLeast}" is not a value of that scale`);
  }
  for (const f of cfg.effortFloors ?? []) {
    if (!efforts.includes(f.effort)) bad(`effortFloors names effort "${f.effort}", absent from effortBands`);
    if (!SCALES[f.signal]) bad(`effortFloors names unknown signal "${f.signal}"`);
    if (!scaleValues(f.signal).includes(f.atLeast)) bad(`effortFloors "${f.signal}" atLeast "${f.atLeast}" is not a value of that scale`);
  }
  if (cfg.criticalEffortFloor && !efforts.includes(cfg.criticalEffortFloor))
    bad(`criticalEffortFloor "${cfg.criticalEffortFloor}" is absent from effortBands`);
  if (!Number.isInteger(cfg.haikuFileBumpThreshold) || cfg.haikuFileBumpThreshold < 1)
    bad('haikuFileBumpThreshold must be a positive integer');

  // --- router-only keys -----------------------------------------------------
  const eps = cfg.effortParamSupport;
  if (!eps || typeof eps !== 'object' || Array.isArray(eps))
    bad('effortParamSupport is missing or not an object (model name -> array of effort levels it accepts as a parameter)');
  for (const [m, list] of Object.entries(eps)) {
    if (!models.includes(m)) bad(`effortParamSupport names model "${m}", absent from modelBands`);
    if (!Array.isArray(list)) bad(`effortParamSupport["${m}"] must be an array of effort names (use [] for "expresses none")`);
    for (const e of list) {
      if (!efforts.includes(e)) bad(`effortParamSupport["${m}"] lists effort "${e}", absent from effortBands`);
    }
  }
  for (const m of models) {
    if (!Array.isArray(eps[m])) bad(`effortParamSupport has no entry for model "${m}" — every model in modelBands needs one (use [] for "expresses none")`);
  }

  if (!INEXPRESSIBLE_MODES.includes(cfg.onInexpressibleEffort))
    bad(`onInexpressibleEffort must be one of ${INEXPRESSIBLE_MODES.join('|')}, got ${JSON.stringify(cfg.onInexpressibleEffort ?? null)}`);

  // `agents` is optional here on purpose: this validator ships before the block that populates it.
  if (cfg.agents !== undefined) {
    if (!cfg.agents || typeof cfg.agents !== 'object' || Array.isArray(cfg.agents))
      bad('agents must be an object keyed by agent name');
    for (const [name, entry] of Object.entries(cfg.agents)) {
      if (name.startsWith('_')) continue;                        // note/comment keys
      if (!entry || typeof entry !== 'object' || Array.isArray(entry))
        bad(`agents["${name}"] must be an object with an optional "model" and/or "effortFloor"`);
      if (entry.model !== undefined && entry.model !== 'inherit' && !models.includes(entry.model))
        bad(`agents["${name}"].model "${entry.model}" is neither a modelBands model nor "inherit"`);
      if (entry.effortFloor !== undefined && !efforts.includes(entry.effortFloor))
        bad(`agents["${name}"].effortFloor "${entry.effortFloor}" is absent from effortBands`);
    }
  }

  cfg._models = models;
  cfg._efforts = efforts;
  return cfg;
}

// ---------------------------------------------------------------------------
// Descriptor scoring
// ---------------------------------------------------------------------------
/**
 * score(descriptor, config) -> decision
 *
 * Deterministic: same descriptor + same config => same decision, every time, no clock, no randomness,
 * no filesystem. Throws `Error` on any invalid or missing REQUIRED field — never a silent default,
 * because a defaulted required field is how an under-declared descriptor buys a cheaper model.
 *
 * Pipeline
 *   1. pin lookup           config.agents[descriptor.agent]
 *   2. signal scoring       capability / risk, both 0-12
 *   3. bands -> floors -> critical-path floor -> haiku context guard   (order matters; it mirrors
 *                           complexity-score.mjs exactly)
 *   4. expressibility       how, and whether, the effort can be passed as a real parameter
 *
 * Returns { model, effort, effortParam, capability, risk, reasons }.
 */
export function score(descriptor, config) {
  const bad = (m) => { throw new Error(`descriptor: ${m}`); };
  const cfg = config;
  if (!cfg || typeof cfg !== 'object') throw new Error('config: missing — call validateConfig first');

  const models = cfg._models ?? (cfg.modelBands ?? []).map((b) => b.model);
  const efforts = cfg._efforts ?? (cfg.effortBands ?? []).map((b) => b.effort);
  if (!models.length || !efforts.length) throw new Error('config: modelBands/effortBands missing — call validateConfig first');

  // --- 0. descriptor shape --------------------------------------------------
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) bad('must be a JSON object');
  if (typeof descriptor.agent !== 'string' || !descriptor.agent.trim())
    bad('"agent" is required and must be a non-empty role name');
  if (!PROFILES.includes(descriptor.profile))
    bad(`"profile" is required and must be one of ${PROFILES.join('|')} (got ${JSON.stringify(descriptor.profile ?? null)})`);
  if (!SURFACES.includes(descriptor.surface))
    bad(`"surface" is required and must be one of ${SURFACES.join('|')} (got ${JSON.stringify(descriptor.surface ?? null)})`);

  const s = descriptor.signals;
  if (!s || typeof s !== 'object' || Array.isArray(s)) bad('"signals" is required and must be an object');

  const raw = {};
  for (const sig of ['novelty', 'logic', 'ambiguity']) {
    const v = scaleScore(sig, s[sig] ?? '');
    if (v === null) bad(`signals.${sig} is required and must be one of ${scaleValues(sig).join('|')} (got ${JSON.stringify(s[sig] ?? null)})`);
    raw[sig] = v;
  }

  // `tests` (coding) and `verifiability` (everything else) are the same risk slot, 0/1/2.
  const hasTests = s.tests !== undefined && s.tests !== null;
  const hasVerifiability = s.verifiability !== undefined && s.verifiability !== null;
  if (hasTests && hasVerifiability) bad('exactly one of signals.tests or signals.verifiability is required — both were given');
  if (!hasTests && !hasVerifiability) bad('exactly one of signals.tests or signals.verifiability is required — neither was given');
  let residual;
  if (hasTests) {
    residual = scaleScore('tests', s.tests);
    if (residual === null) bad(`signals.tests must be one of ${scaleValues('tests').join('|')} (got ${JSON.stringify(s.tests)})`);
  } else {
    const v = String(s.verifiability).trim().toLowerCase();
    if (!(v in VERIFIABILITY)) bad(`signals.verifiability must be one of ${Object.keys(VERIFIABILITY).join('|')} (got ${JSON.stringify(s.verifiability)})`);
    residual = VERIFIABILITY[v];
  }

  let files = null;
  if (s.files !== undefined && s.files !== null) {
    if (!Array.isArray(s.files) || s.files.some((f) => typeof f !== 'string'))
      bad('signals.files must be an array of path strings');
    files = s.files.map((f) => f.trim()).filter(Boolean);
  }
  const hasFiles = files !== null && files.length > 0;

  if (s.unitCount !== undefined && s.unitCount !== null && (!Number.isInteger(s.unitCount) || s.unitCount < 1))
    bad('signals.unitCount must be a positive integer');

  const ctx = descriptor.context ?? {};
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) bad('"context" must be an object when present');
  if (ctx.gateFeeding !== undefined && typeof ctx.gateFeeding !== 'boolean')
    bad('context.gateFeeding must be a boolean');
  for (const k of ['dependsOn', 'dependents']) {
    if (ctx[k] !== undefined && (!Number.isInteger(ctx[k]) || ctx[k] < 0))
      bad(`context.${k} must be a non-negative integer`);
  }

  // --- 1. pin lookup --------------------------------------------------------
  const pin = (cfg.agents && Object.prototype.hasOwnProperty.call(cfg.agents, descriptor.agent))
    ? cfg.agents[descriptor.agent]
    : null;
  const pinnedModel = pin && pin.model !== undefined ? pin.model : null;

  // --- 2. signal scoring ----------------------------------------------------
  // Degradation: with no file list there is no glob surface, so breadth comes from unitCount,
  // sensitivity from the caller's explicit gateFeeding flag, and reversibility is simply unknowable
  // (0). With a file list, globs decide — and gateFeeding can still raise sensitivity, it just
  // cannot lower what the globs found.
  const sp = cfg.sensitivePaths ?? {};
  const rv = cfg.reversibility ?? {};
  const globSensitivity = hasFiles
    ? (matchAnyFile(files, sp.critical) ? 3 : matchAnyFile(files, sp.sensitive) ? 2 : matchAnyFile(files, sp.adjacent) ? 1 : 0)
    : 0;
  const sensitivity = Math.max(globSensitivity, ctx.gateFeeding ? 3 : 0);
  const reversibility = hasFiles
    ? (matchAnyFile(files, rv.destructive) ? 2 : matchAnyFile(files, rv.schema) ? 1 : 0)
    : 0;
  const breadth = bucket(hasFiles ? files.length : (s.unitCount ?? 1), 1, 3, 6);
  const fanout = bucket(ctx.dependsOn ?? 0, 0, 2, 4);
  const blast = bucket(ctx.dependents ?? 0, 0, 2, 4);

  const capability = raw.novelty + raw.logic + raw.ambiguity + breadth + fanout;
  const risk = sensitivity + blast + reversibility + residual + raw.ambiguity;

  const reasons = [];

  // --- 3. bands, floors, guards --------------------------------------------
  let model = bandFor(capability, cfg.modelBands, 'model');
  let effort = bandFor(risk, cfg.effortBands, 'effort');

  if (pinnedModel !== null) {
    // A pin is an operator decision about WHO runs, not about how hard the work is. It short-circuits
    // the capability axis outright — the floors and the context guard below exist to correct a band,
    // and there is no band left to correct. capability is still computed and reported so the pin can
    // be audited against what the signals actually said.
    model = pinnedModel;
    reasons.push(`pin: agents.${descriptor.agent}.model = ${pinnedModel} (short-circuits the capability axis; capability ${capability} not consulted for the model)`);
  } else {
    // capability floors — RAW declared enums only, exactly as the scorer does it.
    for (const f of cfg.capabilityFloors ?? []) {
      const declared = scaleScore(f.signal, s[f.signal] ?? '');
      const threshold = scaleScore(f.signal, f.atLeast);
      if (declared !== null && declared >= threshold && rank(f.model, models) > rank(model, models)) {
        model = f.model;
        reasons.push(`capability floor: ${f.signal} >= ${f.atLeast} forces ${f.model}`);
      }
    }
  }

  // effort floors — also raw enums, same reasoning as the capability floors. Note that a floor on
  // `tests` does not fire for a descriptor that declared `verifiability` instead: the two share a
  // score slot, not a vocabulary, and matching "unverified" against the tests scale would be a guess.
  for (const f of cfg.effortFloors ?? []) {
    const declared = scaleScore(f.signal, s[f.signal] ?? '');
    const threshold = scaleScore(f.signal, f.atLeast);
    if (declared !== null && declared >= threshold && rank(f.effort, efforts) > rank(effort, efforts)) {
      effort = f.effort;
      reasons.push(`effort floor: ${f.signal} >= ${f.atLeast} forces ${f.effort}`);
    }
  }

  // critical-path effort floor
  if (cfg.criticalEffortFloor && sensitivity === 3 && rank(cfg.criticalEffortFloor, efforts) > rank(effort, efforts)) {
    effort = cfg.criticalEffortFloor;
    reasons.push(`critical-path floor: touches a critical path, forces ${cfg.criticalEffortFloor} effort`);
  }

  // per-agent effort floor — raises only, never lowers.
  if (pin && pin.effortFloor !== undefined && rank(pin.effortFloor, efforts) > rank(effort, efforts)) {
    reasons.push(`pin: agents.${descriptor.agent}.effortFloor = ${pin.effortFloor} raises effort from ${effort}`);
    effort = pin.effortFloor;
  }

  // haiku context guard. Skipped under a model pin for the same reason the capability floors are.
  if (pinnedModel === null && model === models[0] && hasFiles && files.length > cfg.haikuFileBumpThreshold) {
    model = models[1] ?? model;
    reasons.push(`context guard: ${files.length} files exceeds ${cfg.haikuFileBumpThreshold}, bumps to ${model}`);
  }

  // --- 4. expressibility ----------------------------------------------------
  const resolved = resolveExpressibility(descriptor.surface, model, effort, cfg, models, reasons);

  return {
    model: resolved.model,
    effort,
    effortParam: resolved.effortParam,
    capability,
    risk,
    reasons,
  };
}

/**
 * Decides whether the chosen effort can be handed over as a real parameter at the chosen dispatch
 * surface, and what to do when it cannot. Effort itself is NEVER lowered here: a transport gap is a
 * transport problem, and silently downgrading effort to fit it would make the routing decision a
 * function of the plumbing.
 *
 * The "agent" surface is hardcoded rather than config-driven because it is a property of the Agent
 * tool's own signature — there is no effort parameter to pass, for any model. That is not a project
 * tunable, so it does not belong in a project config file.
 */
function resolveExpressibility(surface, model, effort, cfg, models, reasons) {
  if (surface === 'agent') {
    reasons.push(`expressibility: surface "agent" has no effort parameter for any model — effort "${effort}" travels as prompt text`);
    return { model, effortParam: null };
  }

  // "inherit" means the orchestrator's own model runs the work. Workflow's effort opt is applied at
  // dispatch without naming a model, so it is expressible regardless of which model is inherited.
  if (model === 'inherit') {
    reasons.push(`expressibility: model "inherit" — effort "${effort}" passes through as the Workflow effort opt (model-agnostic at dispatch)`);
    return { model, effortParam: effort };
  }

  const supports = (m) => (cfg.effortParamSupport?.[m] ?? []).includes(effort);
  if (supports(model)) return { model, effortParam: effort };

  if (cfg.onInexpressibleEffort === 'bump-model') {
    // Cheapest model that can express it, in modelBands order — but never cheaper than the one the
    // capability axis already chose. "Bump" is an upgrade; falling back to a weaker model to gain a
    // parameter would trade the decision for the plumbing, which is precisely what this must not do.
    const from = Math.max(rank(model, models), 0);
    for (let i = from; i < models.length; i++) {
      if (models[i] !== model && supports(models[i])) {
        reasons.push(`expressibility: model "${model}" cannot express effort "${effort}" — bump-model raises it to "${models[i]}" (effort is never lowered to fit a model)`);
        return { model: models[i], effortParam: effort };
      }
    }
    reasons.push(`expressibility: model "${model}" cannot express effort "${effort}" — bump-model hit ceiling, fell through to prompt-text`);
    return { model, effortParam: null };
  }

  reasons.push(`expressibility: model "${model}" cannot express effort "${effort}" as a parameter — travels as prompt text`);
  return { model, effortParam: null };
}
