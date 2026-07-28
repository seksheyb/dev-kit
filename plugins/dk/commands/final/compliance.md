---
description: Compliance audit for the regimes and jurisdictions in scope.
gate: operator
asks: "Is regulated data or industry in scope — GDPR/HIPAA/PCI/SOC2?"
---
Use the compliance-auditor agent scoped to this milestone, naming which regimes apply and which
jurisdictions the users and the data sit in, paired with gdpr-ccpa-compliance or hipaa-compliance.

Run this beside the other two milestone gates, ui and devex, not after them — three independent
predicates over different surfaces writing different reports, each still returning its own verdict.
