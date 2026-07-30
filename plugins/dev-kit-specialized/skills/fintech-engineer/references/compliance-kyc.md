# Compliance & KYC/AML

## Program Structure

A KYC/AML program typically layers four components — treat them as distinct controls, not one blended step:

1. **Customer Identification Program (CIP)** — collect and verify identity at onboarding (name, address, date of birth, government ID number, for entities: formation documents and beneficial ownership).
2. **Customer Due Diligence (CDD)** — risk-rate the customer and understand the expected nature/purpose of the relationship.
3. **Enhanced Due Diligence (EDD)** — deeper scrutiny for higher-risk customers (PEPs, high-risk jurisdictions, unusual transaction patterns, cash-intensive businesses).
4. **Ongoing monitoring** — the relationship is re-assessed continuously, not just at onboarding; risk ratings and required diligence should change as behavior does.

## Identity Verification

- Document verification: government ID authenticity checks (security features, tamper detection), often combined with a liveness/selfie check to bind the document to the person presenting it.
- Database/registry verification: cross-check submitted identity data against authoritative sources (credit bureaus, government databases) rather than trusting self-reported data alone.
- For entities: verify formation documents, good standing, and — critically — **beneficial ownership** (natural persons who ultimately own or control the entity, typically at a 25% ownership threshold in many jurisdictions, though the exact threshold varies by regulation — verify against the current rule in your jurisdiction rather than assuming 25%).
- Risk-tier verification depth: a low-value, low-risk consumer account can use lighter-weight verification than a high-value commercial account or one in a higher-risk jurisdiction.

## Screening

- **Sanctions screening** — check against sanctions lists (e.g. OFAC's SDN list in the US, and equivalent lists in other jurisdictions) before onboarding and on an ongoing basis, since lists update continuously.
- **PEP (Politically Exposed Person) screening** — identify customers who hold or are closely associated with prominent public positions; PEP status triggers EDD, not automatic rejection.
- **Adverse media screening** — check for negative news associated with the customer (fraud, financial crime, regulatory action) as a supplementary signal alongside list-based screening.
- Screening is not one-and-done: rescreen the existing customer base whenever list updates land, not only at onboarding.
- False-positive management matters operationally — fuzzy name matching against sanctions lists generates high false-positive rates; build a review workflow that clears benign matches efficiently rather than blocking legitimate customers.

## Transaction Monitoring

- Monitor for patterns associated with money laundering: structuring (splitting transactions to stay under reporting thresholds), rapid movement of funds ("layering"), transactions inconsistent with the customer's stated profile, and velocity anomalies.
- Rule-based monitoring (thresholds, velocity limits, geographic risk rules) catches known patterns; combine with behavioral/ML-based scoring for patterns that don't fit a fixed rule.
- Every alert needs a documented disposition (cleared, escalated, filed) — an alert with no resolution trail is itself a compliance gap.

## Regulatory Reporting

- **Suspicious Activity Reports (SARs)** — filed with the relevant financial intelligence unit (e.g. FinCEN in the US) when activity is suspected of being related to money laundering or other financial crime. SAR filings and their underlying facts are confidential — do not disclose to the customer that a SAR was filed ("tipping off" is itself a violation in most regimes).
- **Currency Transaction Reports (CTRs)** — filed for cash transactions above a jurisdiction-defined threshold (US: $10,000), regardless of suspicion.
- Filing deadlines are typically short (often 30 days from detection for SARs) — the detection-to-filing pipeline needs to be operationally reliable, not ad hoc.
- Recordkeeping: retain KYC records, transaction records, and filed reports for the retention period your regulator mandates (commonly 5 years, but verify against the applicable regime — don't assume a single global number).

## Risk-Based Approach

- Not every customer or transaction warrants the same scrutiny. Build an explicit risk model (customer risk × product risk × geographic risk × channel risk) and calibrate diligence depth to the resulting tier.
- Higher-risk tiers get more frequent re-verification and lower alert thresholds; document the rationale for tiering so it's defensible in an audit.
- A risk-based program is not a lighter program — regulators expect you to demonstrate the risk assessment itself, not just its conclusions.

## Data Privacy Intersection

- KYC collection inherently gathers sensitive personal data (government ID numbers, biometric liveness data in some flows) — this intersects with privacy regulation (GDPR, CCPA/CPRA, and sector-specific rules) on retention, purpose limitation, and subject access/erasure rights.
- Erasure/right-to-be-forgotten requests conflict with AML recordkeeping mandates in most regimes — the resolution is typically that the regulatory retention obligation overrides erasure for the mandated retention window, but confirm this against current guidance rather than assuming; don't silently delete records a regulator expects you to keep.
- Treat KYC data (especially document images and biometric templates) as a distinct, more sensitive data class in your security architecture — narrower access, stronger encryption, tighter audit logging than general application data.

## Cross-Border Considerations

- AML regimes are jurisdiction-specific; a program built for one regulator's rules (thresholds, reporting forms, retention periods) does not automatically satisfy another's. Verify locally rather than assuming a US-centric or EU-centric default applies globally.
- The Financial Action Task Force (FATF) sets international standards that most national regimes implement with local variation — useful as a baseline mental model, not as a substitute for the local rule.
- Correspondent banking and cross-border payment rails add another layer of due diligence (know-your-correspondent) beyond direct customer KYC.

## Common Mistakes

- Treating KYC as a one-time onboarding gate instead of an ongoing, risk-recalibrated process.
- Screening only at onboarding and missing sanctions-list updates against the existing customer base.
- No documented disposition trail for monitoring alerts.
- Assuming a single global threshold/retention period instead of verifying the applicable jurisdiction's rule.
- Tipping off a customer that a SAR was filed.
