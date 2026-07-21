# Infra / Platform Engineer

This plugin (`dev-kit-infra`) ships no agents or commands of its own — it is a pure skills library, 14 knowledge packs that together cover one persona: the engineer responsible for cloud architecture, infrastructure-as-code, container/orchestration platforms, production reliability, and the Microsoft/Windows estate.

## Cloud & IaC

#### `cloud-architect`
- **Why needed:** Multi-cloud architecture decisions (service selection, topology, DR strategy) require a structured discovery-through-operate workflow, not ad-hoc suggestions.
- **What it does:** Runs a 6-step workflow (discovery, design, security, cost model, migration via the 6Rs framework, operate) with explicit validation checkpoints — e.g., confirming every component has a redundancy strategy after design, and validating VPC/VNet peering is active before a migration cutover. Loads AWS/Azure/GCP/multi-cloud reference files on demand.
- **Why not vanilla Claude Code:** Without this skill, Claude has no forcing function to check for single points of failure, validate peering state with real CLI commands, or apply the 6Rs migration framework — it would produce a generic architecture description instead of a verified plan.
- **When to use:** Designing cloud architectures, planning migrations, or optimizing multi-cloud deployments — Well-Architected Framework reviews, landing zones, cloud security architecture, disaster recovery, serverless design.
- **Then what:** Hand the design to `terraform-engineer` to implement, or `devops-engineer` to wire into CI/CD.

#### `terraform-engineer`
- **Why needed:** Terraform work fails silently in production (state drift, provider auth, unpinned versions) unless validated at every step before apply.
- **What it does:** Drives module design, remote state configuration, and a strict validate-plan-apply pipeline (`terraform fmt` → `validate` → `tflint` → `plan -out=tfplan` → `apply tfplan`), with a documented error-recovery branch for state drift (`terraform refresh`/`import`), provider auth failures, and dependency ordering issues.
- **Why not vanilla Claude Code:** Vanilla Claude Code will write Terraform HCL but won't enforce the retry-until-clean validation loop or know the specific recovery command for state drift versus auth errors versus dependency cycles.
- **When to use:** Implementing IaC across AWS/Azure/GCP — module development and versioning, state backend migration, importing existing resources, resolving state conflicts, multi-environment workflows.
- **Then what:** Feed the applied infrastructure into `monitoring-expert` for observability or `sre-engineer` for SLO definition.
- **Notes:** Distinct from `cloud-architect` — this skill implements the topology cloud-architect designs; it doesn't decide the topology itself.

#### `azure-infra-engineer`
- **Why needed:** Azure has its own architecture idioms (resource groups, Entra ID hybrid identity, ARM/Bicep) that a generic cloud skill doesn't cover in depth.
- **What it does:** Covers Azure resource architecture (resource groups, tagging, NSGs), hybrid identity/Entra ID integration (AAD Connect, Conditional Access, managed identities), ARM/Bicep IaC, and pipeline integration (GitHub Actions/Azure DevOps), backed by a deployment checklist (RBAC least-privilege check, deployment preview validation, documented rollback path).
- **Why not vanilla Claude Code:** Entra ID Conditional Access design and managed-identity-vs-service-principal tradeoffs are Azure-specific judgment calls that generic cloud knowledge gets wrong or omits entirely.
- **When to use:** Azure resource architecture, VNets/NSGs, Entra ID/hybrid identity, PowerShell Az automation, ARM/Bicep IaC, Azure Policies, or Azure cost/compliance auditing.
- **Then what:** Pair with `powershell-pro` for the operational scripting layer, or `microsoft-ops` when the task crosses into on-prem AD/Entra hybrid identity.
- **Notes:** Overlaps with `cloud-architect`'s Azure reference but goes deeper on identity and PowerShell-native automation specifically.

## Containers & Orchestration

#### `docker-expert`
- **Why needed:** Production container images need multi-stage builds, security hardening, and supply-chain attestation — defaults from `docker init` or copy-pasted Dockerfiles don't meet any of that bar.
- **What it does:** Optimizes Dockerfiles (multi-stage builds, layer caching, distroless/Alpine bases, non-root execution), hardens images (scanning, secret management, capability restrictions), and covers supply-chain security (SBOM generation, Cosign signing, SLSA provenance) and Docker Hardened Images migration, against a checklist targeting <100MB images and zero critical CVEs.
- **Why not vanilla Claude Code:** Vanilla Claude Code can write a working Dockerfile but won't default to multi-stage builds, non-root users, SBOM/provenance attestation, or know the DHI dev-vs-runtime variant tradeoff.
- **When to use:** Dockerfiles, multi-stage builds, image size/build-time optimization, container security hardening, docker-compose, BuildKit/Bake, registry and image-scanning work.
- **Then what:** Push the hardened image through `devops-engineer`'s CI/CD pipeline or `kubernetes-specialist`'s deployment manifests.

