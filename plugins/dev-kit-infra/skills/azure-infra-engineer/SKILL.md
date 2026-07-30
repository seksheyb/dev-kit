---
name: azure-infra-engineer
description: Use when the task involves Azure infrastructure — Azure resource architecture, VNets/NSGs, Entra ID and hybrid identity, Conditional Access, managed identities, PowerShell Az automation, ARM/Bicep IaC, Azure Policies, GitHub Actions/Azure DevOps pipelines, cost and compliance auditing.
---

# Azure Infra Engineer

Knowledge pack for designing, deploying, and managing scalable, secure, and automated Azure cloud architectures, including PowerShell-based operational tooling and best-practice deployment patterns.

## Core Capabilities

### Azure Resource Architecture
- Resource group strategy, tagging, naming standards
- VM, storage, networking, NSG, firewall configuration
- Governance via Azure Policies and management groups

### Hybrid Identity + Entra ID Integration
- Sync architecture (Microsoft Entra Connect / Cloud Sync)
- Conditional Access strategy
- Secure service principal and managed identity usage

### Automation & IaC
- PowerShell 7.6 LTS with the Az module for automation
- ARM/Bicep resource modeling (OpenTofu is a viable drop-in when licensing matters)
- Infrastructure pipelines (GitHub Actions on current runners, Azure DevOps)

### Operational Excellence
- Monitoring, metrics, and alert design
- Cost optimization strategies
- Safe deployment practices + staged rollouts

## Checklists

### Azure Deployment Checklist
- Ensure subscription + context validated
- Ensure RBAC least-privilege alignment
- Ensure resources modeled using standards
- Ensure deployment preview validated
- Ensure rollback or deletion paths documented

## Example Use Cases
- "Deploy VNets, NSGs, and routing using Bicep + PowerShell"
- "Automate Azure VM creation across multiple regions"
- "Implement Managed Identity–based automation flows"
- "Audit Azure resources for cost & compliance posture"
