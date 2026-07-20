---
name: powershell-pro
description: Use when the task involves PowerShell — Windows PowerShell 5.1 or PowerShell 7+ scripting, RSAT automation (Active Directory, DNS, DHCP, GPO), Azure/Az and Microsoft Graph automation, CI/CD scripting, module and manifest design, profile engineering, Pester testing, WinForms/WPF/MahApps.Metro or terminal (TUI) front-ends, PSRemoting/JEA, script signing, SecretManagement, and PowerShell security hardening.
---

# PowerShell Pro

Knowledge pack for professional PowerShell work across Windows PowerShell 5.1 and PowerShell 7+: safe enterprise automation, module and profile architecture, GUI/TUI front-ends, and security hardening of scripts, remoting, and endpoints.

## PowerShell 5.1 vs 7+: Version Differences and When Each Applies

### Windows PowerShell 5.1 (legacy / Windows-only)
- Applies when: automating Windows-only infrastructure, RSAT modules, older Windows Server versions, or any environment bound to .NET Framework.
- Strong reliance on .NET Framework APIs and legacy type accelerators.
- Core RSAT modules: ActiveDirectory, DnsServer, DhcpServer, GroupPolicy.
- Use compatible scripting patterns for older Windows Server versions.
- Avoid PowerShell 7+-exclusive cmdlets, syntax, or behaviors when targeting 5.1.

### PowerShell 7+ (modern / cross-platform)
- Applies when: building cross-platform or cloud automation, Azure orchestration, CI/CD pipelines, container workloads, or anything on modern .NET (6/7) runtimes.
- PowerShell 7 language features to use where beneficial:
  - Ternary operators
  - Pipeline chain operators (`&&`, `||`)
  - Null-coalescing / null-conditional operators
  - PowerShell classes and improved performance
  - High-performance parallelism (e.g. `ForEach-Object -Parallel`)
- Deep .NET 6/7 interop for advanced scenarios.
- Container-friendly scripting (Linux pwsh images); multi-platform filesystem and environment handling.

### Cross-version work
- Use capability detection for 5.1 vs 7+ and backward-compatible design patterns.
- Provide safe polyfills or version checks for cross-environment workflows.
- Ensure backward compatibility with older modules and APIs in mixed-version estates.
- Offer modernization guidance when migrating 5.1 codebases to 7+.

## Core Scripting Expertise

### Enterprise automation
- Build reliable scripts for AD object management, DNS record updates, and DHCP scope operations.
- Design safe automation workflows: pre-checks, dry-run, rollback.
- Write idempotent, testable, portable scripts.
- Implement verbose logging, transcripts, and audit-friendly execution.
- Precede changes with read-only `Get-*` queries; enumerate affected objects first.
- Perform backups before changes (DNS zone exports, GPO backups, etc.).

### Cloud and DevOps automation (PowerShell 7+)
- Azure automation using Az PowerShell and Azure CLI.
- Microsoft Graph API automation for M365/Entra (mailbox, Teams, identity orchestration).
- GitHub Actions, Azure DevOps, and cross-platform CI pipelines.
- Validate subscription/tenant context and Az module version compatibility.
- Choose the auth model deliberately (Managed Identity, Service Principal, Graph).
- Handle secrets securely (Key Vault, SecretManagement).

### Script quality checklist
- Apply `[CmdletBinding()]` on advanced functions.
- Validate parameters with types and validation attributes.
- Support `-WhatIf`/`-Confirm` on state-changing operations.
- Check RSAT/module availability before use.
- Handle errors with try/catch and friendly, standardized error messages.
- Include logging and verbose output.
- Support cross-platform paths and encoding (7+).
- Produce CI/CD-ready output: structured, non-interactive.

### Environment safety checklist
- Validate domain membership before domain operations.
- Check permissions and roles before acting.
- Precede changes with read-only queries and pre-change exports/backups.

## Module Architecture and Design

### Module structure
- Separate Public/Private functions.
- Maintain complete module manifests and versioning.
- Extract DRY helper libraries for shared logic.
- Use a dot-sourcing structure for clarity and load performance.

### Function design
- Advanced functions with `[CmdletBinding()]`.
- Strict parameter typing and validation.
- Consistent error handling and verbose-output standards.
- `-WhatIf`/`-Confirm` support on anything that changes state.

### Profile engineering
- Optimize load time with lazy imports; no heavy work in the profile.
- Organize profile fragments (core/dev/infra).
- Import only required modules; keep all reusable logic in modules.
- Provide ergonomic wrappers for common tasks; validate prompt/UX enhancements.

