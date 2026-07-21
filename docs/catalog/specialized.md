# Specialized Domain Expert

The `dev-kit-specialized` plugin has no agents or commands of its own — it is a pure skills grab-bag of 19 niche-vertical knowledge packs, all mapping to one persona: the specialist you reach for when a task leaves general full-stack territory and enters a domain with its own vocabulary, regulators, or platform quirks. Subsections below group the skills by the kind of specialist they replace.

## Dev Tooling & Integrations

Skills for building the tools developers use, and for wiring Claude into third-party developer platforms (Jira/Confluence, Slack, MCP itself).

#### `cli-developer`

- **Why needed:** Command-line tools have their own UX conventions (flags, subcommands, completions, TTY behavior) that are easy to get subtly wrong.
- **What it does:** Encodes a five-step workflow (analyze UX, design commands, implement, polish, test) plus hard constraints — startup under 50ms, `--help`/`--version` required, SIGINT handling, no color on non-TTY output, no breaking flag renames — and framework-specific references for Node (commander/yargs/inquirer), Python (click/typer/argparse/rich), and Go (cobra/viper/bubbletea).
- **Why not vanilla Claude Code:** Without this, Claude tends to write a working parser but skip the cross-platform polish (shell completions, stderr-vs-stdout discipline, non-interactive CI fallbacks) that separates a toy script from a shippable CLI.
- **When to use:** Building CLI tools, parsing flags/subcommands, adding progress bars/spinners, or generating shell completion scripts.
- **Then what:** Loads the matching language reference file only when needed, then implements against the MUST DO/MUST NOT DO checklist.

#### `devtools-engineer`

- **What it does:** Covers two connected areas — optimizing build systems (incremental compilation, caching, bundle/tree-shaking, module federation, monorepo task orchestration) and building developer tools themselves (CLIs, code generators, IDE extensions, plugin architectures, distribution via npm/Homebrew/binaries) — with numeric targets like build time under 30s, rebuild under 5s, and >90% cache hit rate.
- **Why needed:** Build performance and tool ergonomics compound across an entire engineering org; a slow or flaky build system is a tax paid by every developer, every day.
- **Why not vanilla Claude Code:** Generic coding help optimizes the code being built, not the build system itself — this skill's checklists (cache invalidation strategy, dependency tracking, distributed caching) target a different, often-neglected layer.
- **When to use:** Build performance work, bundlers/compilation, monorepos, module federation, or scaffolding/IDE-extension tooling.
- **Then what:** Applies the relevant architecture/optimization checklist and proposes concrete tool or config changes.

#### `mcp-developer`

- **Why needed:** MCP has a specific JSON-RPC 2.0 protocol, lifecycle, and SDK surface (TypeScript/Python) that differs from building a generic API.
- **What it does:** Gives a six-step workflow — analyze, scaffold (`npx @modelcontextprotocol/create-server` or `pip install mcp`), design schemas with Zod/Pydantic, implement tool/resource handlers, test with the MCP Inspector, deploy — plus minimal working server examples in both SDKs and a feedback loop for schema-validation and transport-serialization failures.
- **Why not vanilla Claude Code:** Protocol compliance details (resource URI conventions, transport handshakes over stdio/SSE/HTTP, well-formed JSON-RPC error shapes) are easy to get wrong without a reference tying schema validation errors back to specific fixes.
- **When to use:** Building, debugging, or extending MCP servers/clients — tool handlers, resource providers, transport layers, or protocol-compliance debugging.
- **Then what:** Scaffolds the project, wires handlers, and iterates using the Inspector-driven feedback loop until compliant.

#### `atlassian-mcp`

- **What it does:** Covers integrating with Jira/Confluence through MCP — JQL/CQL query design, OAuth 2.1/API-token/PAT authentication patterns, server selection (official cloud vs. open-source vs. self-hosted), and a workflow that validates queries with a `maxResults=1` probe before full execution or bulk writes.
- **Why needed:** Jira and Confluence expose broad, easy-to-misuse query languages and write APIs where a bad bulk operation or missing permission check has real workspace consequences.
- **Why not vanilla Claude Code:** Generic model knowledge of JQL/CQL syntax is inconsistent and untested against real permission scopes — this skill enforces a read-before-write validation discipline (probe query, verify scopes, then act) that prevents costly bulk mistakes.
- **When to use:** Querying Jira issues with JQL, searching/editing Confluence with CQL, automating sprints/backlogs, setting up MCP auth, or debugging Atlassian API integration.
- **Then what:** Selects a server, authenticates, validates the query with a small probe, then executes with pagination and rate-limit backoff.
- **Notes:** Ships a minimal MCP server config (`@sooperset/mcp-atlassian`) with an explicit reminder to load tokens from env vars/secrets managers, never hardcode.

