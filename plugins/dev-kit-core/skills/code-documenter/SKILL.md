---
name: code-documenter
description: Use when adding docstrings to functions or classes, creating or validating API documentation, building a documentation site, or writing tutorials, getting-started guides, and user guides. Covers Google/NumPy/Sphinx docstrings, JSDoc/TSDoc, OpenAPI/Swagger and AsyncAPI specs, and doc-portal setup (Docusaurus, MkDocs, VitePress, Redoc, Swagger UI).
license: MIT
metadata:
  version: "1.1.0"
  domain: quality
  triggers: documentation, docstrings, OpenAPI, Swagger, JSDoc, comments, API docs, tutorials, user guides, doc site
  role: specialist
  scope: implementation
  output-format: code
  related-skills: spec-miner, fullstack-guardian
---

# Code Documenter

Documentation specialist for inline documentation, API specs, documentation sites, and developer guides.

## When to Use This Skill

Applies to any task involving code documentation, API specs, or developer-facing guides. See the reference table below for specific sub-topics.

## Core Workflow

1. **Discover** - Resolve docstring format and exclusions from the project itself, per
   "Resolving Docstring Format" below. No human turn is required: the resolution order is
   deterministic, so this step behaves identically whether a human is present or the skill is
   dispatched unattended as a pipeline/sprint-execution/bugfix-wave step.
2. **Detect** - Identify language and framework
3. **Analyze** - Find undocumented code
4. **Document** - Apply consistent format
5. **Validate** - Test all code examples compile/run:
   - Python: `python -m doctest file.py` for doctest blocks; `pytest --doctest-modules` for module-wide checks
   - TypeScript/JavaScript: `tsc --noEmit` to confirm typed examples compile
   - OpenAPI: validate spec with `npx @redocly/cli lint openapi.yaml`
   - If validation fails: fix examples and re-validate before proceeding to the Report step
6. **Report** - Generate coverage summary

### Resolving Docstring Format

Resolve the format from the project, in this order. Stop at the first tier that yields a
signal. Never ask a human, and never pick a format out of thin air — every run, interactive or
unattended, resolves the same way.

**Tier 1 — Project constitution.** Load `docs/global/project/constitution.md` by default (see
the `constitution` skill). Look first for the named `### Documentation Standard` slot that the
constitution template defines — that heading is the machine-readable home for this, wherever in
the file it sits. If that heading is absent, fall back to prose-matching a documentation or
docstring standard anywhere in the file (commonly under an "Additional Constraints" or
"Development Workflow" section). Either way, a standard found here **governs**, and the
remaining tiers are not consulted. The constitution is non-negotiable where it speaks.

Treat the constitution as silent, and fall through to Tier 2, when: the file is absent, it is
an unfilled template, the `### Documentation Standard` slot is present but still holds its
unreplaced `[DOCUMENTATION_STANDARD]` token, or it says nothing about documentation style. A
missing or unfilled constitution is **not fatal** — this mirrors how `analyze`, `converge`, and
`specify` handle the same file.

**Tier 2 — Existing codebase convention.** If Tier 1 is silent, match what the project already
does:
1. Check for explicit style configuration first — `numpydoc`/`sphinx` settings in `setup.cfg`,
   `pyproject.toml`, or `docs/conf.py`; `.jsdoc.json`; `typedoc.json`. An explicit config beats
   sampling.
2. Otherwise sample up to 20 already-documented functions/classes/modules across the target
   language's source tree. Prefer real source files over vendored, generated, or test-fixture
   code, and spread the sample across directories rather than reading one file repeatedly.
3. Classify each sampled docstring by its style markers: `Args:`/`Returns:`/`Raises:` → Google;
   `Parameters\n----------` → NumPy; `:param:`/`:returns:` → Sphinx; `@param`/`@returns` in a
   `/** */` block → JSDoc; TSDoc-specific tags (`@remarks`, `@defaultValue`, etc.) in `.ts`/
   `.tsx` → TSDoc.
4. Use whichever style holds a clear majority of the sample.
5. **Tie** (no majority, or two styles equally represented): fall through to Tier 3 rather than
   picking arbitrarily.

**Tier 3 — Language-conventional default.** Only when neither of the above yields a signal:
Google style for Python, JSDoc for JavaScript/TypeScript.