### Module review checklist
- Public interface documented.
- Private helpers extracted.
- Manifest metadata complete.
- Error handling standardized.
- Pester tests recommended for the public surface.

## UI and TUI Development

Keep business/infra logic separate from the UI layer; choose the right UI technology; make tools discoverable, responsive, and maintainable.

### WinForms
- Build classic WinForms UIs from PowerShell: forms, panels, menus, toolbars, dialogs, text boxes, list views, tree views, data grids, progress bars.
- Wire event handlers cleanly (Click, SelectedIndexChanged, etc.).
- Keep WinForms UI code separated from automation logic via UI helper functions/modules and view models or DTOs passed to/from business logic.
- Handle long-running tasks with BackgroundWorker, async patterns, and progress reporting; never freeze the UI thread.

### WPF (XAML)
- Load XAML from external files or here-strings; prefer external/clearly separated XAML.
- Bind controls to PowerShell objects and collections.
- Design MVVM-ish boundaries: scripts act as "ViewModels" calling core modules; keep XAML as static UI where possible.
- Use resource dictionaries, templates, and styles for consistent theming.

### Metro design (MahApps.Metro / Elysium)
- Build modern, tile-based dashboards with flyouts, accent colors, and themes.
- Use icons, badges, and status indicators for quick UX cues.
- Dashboards for monitoring; tile-based launchers for tools; detailed configuration in flyouts or dialogs.
- Organize XAML and PowerShell logic so theme/framework updates are low-risk.

### Terminal UIs (TUIs)
- Design TUIs where a GUI is not ideal or available: menu-driven scripts, key-based navigation, text-based dashboards and status pages.
- Choose the right approach: pure PowerShell (Write-Host, Read-Host, Out-GridView fallback), .NET console APIs for more control, or third-party console/TUI libraries when available.
- Make TUIs accessible: clear prompts, keyboard shortcuts, no hidden "magic input", resilient to bad input and terminal size constraints.

### Choosing the right UI
- Prefer TUIs when running on servers or remote shells, or when automation is primary and human interaction is minimal.
- Prefer WinForms for quick Windows-only utilities where simple traditional dialogs suffice.
- Prefer WPF + MahApps.Metro/Elysium for polished dashboards, tiles, flyouts, theming, and long-term helpdesk/ops usage.

### UI design and implementation checklist
- Clear primary actions (buttons/commands) and obvious navigation (menus, tabs, tiles, sections).
- Input validation with helpful error messages.
- Progress indication for long-running tasks.
- Exit/cancel paths that do not leave half-applied changes.
- Core automation lives in modules; UI code calls into modules, not vice versa.
- Encapsulate UI creation in dedicated functions/files (e.g. `New-MyToolWinFormsUI`, `New-MyToolWpfWindow`).
- All paths handle failures gracefully (try/catch with user-friendly messages).
- Advanced logging can be enabled without cluttering the UI.
- For WPF/Metro: XAML external or clearly separated; themes and resources centralized.

## Security Hardening

### PowerShell security foundations
- Enforce secure PSRemoting configuration: Just Enough Administration (JEA), constrained endpoints.
- Apply transcript logging, module logging, and script block logging.
- Validate Execution Policy, code signing, and secure script publishing.
- Harden scheduled tasks, WinRM endpoints, and service accounts.
- Implement secure credential patterns: SecretManagement, Key Vault, DPAPI, Credential Locker.

### Windows system hardening via PowerShell
- Apply CIS / DISA STIG controls using PowerShell.
- Audit and remediate local administrator rights.
- Enforce firewall and protocol hardening settings.
- Detect legacy/unsafe configurations: NTLM fallback, SMBv1, missing LDAP signing.

### Automation security
- Review modules/scripts for least-privilege design.
- Detect anti-patterns: embedded passwords, plain-text credentials, insecure logs.
- Validate secure parameter handling and error masking.
- Integrate security gates into CI/CD checks.

### Hardening review checklist
- Execution Policy validated and documented.
- No plaintext credentials; secure storage mechanism identified.
- PowerShell logging enabled and verified.
- Remoting restricted using JEA or custom endpoints.
- Scripts follow the least-privilege model.
- Network and protocol hardening applied where relevant.

### Secure code review checklist
- No `Write-Host` output exposing secrets.
- Try/catch with proper sanitization.
- Secure error and verbose output flows.
- Avoid unsafe .NET calls or reflection injection points.

## Priorities
Safety first (pre-checks, `-WhatIf`, backups, rollback), least privilege throughout, logic separated from UI, and version compatibility verified before shipping.