#### `kubernetes-specialist`
- **Why needed:** Kubernetes manifests need resource limits, health probes, RBAC, and NetworkPolicies applied correctly, or workloads become insecure or unstable at scale.
- **What it does:** Designs and implements workloads (Deployments, StatefulSets, DaemonSets, Jobs), networking (Services, Ingress, NetworkPolicies), Helm charts, service mesh (Istio/Linkerd), GitOps (ArgoCD/Flux), and multi-cluster/cost-optimization patterns; validates rollouts with `kubectl rollout status`/`describe pod` and rolls back with `kubectl rollout undo` on failure.
- **Why not vanilla Claude Code:** It enforces MUST-DO constraints (declarative YAML only, resource limits on every container, liveness/readiness probes, least-privilege RBAC) that vanilla Claude Code has no reason to apply consistently without prompting.
- **When to use:** Deploying/managing K8s workloads, pod security policies, service accounts, network isolation, debugging pod crashes, right-sizing, Helm charts, RBAC, GitOps pipelines, multi-cluster management.
- **Then what:** Route failures to `chaos-engineer` for resilience testing or `monitoring-expert` for dashboards on the new workload.

#### `platform-engineer`
- **Why needed:** Internal developer platforms need a golden-path/self-service design, not just infrastructure automation — the goal is reducing developer cognitive load, which is a distinct discipline from deploying infrastructure.
- **What it does:** Designs multi-tenant IDP architecture (isolation, RBAC, cost allocation), self-service capabilities (environment provisioning, database creation, service deployment), developer portals (Backstage-style), and golden path templates, targeting metrics like >90% self-service rate and <5 minute provisioning.
- **Why not vanilla Claude Code:** Vanilla Claude Code treats "provision infra" as a one-off task; this skill frames it as a reusable, self-service golden path with adoption metrics, which requires deliberate platform-product thinking it wouldn't otherwise apply.
- **When to use:** Building internal developer platforms — self-service infrastructure, golden paths, developer portals, Backstage, service catalogs, Crossplane/Terraform/Helm abstractions, platform adoption.
- **Then what:** Delegate the underlying provisioning code to `terraform-engineer` or `kubernetes-specialist`; delegate the CI/CD wiring to `devops-engineer`.
- **Notes:** The key differentiator from `devops-engineer`: platform-engineer builds the paved-road abstraction developers self-serve from, not the pipeline itself.

## Reliability & Ops

#### `devops-engineer`
- **Why needed:** CI/CD pipelines, containerization, and IaC are typically handled as separate concerns; this skill unifies them under one build/deploy/ops workflow so pipeline and infra decisions stay consistent.
- **What it does:** Operates with three explicit "hats" (Build, Deploy, Ops) across a 6-step workflow (assess, design, implement, validate — running `terraform plan`/lint/tests, deploy with smoke tests, monitor), covering GitHub Actions/GitLab CI, Docker, Kubernetes, Terraform/Pulumi, deployment strategies (blue-green/canary/rolling), and incident response runbooks.
- **Why not vanilla Claude Code:** It forces a validate-before-deploy and rollback-ready-before-live discipline across the whole pipeline, whereas vanilla Claude Code would write each artifact (Dockerfile, workflow YAML, Terraform) independently without that gate.
- **When to use:** Setting up CI/CD pipelines, containerizing applications, IaC, K8s deployment, cloud platform configuration, release automation, or responding to production incidents.
- **Then what:** For deep dives, delegate containerization specifics to `docker-expert`, orchestration specifics to `kubernetes-specialist`, and reliability specifics to `sre-engineer`.
- **Notes:** This is the generalist/integrator of the group — narrower skills (docker-expert, kubernetes-specialist, terraform-engineer) go deeper on their own slice.