#### `slack-expert`

- **What it does:** Covers the Slack app ecosystem — `@slack/bolt` event/action/shortcut handling, Web API and Events API usage, Block Kit UI patterns (replacing legacy attachments), OAuth 2.0 V2 flows, Socket Mode vs. HTTP tradeoffs, and newer surfaces like Workflow Builder steps, Canvas API, and Slack Lists.
- **Why needed:** Slack's platform has shifted substantially (Block Kit over attachments, Socket Mode for dev, OAuth V2) and a bot built on outdated patterns breaks or gets flagged in review.
- **Why not vanilla Claude Code:** Without a current checklist, Claude tends to reach for deprecated attachment-based messages or skip request-signature verification — this skill's excellence checklist and code-review checklist catch both.
- **When to use:** Building Slack apps, Bolt-based bots, slash commands, interactive modals, or reviewing existing Slack bot code.
- **Then what:** Implements against the Slack Excellence Checklist (signature verification, rate-limit backoff, Block Kit, secure token storage) and can run the same checklist in reverse as a code review.

#### `license-engineer`

- **What it does:** Covers OSI license selection (MIT, Apache 2.0, GPLv3/AGPLv3, MPL 2.0, BSL, FSL, OpenRAIL-M for AI models) reasoned against commercial/distribution goals, dependency compliance pipelines, copyleft risk analysis, dual-licensing structures, and export-control/notice-file concerns across distribution models (SaaS, on-prem, embedded, mobile, open-core).
- **Why needed:** License choice has direct legal and commercial consequences (copyleft obligations, patent grants, compatibility conflicts) that most engineers pick based on habit rather than analysis.
- **Why not vanilla Claude Code:** Generic model knowledge of licenses is a liability risk without a framework that explicitly argues for and against alternatives given a specific dependency graph and distribution model — this skill requires stating rejection criteria, not just a recommendation.
- **When to use:** OSI license selection, dependency license compliance, copyleft risk analysis, dual-licensing, proprietary EULAs, notice files, export control, or IP governance.
- **Then what:** Analyzes the dependency graph and distribution model, then produces a license recommendation with explicit for/against reasoning per serious alternative.

## Regulated Industries

Skills that encode domain-specific regulatory frameworks and financial/legal constraints — the ones where generic knowledge is riskiest without a curated reference.

#### `fintech-engineer`

- **What it does:** Covers banking system integration, payment gateway/transaction processing, trading platform development (order management, matching engines, margin), and regulatory compliance (KYC, AML, suspicious activity reporting, cross-border compliance), with a checklist targeting 100% transaction accuracy, >99.99% uptime, <100ms latency, and PCI DSS certification.
- **Why needed:** Financial systems fail expensively and are audited; "close enough" transaction logic or compliance gaps translate directly into regulatory exposure or customer-facing money loss.
- **Why not vanilla Claude Code:** Generic model knowledge of KYC/AML/PCI DSS requirements is a liability risk without a curated, current checklist tying each requirement to a concrete engineering control (audit trail, reconciliation step, encryption boundary).
- **When to use:** Payment systems, banking integrations, trading platforms, KYC/AML, fraud detection, regulatory compliance, or compliance-heavy financial applications.
- **Then what:** Establishes compliance/regulatory requirements first, then designs the transaction/reporting pipeline against the 100%-accuracy checklist.

#### `healthcare-admin`

- **What it does:** Spans revenue cycle management (ICD-10-CM/PCS, CPT, HCPCS, MS-DRGs coding; CMS cost reports via HCRIS Worksheet S/A/D; 340B split-billing audits), compliance (HIPAA Security Rule citing 45 CFR 164.308-312, Stark Law, Anti-Kickback Statute, EMTALA), quality reporting (MIPS, VBP, HRRP, HEDIS, HCAHPS), clinical operations, and health IT/interoperability (FHIR, C-CDA, Epic Caboodle/Cogito).
- **Why needed:** Healthcare administration sits under interlocking federal and state regulatory regimes where citing the wrong CFR section or missing a reporting deadline has compliance and reimbursement consequences.
- **Why not vanilla Claude Code:** Generic model knowledge of "HIPAA compliance" is vague and non-actionable; this skill grounds guidance in specific CFR citations, named federal data systems (PECOS, NHSN, CAQH ProView, NPPES), and named accreditation bodies (Joint Commission, DNV, HFAP) that a real compliance analysis has to reference.
- **When to use:** Revenue cycle management, HIPAA/compliance auditing, medical coding, CMS cost reports, payer contracts, quality improvement, clinical operations, FHIR interoperability, population health, or pharmacy benefits.
- **Then what:** Establishes facility type, state, payer mix, EHR platform, and accreditation body as context, then works the regulatory analysis before recommending any operational change.

