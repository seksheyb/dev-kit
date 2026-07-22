# Payment Systems

## Transaction Lifecycle

1. **Authorization** — cardholder/payer intent captured, funds availability confirmed, hold placed. No funds move yet.
2. **Capture** — merchant confirms the goods/service was fulfilled; converts the authorization into a request to collect funds. May be immediate (auth+capture) or delayed (auth now, capture later, subject to auth-expiry windows — typically 5-7 days for card networks).
3. **Clearing** — acquirer and issuer exchange transaction records through the card network (or ACH operator, RTP network, etc.).
4. **Settlement** — funds actually move between issuing and acquiring banks; merchant is paid out net of interchange/scheme/processor fees.
5. **Reconciliation** — settlement reports matched against internal transaction and ledger records; discrepancies investigated before books close.

Design every integration so authorization, capture, and settlement are separately observable and independently retryable — collapsing them into one step makes partial failures unrecoverable.

## Idempotency

- Every state-changing payment request carries a client-generated idempotency key.
- The key is scoped to the operation (a capture and a refund need separate keys even on the same transaction).
- Store `(idempotency_key → response)` with a TTL long enough to cover realistic retry storms (24h is a common floor).
- Replays with the same key AND same payload return the original response; same key with a different payload is a conflict (409), not a silent overwrite.
- Idempotency handles client-side retries; it does not replace distributed locking for concurrent requests racing on the same resource.

## Gateway Integration Patterns

- **Direct API integration** — full control over UX, full PCI scope exposure. Use tokenization (below) to shrink scope even here.
- **Hosted fields / Elements** — card data typed into gateway-hosted iframes; your servers never see raw PAN. Standard choice for reducing PCI SAQ level.
- **Hosted checkout redirect** — lowest integration effort, lowest PCI burden, least UX control.
- Gateway API versions are typically date-stamped per release (e.g. a provider's API pinned to a specific dated version string) rather than semver — pin the version explicitly in requests and treat "latest" as a moving target; check current docs for the exact format your provider uses.

## Tokenization & Card Data Scope

- Never store raw PAN, CVV, or track data. Exchange raw card data for a gateway- or network-token immediately at capture time.
- Network tokenization (card-network-issued tokens, distinct from gateway tokens) survives card reissuance (lost/stolen replacement) and reduces interchange in some programs — prefer it for stored-credential/subscription flows.
- Treat tokens as bearer credentials: scope them to merchant + customer, and never log them in plaintext application logs.

## Strong Customer Authentication / 3-D Secure

- 3DS2 (EMV 3-D Secure) shifts liability for authorized fraud from merchant to issuer when a challenge is completed successfully, and supports frictionless (risk-based, no challenge) flows using contextual signals.
- Regions with SCA mandates (e.g. PSD2 in the EU/UK) require 3DS or an equivalent strong-auth exemption for most card-not-present transactions; check current regional mandates before assuming a transaction is exempt.
- Exemptions (low-value, low-risk, recurring/MIT, trusted-beneficiary) reduce friction but shift liability back to the merchant if fraud occurs — model this trade-off explicitly, don't apply exemptions blindly.

## Webhooks & Async Events

- Payment state changes (capture confirmed, dispute opened, payout sent) arrive asynchronously — design the system as event-driven from day one rather than polling.
- Verify webhook signatures against the provider's signing secret before trusting the payload.
- Webhook delivery is at-least-once: handlers must be idempotent (key off the event ID, not just the payment ID).
- Treat a missing/delayed webhook as a signal to reconcile via API polling, not as proof the event didn't happen.

## Multi-Currency & FX

- Store amounts as integer minor units (cents) in the transaction's settlement currency; never use floating point for money.
- Presentment currency (what the customer sees) and settlement currency (what the merchant is paid in) can differ — record both plus the FX rate and rate timestamp used.
- Dynamic currency conversion (DCC) offered at checkout has separate disclosure and consent requirements in many jurisdictions.

## Chargebacks & Disputes

- Distinguish **retrieval requests** (issuer asking for documentation, no funds movement yet) from **chargebacks** (funds already reversed) from **pre-arbitration/arbitration** (escalated disputes).
- Track dispute reason codes per network — the required evidence differs by code (fraud vs. product-not-received vs. duplicate processing, etc.).
- Chargeback response windows are short (often 7-20 days depending on network); automate evidence assembly rather than handling case-by-case.
- Feed chargeback outcomes back into the fraud model — they're a labeled ground-truth signal.

## PCI DSS Scope Management

- Target **PCI DSS v4.0.1** specifically — as of 2026 all v4.0 requirements, including the previously future-dated set, are mandatory; assessments should not cite bare "v4.0" or the retired v3.2.1.
- The fastest way to shrink scope is to never touch raw cardholder data: hosted fields, tokenization, and redirect-based checkout all reduce your SAQ (Self-Assessment Questionnaire) level.
- Segment the cardholder data environment (CDE) on its own network segment; scope creep from an unsegmented network is the most common audit failure.
- Compliance is continuous, not a point-in-time certificate — quarterly ASV scans and annual penetration tests are ongoing obligations, not one-off gates.

## Settlement & Reconciliation

- Reconcile at three levels: gateway/processor report vs. internal ledger vs. bank statement. A match at only one level hides errors at the others.
- Batch settlement files should be idempotently importable — re-running an import on the same file must not double-post.
- Flag and quarantine unmatched items (settlement without a matching authorization, or vice versa) rather than force-matching by amount alone.