#### `sre-engineer`
- **Why needed:** Reliability targets need to be quantitative (SLOs, error budgets) and tied to explicit policy, not vague "make it more reliable" requests.
- **What it does:** Defines SLIs/SLOs and calculates error budgets, builds golden-signal (latency/traffic/errors/saturation) dashboards and alerting, automates toil, and designs chaos experiments with explicit MUST-NOT constraints (no SLOs without user-impact justification, no alerting on symptoms without a runbook, no tolerating >50% toil unaddressed).
- **Why not vanilla Claude Code:** The MUST-NOT list encodes real operational discipline (e.g., "don't skip postmortems or assign blame," "don't deploy without capacity planning") that vanilla Claude Code has no basis to enforce on its own.
- **When to use:** Defining SLIs/SLOs, managing error budgets, incident management, chaos engineering, toil reduction, or capacity planning.
- **Then what:** Hand chaos experiment design to `chaos-engineer` for deeper execution detail, and dashboard implementation to `monitoring-expert`.
- **Notes:** Differs from `monitoring-expert` — sre-engineer decides *what reliability means* (SLOs, error budgets, policy); monitoring-expert builds the instrumentation and dashboards that measure it.

#### `monitoring-expert`
- **Why needed:** Observability needs structured logging, correctly-labeled metrics, and traces wired together — ad-hoc `console.log` and unlabeled counters produce dashboards nobody can act on.
- **What it does:** Runs an assess-instrument-collect-visualize-alert workflow with concrete code examples (structured Pino logging with correlation IDs, Prometheus Counter/Histogram instrumentation), builds RED/USE-method dashboards, and covers load testing (k6/Artillery) and CPU/memory profiling for capacity planning.
- **Why not vanilla Claude Code:** It supplies the specific anti-pattern-vs-pattern contrast (e.g., string-interpolated logs vs. structured fields with a request ID) and the RED/USE dashboard methodology that vanilla Claude Code doesn't apply without being told which method fits which system.
- **When to use:** Setting up application monitoring, adding observability, debugging production issues with logs/metrics/traces, load testing, profiling bottlenecks, or forecasting capacity needs.
- **Then what:** Feed alerting thresholds back to `sre-engineer` for error-budget alignment.
- **Notes:** Focused on the instrumentation/tooling layer; `sre-engineer` owns the policy layer that decides what's worth alerting on.

#### `chaos-engineer`
- **Why needed:** Failure injection without blast-radius controls and a scripted rollback is itself a production risk — this skill exists to make chaos experiments safe, not just interesting.
- **What it does:** Runs a system-analysis → experiment-design → execute → learn → automate workflow, enforcing a safety checklist (verify steady state first, cap blast radius, automated rollback in ≤30 seconds, change one variable at a time, no production experiments without circuit breakers/canary isolation, mandatory written learning summary).
- **Why not vanilla Claude Code:** The 30-second scripted-rollback requirement and single-variable-at-a-time discipline are non-obvious safety constraints that vanilla Claude Code would not impose unprompted, risking an uncontrolled experiment.
- **When to use:** Designing chaos experiments, implementing failure injection frameworks (Chaos Monkey, Litmus), planning game days, or building blast-radius controls — including continuous chaos testing in CI/CD.
- **Then what:** Feed findings into `sre-engineer`'s reliability/toil backlog, or `kubernetes-specialist` for pod/node-level chaos fixes.

#### `database-administrator`
- **Why needed:** Production databases need HA, backup/DR, and performance tuning held to concrete targets (99.99% uptime, RTO <1hr, RPO <5min) — generic "run a migration" advice doesn't get there.
- **What it does:** Covers production-grade installation and hardening, performance optimization (query analysis, index strategy, vacuum/buffer tuning) for PostgreSQL/MySQL/MongoDB/Redis, HA patterns (streaming/logical replication, automatic failover, split-brain prevention), and backup/recovery (point-in-time recovery, offsite replication, quarterly DR testing) against an explicit administration checklist.
- **Why not vanilla Claude Code:** Vanilla Claude Code can write a `CREATE INDEX` statement but won't reason about split-brain prevention in multi-master replication or hold backup strategy to a quantified RTO/RPO target.
- **When to use:** Database infrastructure operations — HA, replication, failover, backup/DR, performance tuning, index strategy, connection pooling, security hardening, monitoring, migrations.
- **Then what:** Hand alerting/dashboard needs to `monitoring-expert`; hand network-layer access controls to `network-engineer`.

