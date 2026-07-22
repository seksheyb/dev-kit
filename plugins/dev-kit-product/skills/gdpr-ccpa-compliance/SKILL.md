---
name: gdpr-ccpa-compliance
description: Use when assessing GDPR or CCPA/CPRA compliance, reviewing data practices, or evaluating privacy requirements for a product. Invoke for privacy gap assessments, data subject rights implementation, consent flows, and privacy compliance checklists. Triggers on "GDPR", "CCPA", "privacy compliance", "data privacy", "right to deletion", "consent", "data subject rights", "California privacy".
license: MIT
metadata:
  version: "1.0.0"
  domain: privacy-compliance
  triggers: GDPR, CCPA, CPRA, privacy compliance, data privacy, consent, data subject rights, right to deletion, DSR, DPA, privacy policy
  role: specialist
  scope: audit
  output-format: report
  related-skills: hipaa-compliance, security-reviewer, secure-code-guardian
---

# GDPR / CCPA Compliance

Privacy compliance methodology covering GDPR (EU) and CCPA/CPRA (California). Understand obligations, implement compliant data practices, and close compliance gaps before they become violations.

## GDPR (General Data Protection Regulation)

### Key Principles
1. **Lawfulness, Fairness, Transparency**: Must have a legal basis for processing
2. **Purpose Limitation**: Only collect data for specified, explicit purposes
3. **Data Minimization**: Collect only what's necessary
4. **Accuracy**: Keep data accurate and up-to-date
5. **Storage Limitation**: Don't keep data longer than necessary
6. **Integrity and Confidentiality**: Secure the data
7. **Accountability**: Document and demonstrate compliance

### Legal Bases for Processing (Must have ONE)
- **Consent**: Freely given, specific, informed, unambiguous
- **Contract**: Processing necessary to fulfill a contract with the user
- **Legal Obligation**: Required by law
- **Vital Interests**: Life-threatening situations
- **Public Task**: Performing a task in the public interest
- **Legitimate Interests**: Balanced against user rights (cannot override fundamental rights)

### Data Subject Rights (Must Support All)
- **Right to Access**: Users can request all data held about them
- **Right to Erasure ("Right to be Forgotten")**: Delete personal data on request
- **Right to Rectification**: Correct inaccurate data
- **Right to Portability**: Provide data in machine-readable format
- **Right to Restriction**: Restrict processing in certain circumstances
- **Right to Object**: Object to processing based on legitimate interests

### GDPR Product Checklist
- [ ] Privacy notice is clear, specific, and accessible
- [ ] Consent flows are clear, non-pre-ticked, easily withdrawable
- [ ] Cookie banner meets requirements (opt-in for non-essential cookies)
- [ ] Data Subject Request (DSR) process exists and is tested
- [ ] Data retention policies documented and enforced
- [ ] Data Processing Agreements (DPAs) with all processors
- [ ] Data breach notification process ready (72-hour window to supervisory authority)
- [ ] Data Protection Officer (DPO) appointed if required
- [ ] Privacy by Design built into new features

**Watch item:** the EU's proposed "Digital Omnibus" package (Nov 2025) would narrow Art. 13-15
transparency/access obligations and merge breach reporting with NIS2. Not yet law (adoption
expected late 2026, effect ~2027-2028) — don't treat current text as final, but don't rewrite
requirements against a proposal either.

---

## CCPA (California Consumer Privacy Act) / CPRA

### Who It Applies To
Businesses that meet ANY ONE of:
- Annual revenue > $25M
- Buy/sell/receive data of >= 100,000 California consumers per year
- Derive >= 50% of revenue from selling personal information

### Consumer Rights Under CCPA/CPRA
- **Right to Know**: What data is collected and how it's used
- **Right to Delete**: Request deletion of personal data
- **Right to Opt-Out**: Stop sale of personal information ("Do Not Sell or Share My Personal Information" link required)
- **Right to Non-Discrimination**: Cannot be penalized for exercising rights
- **Right to Correct** (CPRA addition)
- **Right to Limit Use of Sensitive Personal Information** (CPRA addition)

### CCPA Product Checklist
- [ ] Privacy policy updated with CCPA-required disclosures
- [ ] "Do Not Sell or Share My Personal Information" link on homepage
- [ ] Consumer request intake process (web form or email)
- [ ] 45-day response window for consumer requests
- [ ] Data inventory completed: what data, where, for what purpose
- [ ] Vendor contracts updated with CCPA service provider language

### CPRA 2026 Regulations Checklist (effective Jan 1, 2026)
- [ ] Risk assessments completed before high-risk processing (selling/sharing PI, sensitive PI,
      ADMT for significant decisions) — required starting Jan 1, 2026
- [ ] Automated Decision-Making Technology (ADMT) notice + opt-out/appeal rights implemented for
      consumers subject to significant decisions (employment, lending, healthcare, etc.) —
      ADMT-specific compliance deadline Jan 1, 2027
- [ ] Cybersecurity audits scheduled if processing personal information at scale

### Beyond California
CCPA/CPRA is not the only US law in scope. By 2026, roughly 20 states have comprehensive
consumer privacy laws in effect, including Virginia, Colorado, Texas, Connecticut, Oregon, and
2026 additions like Indiana, Kentucky, and Rhode Island. Most follow a Virginia/Colorado opt-out
model with their own automated-decision and profiling opt-out provisions (Colorado and Texas
notably). Confirm which state laws apply to the target user base — don't assess against CCPA
alone.

---

## GDPR vs. CCPA Quick Comparison

| | GDPR | CCPA/CPRA |
|---|---|---|
| Scope | EU residents | California residents |
| Consent model | Opt-in required (for most processing) | Opt-out model (except minors) |
| Data sales | N/A as a category | Specific opt-out right |
| Penalties (regulatory) | Up to 4% of global annual revenue | Administrative fines via CPPA/AG action: up to $2,663 per violation (unintentional) / $7,988 per violation (intentional or involving a minor's data); CPI-adjusted every odd year, next in Jan 2027 |
| Penalties (private right of action) | N/A — GDPR has no private right of action | Statutory damages for qualifying data breaches only: $107-$799 per consumer per incident (or actual damages if greater), separate from and not capped by the regulatory fine track |
| Breach notification | 72 hours to supervisory authority | ASAP; state law separate |

## Output Format

Deliver:
- Compliance gap assessment against checklist
- Priority action items ranked by risk
- Data subject rights implementation plan
- Documentation requirements list