**Record the outcome.** Report the resolved format, which tier resolved it, and — when Tier 2
sampled — the sample size, in the coverage report (the Report step). This is what makes an
unattended run auditable after the fact.

**Exclusions** resolve the same way, and likewise require no human turn: honour any exclusion
globs the constitution states; otherwise skip vendored, generated, build-output, and
test-fixture paths (`node_modules/`, `vendor/`, `dist/`, `build/`, `__pycache__/`, migrations,
and anything the repo's ignore files already exclude).

## Quick-Reference Examples

### Google-style Docstring (Python)
```python
def fetch_user(user_id: int, active_only: bool = True) -> dict:
    """Fetch a single user record by ID.

    Args:
        user_id: Unique identifier for the user.
        active_only: When True, raise an error for inactive users.

    Returns:
        A dict containing user fields (id, name, email, created_at).

    Raises:
        ValueError: If user_id is not a positive integer.
        UserNotFoundError: If no matching user exists.
    """
```

### NumPy-style Docstring (Python)
```python
def compute_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors.

    Parameters
    ----------
    vec_a : np.ndarray
        First input vector, shape (n,).
    vec_b : np.ndarray
        Second input vector, shape (n,).

    Returns
    -------
    float
        Cosine similarity in the range [-1, 1].

    Raises
    ------
    ValueError
        If vectors have different lengths.
    """
```

### JSDoc (TypeScript)
```typescript
/**
 * Fetches a paginated list of products from the catalog.
 *
 * @param {string} categoryId - The category to filter by.
 * @param {number} [page=1] - Page number (1-indexed).
 * @param {number} [limit=20] - Maximum items per page.
 * @returns {Promise<ProductPage>} Resolves to a page of product records.
 * @throws {NotFoundError} If the category does not exist.
 *
 * @example
 * const page = await fetchProducts('electronics', 2, 10);
 * console.log(page.items);
 */
async function fetchProducts(
  categoryId: string,
  page = 1,
  limit = 20
): Promise<ProductPage> { ... }
```

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Python Docstrings | `references/python-docstrings.md` | Google, NumPy, Sphinx styles |
| TypeScript JSDoc | `references/typescript-jsdoc.md` | JSDoc patterns, TypeScript |
| FastAPI/Django API | `references/api-docs-fastapi-django.md` | Python API documentation |
| NestJS/Express API | `references/api-docs-nestjs-express.md` | Node.js API documentation |
| Coverage Reports | `references/coverage-reports.md` | Generating documentation reports |
| Documentation Systems | `references/documentation-systems.md` | Doc sites, static generators, search, testing |
| Interactive API Docs | `references/interactive-api-docs.md` | OpenAPI 3.1, portals, GraphQL, WebSocket, gRPC, SDKs |
| User Guides & Tutorials | `references/user-guides-tutorials.md` | Getting started, tutorials, troubleshooting, FAQs |

## Constraints

### MUST DO
- Resolve docstring format before starting, in order: constitution → existing codebase
  convention → language default (see "Resolving Docstring Format" above). No human turn required
- Record the resolved format and the tier that resolved it in the coverage report
- Detect framework for correct API doc strategy
- Document all public functions/classes
- Include parameter types and descriptions
- Document exceptions/errors
- Test code examples in documentation
- Generate coverage report

### MUST NOT DO
- Assume a docstring format without working the resolution order above — picking one out of
  thin air is never allowed
- Stall waiting for a human to choose a format; the resolution order is designed to make that
  question unnecessary
- Override a documentation standard the constitution states explicitly
- Apply wrong API doc strategy for framework
- Write inaccurate or untested documentation
- Skip error documentation
- Document obvious getters/setters verbosely
- Create documentation that's hard to maintain

## Output Formats

Depending on the task, provide:
1. **Code Documentation:** Documented files + coverage report
2. **API Docs:** OpenAPI specs + portal configuration
3. **Doc Sites:** Site configuration + content structure + build instructions
4. **Guides/Tutorials:** Structured markdown with examples + diagrams

## Knowledge Reference

Google/NumPy/Sphinx docstrings, JSDoc, OpenAPI 3.0/3.1, AsyncAPI, gRPC/protobuf, FastAPI, Django, NestJS, Express, GraphQL, Docusaurus, MkDocs, VitePress, Swagger UI, Redoc, Stoplight

