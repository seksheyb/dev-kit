---
name: microsoft-ops
description: Use when the task involves Microsoft infrastructure or cloud operations — Windows Server administration, Active Directory (users, groups, OUs, trusts, replication, delegation), DNS/DHCP management, Group Policy (GPO), Microsoft 365 (Exchange Online, Teams, SharePoint, licensing), Microsoft Graph automation, Entra ID, or AD security review and hardening (Kerberos, NTLM, LDAP signing, privileged group audits, attack path analysis).
---

# Microsoft Ops

Knowledge pack for Microsoft enterprise operations: Windows Server and Active Directory infrastructure administration, DNS/DHCP/GPO management, Microsoft 365 workload automation, and Active Directory security posture review and hardening.

## Windows Server Infrastructure Administration

### DNS and DHCP
- Manage DNS zones, records, scavenging, and auditing.
- Configure DHCP scopes, reservations, and policies.
- Export/import configurations for backup and rollback.

### GPO and server administration
- Manage GPO links, security filtering, and WMI filters.
- Generate GPO backups and comparison reports.
- Work with server roles, certificates, WinRM, SMB, and IIS.

### Safe change engineering
- Run pre-change verification flows before modifying infrastructure.
- Define post-change validation and rollback paths.
- Produce impact assessments and plan maintenance windows.
- Target PowerShell 7 (current LTS) for new automation; keep 5.1 only for legacy Windows-only/RSAT-bound scripts that haven't been ported.

### Infra change checklist
- Scope documented (domains, OUs, zones, scopes).
- Pre-change exports completed.
- Affected objects enumerated before modification.
- `-WhatIf` preview reviewed.
- Logging and transcripts enabled.

### Typical tasks
- Update DNS A/AAAA/CNAME records for migrations.
- Safely restructure OUs with staged impact analysis.
- Bulk GPO relinking with validation reports.
- DHCP scope cleanup with automated compliance checks.

## Active Directory Operations

- Automate user, group, computer, and OU operations.
- Validate delegation, ACLs, and identity lifecycles.
- Work with trusts, replication, and domain/forest configurations.
- Design safe, repeatable, documented workflows for enterprise-scale AD changes.

## Microsoft 365 Administration

### Exchange Online
- Mailbox provisioning and lifecycle management.
- Transport rules and compliance configuration.
- Shared mailbox operations.
- Message trace and audit workflows.

### Teams and SharePoint
- Team lifecycle automation.
- SharePoint site management.
- Guest access and external sharing validation.
- Collaboration security workflows.

### Licensing and Graph API
- License assignment, auditing, and optimization.
- Microsoft Graph PowerShell for identity and workload automation.
- Manage service principals, apps, and roles.

### M365 change checklist
- Validate the connection model (Graph, EXO module).
- Audit affected objects before modifications.
- Apply least-privilege RBAC for automation.
- Confirm impact and compliance requirements.

### Typical tasks
- Automate onboarding: mailbox, licenses, Teams creation.
- Audit external sharing and fix misconfigured SharePoint sites.
- Bulk update mailbox settings across departments.
- Automate license cleanup with the Graph API.

## AD Security Review and Hardening

### Security posture assessment
- Analyze privileged groups (Domain Admins, Enterprise Admins, Schema Admins) with justification for each member.
- Review tiering models and delegation best practices.
- Detect orphaned permissions, ACL drift, and excessive rights.
- Evaluate domain/forest functional levels and their security implications.

### Authentication and protocol hardening
- Enforce LDAP signing, channel binding, and Kerberos hardening.
- Identify NTLM fallback, weak encryption, and legacy trust configurations.
- Recommend conditional access transitions (Entra ID) where applicable.

### GPO and SYSVOL security review
- Examine security filtering and delegation.
- Validate restricted groups and local admin enforcement.
- Review SYSVOL permissions and replication security.

### Attack surface reduction
- Evaluate exposure to common vectors: DCShadow, DCSync, Kerberoasting.
- Identify stale SPNs, weak service accounts, and unconstrained delegation.
- Prioritize remediation paths: quick wins first, then structural changes.

### AD security review checklist
- Privileged groups audited with justification.
- Delegation boundaries reviewed and documented.
- GPO hardening validated.
- Legacy protocols disabled or mitigated.
- Authentication policies strengthened.
- Service accounts classified and secured.

### Review deliverables
- Executive summary of key risks.
- Technical remediation plan.
- PowerShell or GPO-based implementation scripts.
- Validation and rollback procedures.

## Priorities
Safe change engineering everywhere (pre-change exports, enumeration, `-WhatIf`, rollback paths), least-privilege access for both humans and automation, and security recommendations that are actionable and prioritized.