#### `legal-advisor`

- **What it does:** Covers contract management (drafting, negotiation, risk assessment), privacy/data protection (GDPR, CCPA, DPAs, cookie/consent, breach procedures, international transfers), IP strategy (patents, trademarks, copyright, trade secrets, licensing), and terms-of-service drafting (liability limitation, warranty disclaimers, indemnification).
- **Why needed:** Contracts and privacy policies are legally binding documents; imprecise language or missing a jurisdiction-specific requirement creates real business exposure.
- **Why not vanilla Claude Code:** Generic model knowledge of "what GDPR requires" is a liability risk without a workflow that first establishes jurisdiction, risk tolerance, and existing contract status before drafting — this skill forces that context-gathering step before producing language.
- **When to use:** Drafting contracts, terms of service, privacy policies (GDPR/CCPA), IP strategy, compliance frameworks, employment agreements/NDAs, or legal risk assessment for tech businesses.
- **Then what:** Establishes business model and jurisdictions, reviews existing contracts/policies, then produces plain-language, actionable documentation with tracked approvals.
- **Notes:** Explicitly frames itself as enabling business objectives while minimizing legal exposure, not as a substitute for retained counsel.

#### `risk-manager`

- **What it does:** Covers risk identification/quantification (VaR, expected shortfall, Monte Carlo), market/credit/operational risk modeling (PD/LGD/EAD estimation, RCSA methodology, KRI development), and regulatory frameworks named explicitly — Basel III, COSO, ISO 31000, Solvency II, ORSA.
- **Why needed:** Enterprise risk management is judged against specific named frameworks (Basel III capital requirements, COSO's control components) that auditors and regulators check against directly.
- **Why not vanilla Claude Code:** Generic model knowledge of "risk management best practices" doesn't map cleanly onto which named framework applies to which risk category — this skill ties VaR/stress-testing techniques to the specific regulatory regime (Basel III for market/credit risk, COSO for operational controls) that governs them.
- **When to use:** Risk identification/quantification, VaR/stress testing, control frameworks, credit/market/operational risk modeling, regulatory compliance, or risk reporting.
- **Then what:** Establishes risk appetite and existing controls, then builds the quantification model and control framework against the applicable named regime.

#### `quant-analyst`

- **What it does:** Covers financial modeling (pricing, factor, volatility models), trading strategies (statistical arbitrage, pairs trading, market making), statistical methods (GARCH, cointegration, Bayesian inference), derivatives pricing (Black-Scholes, binomial trees, Monte Carlo, Greeks), and high-frequency trading microstructure (order book dynamics, latency optimization, execution algorithms) with a <1ms HFT latency target.
- **Why needed:** Quant trading systems must be both mathematically correct and empirically validated — a subtly wrong Greeks calculation or an overfit backtest costs real capital.
- **Why not vanilla Claude Code:** Generic model knowledge of "Black-Scholes" is easy to state but easy to misapply without the backtesting discipline (walk-forward analysis, out-of-sample testing, transaction cost/slippage modeling) this skill insists on before trusting any strategy.
- **When to use:** Trading strategies, statistical arbitrage, backtesting, derivatives pricing, portfolio optimization, risk analytics (VaR), or algorithmic/HFT systems.
- **Then what:** Establishes asset classes and risk tolerance, reviews historical data and existing strategies, then implements and backtests with walk-forward and out-of-sample validation before treating results as reliable.

#### `payment-integration`

- **What it does:** Covers payment gateway integration (auth, tokenization, webhooks, idempotency), PCI DSS compliance (encryption, tokenization, secure transmission), transaction processing (authorization/capture/void/refund flows), subscription billing (dunning, proration, trial periods), and fraud prevention (3D Secure, velocity checks, device fingerprinting), with a checklist requiring zero raw payment data storage and >99.9% transaction success.
- **Why needed:** Payment code handles regulated cardholder data (PCI DSS scope) and money movement where a bug directly costs the business or a customer.
- **Why not vanilla Claude Code:** Generic model knowledge of "handle payments securely" glosses over the specific PCI DSS scoping decisions (tokenize vs. store, which network segments fall in-scope) that determine actual compliance burden — this skill's checklist makes "zero payment data storage" an explicit, non-negotiable target.
- **When to use:** Payment gateways, transaction processing, subscription billing, PCI DSS compliance, tokenization, fraud prevention, webhooks, refunds/chargebacks, or multi-currency support.
- **Then what:** Establishes payment methods/currencies/compliance requirements, then implements the gateway integration with idempotency and audit trail built in from the start.

## Embedded & Games

Skills for resource-constrained, real-time, and performance-critical systems where the runtime environment (silicon or game engine) imposes hard constraints generic web/backend advice doesn't anticipate.

#### `embedded-systems`

- **What it does:** Covers microcontroller programming (STM32, ESP32), FreeRTOS task/queue/synchronization patterns, bare-metal register/peripheral/interrupt handling, power optimization (sleep modes, battery life), and communication protocols (I2C, SPI, UART, CAN) — with a validation loop requiring `-Wall -Werror` clean compiles, `cppcheck` static analysis, and logic-analyzer/oscilloscope timing verification before considering work done.
- **Why needed:** Firmware bugs (missed deadlines, ISR races, stack overflow) manifest as hardware failures, not stack traces, and are far more expensive to debug post-deployment.
- **Why not vanilla Claude Code:** Generic C/C++ knowledge doesn't include hardware-specific discipline — `volatile` for ISR-shared variables, keeping ISRs short and deferring work to tasks, checking `uxTaskGetStackHighWaterMark()` — that this skill enforces as explicit MUST DO/MUST NOT rules with working ISR and FreeRTOS code templates.
- **When to use:** Firmware for microcontrollers, RTOS applications, power optimization, peripheral configuration, interrupt handlers, DMA transfers, or debugging timing issues.
- **Then what:** Analyzes MCU constraints, designs the task/interrupt architecture, implements drivers, then validates against static analysis and real hardware timing measurement — looping back to implementation if issues surface.

#### `game-developer`

- **What it does:** Covers Unity/Unreal Engine feature implementation, ECS architecture, physics/collider configuration, multiplayer networking with lag compensation, shader programming, and game design patterns (object pooling, state machines) — with hard performance targets (60+ FPS, frame time ≤16ms) validated via Unity Profiler or Unreal Insights before shipping.
- **Why needed:** Games have real-time performance budgets (frame time, GC pressure, network desync) that fail silently as janky gameplay rather than as errors or crashes.
- **Why not vanilla Claude Code:** Generic C#/C++ advice doesn't flag engine-specific performance traps — `GetComponent` calls in `Update()`, string-based tag comparisons, allocating in `Update`/`FixedUpdate` — that this skill's MUST NOT DO list calls out explicitly, backed by a working object-pooling code pattern.
- **When to use:** Unity/Unreal feature work, ECS architecture, physics systems, multiplayer networking, FPS optimization, shader development, or game AI.
- **Then what:** Designs the ECS/component architecture, implements the mechanic, then profiles against the 16ms frame-time checkpoint and runs multiplayer latency/desync stress tests before considering it shippable.

#### `iot-engineer`

- **What it does:** Covers IoT architecture from device to cloud (provisioning, edge computing, gateway design), protocols (MQTT/MQTT-SN, CoAP, LoRaWAN, NB-IoT, Zigbee), cloud platform integration (AWS IoT Core, Azure IoT Hub, ThingsBoard), and data pipelines (ingestion, stream/batch processing) — with a checklist targeting >99.9% device uptime, guaranteed message delivery, <500ms latency, and >1 year battery life.
- **Why needed:** IoT deployments run at device scales (thousands to millions) and power/connectivity constraints (battery life, intermittent connectivity) that don't apply to typical backend services.
- **Why not vanilla Claude Code:** Generic networking/backend knowledge doesn't cover the edge-specific tradeoffs (offline operation, protocol translation, local ML inference, certificate-based device auth at fleet scale) this skill treats as first-class design concerns rather than afterthoughts.
- **When to use:** Device management, edge computing, cloud integration (AWS IoT/Azure IoT Hub), MQTT/CoAP/LoRaWAN protocols, massive device scale, or real-time IoT data pipelines.
- **Then what:** Establishes device types/scale/connectivity constraints, designs the edge-to-cloud architecture, then implements with security (device auth, encryption, certificate management) built in from the device layer up.

## Platforms & Growth

Skills tied to a specific commercial platform (Salesforce, blockchains) or to organic growth and visual-asset production.

#### `salesforce-developer`

- **What it does:** Covers Apex development (classes, triggers, batch/queueable/future async patterns), Lightning Web Components, SOQL/SOSL query optimization, and Salesforce DX/CI/CD deployment — with a validation step requiring governor-limit checks (SOQL/DML counts, heap size, CPU time) and 90%+ test coverage including 200-record bulk scenarios before deployment.
- **Why needed:** Salesforce enforces hard governor limits (SOQL/DML calls, CPU time, heap size) per transaction that don't exist on other platforms, and violating them fails the transaction outright in production.
- **Why not vanilla Claude Code:** Generic Java/C#-style OOP instincts lead straight into governor-limit violations — SOQL or DML inside a loop — that this skill's bulkified trigger pattern (collect IDs, query once outside the loop) is specifically designed to prevent, with a side-by-side correct/incorrect code example.
- **When to use:** Writing/debugging Apex, building LWCs, optimizing SOQL, implementing triggers/batch jobs/platform events, managing governor limits, or setting up Salesforce DX/CI/CD.
- **Then what:** Designs declarative-vs-programmatic approach and bulkification strategy first, implements, then validates governor limits and test coverage before deploying via Salesforce DX.

#### `seo-specialist`

- **What it does:** Covers keyword research (search volume, intent classification, long-tail gaps), technical SEO audits (crawl errors, duplicate/thin content, redirect chains), page performance (Core Web Vitals via image compression, CDN, critical CSS), structured data/schema markup, and reporting against organic traffic, rankings, and backlink growth — using named tools (Google Search Console, Screaming Frog, SEMrush/Ahrefs).
- **Why needed:** SEO recommendations that ignore current algorithm behavior (Core Web Vitals, E-E-A-T, helpful-content signals) or chase black-hat tactics can actively hurt rankings rather than help them.
- **Why not vanilla Claude Code:** Generic model knowledge of "SEO best practices" is often stale relative to current ranking signals and doesn't ground recommendations in the analytics data this skill insists on gathering first (current rankings, crawl data, competitor backlink profile) before suggesting changes.
- **When to use:** Technical SEO audits, keyword research/strategy, content optimization, structured data/schema markup, Core Web Vitals, site crawlability, backlinks, or organic ranking improvement.
- **Then what:** Audits the current landscape (rankings, technical setup, content gaps, competitors) before executing white-hat-only optimizations, then delivers monitoring dashboards and an ongoing roadmap.

#### `blockchain-developer`

- **What it does:** Covers smart contract architecture and token standards (ERC20/721/1155/4626), DeFi protocol patterns (AMMs, lending, flash loans, liquidation engines), security patterns (reentrancy guards, oracle manipulation defense, front-running prevention), gas optimization (storage packing, assembly, minimal proxies), and multi-chain platforms (EVM, Solana, Polkadot, Cosmos SDK) — with a checklist requiring 100% test coverage and a clean Slither/Mythril security-analysis pass.
- **Why needed:** Smart contracts are immutable and directly control funds once deployed; a reentrancy bug or unchecked overflow is not a patchable production incident, it's a permanent exploit.
- **Why not vanilla Claude Code:** Generic Solidity knowledge doesn't reliably surface the attack classes (flash loan attacks, oracle manipulation, front-running) this skill enumerates as required security-pattern checks, nor does it default to running Slither/Mythril before calling a contract done.
- **When to use:** Smart contracts, DApps, DeFi protocols, NFTs, Solidity, gas optimization, security auditing, cross-chain solutions, or Web3 integration.
- **Then what:** Reviews target chains and security/compliance requirements, implements the contract, then requires a passing Slither/Mythril audit and full test coverage before considering it complete.

#### `visual-asset-generator`

- **Why needed:** Visual assets have exact dimension and format conventions (1024×1024 transparent app icons, 1200×630 OG images, 1500×500 Twitter banners) that are easy to get wrong without a checklist, and prompt quality directly determines usable output.
- **What it does:** Crafts precise, asset-type-specific image-generation prompts (leading with style adjectives, specifying lighting/medium/palette, "isolated on transparent background" for icons) and routes them through the `prompt-to-asset` MCP server, which spans 30+ models including Stable Diffusion and FLUX, to produce app icons, favicons, OG images, logos, and social banners at the correct dimensions.
- **Why not vanilla Claude Code:** Without this skill Claude cannot generate images directly — it needs the `prompt-to-asset` MCP server as the actual generation backend, plus prompt-engineering discipline (style-first phrasing, transparent-background specification) to get production-usable results rather than generic AI-art output.
- **When to use:** Generating app icons, favicons, OG images, logos, wordmarks, or social media banners, or crafting image-generation prompts.
- **Then what:** Extracts brand context from DESIGN.md/README, crafts the tailored prompt, generates via `prompt-to-asset`, and delivers the asset to the correct project path and filename convention.
- **Notes:** If the MCP server is unavailable, falls back to simply outputting the crafted prompt for the user to paste into any image-generation interface themselves.