#### `network-engineer`
- **Why needed:** Network design decisions (segmentation, routing, zero-trust) have compounding security and latency consequences that need dedicated expertise separate from general cloud architecture.
- **What it does:** Covers network architecture (topology, segmentation, SDN, multi-region design), cloud networking (VPC/subnet design, transit gateways, VPN), security (zero-trust, micro-segmentation, DDoS/WAF, network ACLs), and performance optimization (QoS, traffic shaping, CDN), held to a checklist of 99.99% uptime and <50ms regional latency.
- **Why not vanilla Claude Code:** Zero-trust micro-segmentation and DDoS/WAF configuration require security-network tradeoff judgment that vanilla Claude Code doesn't reliably apply without a dedicated checklist forcing it.
- **When to use:** Cloud/hybrid network design, VPC architecture, subnets, routing, VPN, transit gateways, load balancing, DNS/DNSSEC, firewalls, zero-trust segmentation, DDoS/WAF, SD-WAN, latency troubleshooting.
- **Then what:** Coordinate with `cloud-architect` on overall topology, or `azure-infra-engineer`/`microsoft-ops` when the network spans an on-prem Windows estate.

## Microsoft/Windows Stack

#### `microsoft-ops`
- **Why needed:** Active Directory and Microsoft 365 changes (OU restructuring, GPO relinking, mailbox lifecycle) are high-blast-radius and need pre-change exports and `-WhatIf` previews baked into the workflow, not applied ad hoc.
- **What it does:** Covers Windows Server/AD infrastructure (DNS/DHCP zones and scopes, GPO links and WMI filters, server roles/certificates/WinRM/SMB/IIS), AD operations (users, groups, OUs, trusts, replication, delegation/ACLs), and Microsoft 365 administration (Exchange Online mailbox lifecycle, Teams/SharePoint governance, guest access), all gated by a change checklist (scope documented, pre-change exports, `-WhatIf` preview reviewed, transcripts enabled).
- **Why not vanilla Claude Code:** Vanilla Claude Code doesn't know to export DNS zones or GPOs before modifying them, or that `-WhatIf` review is mandatory before a live AD change — the safe-change-engineering discipline here is domain-specific.
- **When to use:** Windows Server administration, Active Directory (users/groups/OUs/trusts/replication/delegation), DNS/DHCP, Group Policy, Microsoft 365 (Exchange/Teams/SharePoint/licensing), Microsoft Graph automation, Entra ID, or AD security hardening (Kerberos, NTLM, LDAP signing, attack path analysis).
- **Then what:** Delegate the actual scripting of these workflows to `powershell-pro`.
- **Notes:** This is the domain-knowledge/process layer for the on-prem Microsoft stack; `powershell-pro` is the scripting-language layer that implements it.

#### `powershell-pro`
- **Why needed:** PowerShell automation spans two incompatible runtimes (Windows PowerShell 5.1 vs PowerShell 7+) with different module availability and language features — code that's idiomatic in one can silently fail in the other.
- **What it does:** Distinguishes when to target 5.1 (RSAT modules, legacy Windows Server, .NET Framework) versus 7+ (cross-platform, Azure/cloud automation, parallelism), covers enterprise automation patterns (idempotent scripts, dry-run, rollback, pre-change `Get-*` enumeration), cloud/DevOps automation (Az PowerShell, Microsoft Graph, CI/CD), and a script-quality checklist (`[CmdletBinding()]`, parameter validation, `-WhatIf`/`-Confirm` support, try/catch error handling).
- **Why not vanilla Claude Code:** Vanilla Claude Code frequently writes PowerShell 7-only syntax (ternary operators, null-coalescing) without checking whether the target is a 5.1/RSAT-bound environment, which breaks the script outright.
- **When to use:** Windows PowerShell 5.1 or PowerShell 7+ scripting, RSAT automation, Azure/Graph automation, CI/CD scripting, module/manifest design, GUI/TUI front-ends (WinForms/WPF/MahApps, terminal UIs), PSRemoting/JEA, script signing, SecretManagement.
- **Then what:** Apply the resulting scripts within `microsoft-ops` workflows or `azure-infra-engineer` pipelines.
- **Notes:** The version-compatibility distinction (5.1 vs 7+) is the load-bearing detail that separates this from generic scripting help.
