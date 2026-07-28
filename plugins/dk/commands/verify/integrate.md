---
description: Integration check, then the Nyquist validation audit. ESCALATED items go back to step 8.
argument-hint: "[NN]"
gate: auto
precondition: "! test \"$PHASE\" = first"
asks: "Skip integration-checker on the milestone's first phase; run nyquist-auditor only if verify reported validation gaps."
---
Dispatch the integration-checker agent for phase <NN>, whether or not verify found gaps. Then, and
only once it has returned, the nyquist-auditor agent for the same phase, passing verify's
validation_gaps as <gaps>. Hand every ESCALATED item back to step 8 as build work.
