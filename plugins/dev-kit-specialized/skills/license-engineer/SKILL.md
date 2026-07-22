---
name: license-engineer
description: "Use when the task involves software licensing — OSI license selection (MIT, Apache, GPL, MPL, BSL), dependency license compliance pipelines, copyleft risk analysis, dual-licensing, proprietary EULAs, notice files, export control, or IP governance."
---

# License Engineering

Reference for choosing, drafting, and operationalizing software licenses: license selection, dependency compliance pipelines, and production distribution — with emphasis on IP protection, liability mitigation, and ethical open-source practices.

## Approach

1. Establish legal requirements and distribution architecture: entities involved, commercial targets, distribution model (SaaS, on-prem, embedded, mobile, open-core), known dependencies.
2. Review existing dependencies and their licenses for compatibility conflicts.
3. Analyze compliance requirements, commercial constraints, and ethical considerations.
4. Recommend a license (or license structure) and draft the supporting artifacts: LICENSE, NOTICE, CONTRIBUTING/CLA language, dependency manifest.

## License Selection Reasoning

- For the recommended license, explain why it fits the commercial, compliance, and distribution goals.
- For each serious alternative, explain why NOT that license in this context.
- Weigh permissive adoption vs. copyleft reciprocity vs. monetization control vs. ecosystem trust.
- Flag where a license is legally valid but strategically weak for the user's goals.
- Prefer contextual reasoning over fixed rankings — there is no universal "best" license.
- Make rejection criteria explicit against deployment model, dependency graph, contributor model, and enforcement burden.

## Legal Frameworks

- MIT / Apache 2.0 — permissive, minimal friction, standard for libraries and SDKs
- GNU GPLv3 / AGPLv3 — copyleft; AGPL closes the SaaS loophole (network use triggers source disclosure)
- Mozilla Public License 2.0 — file-level copyleft, compatible with proprietary linking
- Business Source License (BSL) / Functional Source License (FSL) — source-available, time-delayed conversion to an open license; commonly paired with a "no competing SaaS" additional-use grant
- OpenRAIL-M — responsible-AI license family for model weights, with behavioral-use restrictions
- Custom proprietary EULA
- Dual-licensing (e.g., open core + commercial)

**BSL/SSPL-style source-available terms are now an established, repeating pattern** — not a fringe choice — set by MongoDB, Elastic, CockroachDB, and Redis, and it continues to provoke community forks under neutral foundations (OpenTofu from Terraform, OpenBao from Vault, Valkey from Redis). When recommending BSL/SSPL, name this fork risk explicitly as a strategic tradeoff, not just a legal one.

## Compliance Pipelines

- Dependency license scanning (SBOM generation, license classification)
- Copyleft-trigger detection (which dependencies force disclosure obligations, under what linking/distribution conditions)
- Remediation strategies for incompatible or unacceptable licenses (replace, isolate, relicense, or obtain exception)
- Notice-file generation and maintenance as dependencies change
- CI gate: fail the build on a newly introduced disallowed license

## Risk & Liability

- Warranty disclaimers and liability caps appropriate to the distribution model
- Severability clauses so an invalid clause doesn't void the agreement
- Export control review (EAR/ITAR exposure) for cryptography or dual-use components
- Trademark restrictions separate from code license (name/logo usage)
- Jurisdiction and dispute-resolution clause alignment with entity structure
- Patent grant/termination clauses (Apache 2.0-style) vs. silence on patents (MIT/BSD)

## Multi-License Systems

- Dual-licensing isolation (which code paths are open vs. commercial, and how that boundary is enforced)
- Contributor License Agreements (CLA) or Developer Certificate of Origin (DCO) for accepting outside contributions
- Sub-licensing and white-label terms
- Static vs. dynamic linking distinctions for copyleft obligations

## Ethical Compliance

- Alignment with the OSI Open Source Definition when claiming "open source"
- OpenRAIL-style behavioral-use restrictions for AI model licensing
- Contributor privacy and CLA data handling
- Governance transparency for how license changes get decided and communicated

## Production Readiness Checklist

- License selected and rejection rationale for alternatives documented
- LICENSE, NOTICE, and CONTRIBUTING/CLA text drafted and reviewed
- Dependency license scan passing in CI with no undisclosed copyleft obligations
- Liability disclaimers, severability, and jurisdiction clauses in place
- Export control reviewed if cryptography or dual-use tech is involved
- Trademark usage terms separated from code license
- Notice-file regeneration wired into the dependency-update process

Always prioritize precision, liability reduction, and transparency — a license that is legally sound but confuses contributors or triggers unwanted forks has failed its purpose.
