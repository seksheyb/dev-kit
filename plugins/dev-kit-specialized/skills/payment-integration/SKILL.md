---
name: payment-integration
description: "Use when the task involves payment integration — payment gateways, transaction processing, subscription billing, PCI DSS v4.0.1 compliance, tokenization, fraud prevention, webhooks, refunds/chargebacks, or multi-currency support."
---

# Payment Integration

Knowledge pack for implementing secure, compliant payment systems: gateway integration, transaction processing, subscription management, and fraud prevention with emphasis on PCI compliance and reliability.

## Approach

1. Establish payment requirements and business model: payment methods, currencies, compliance requirements, transaction volumes, fraud concerns
2. Review existing payment flows, compliance needs, and integration points
3. Analyze security requirements, fraud risks, and optimization opportunities
4. Implement secure, reliable payment solutions

## Payment Integration Checklist

- PCI DSS v4.0.1 compliance verified (all requirements are mandatory as of 2026, including the formerly future-dated ones — do not assess against v3.2.1 or unversioned "v4")
- Transaction success > 99.9% maintained
- Processing time < 3s achieved
- Zero payment data storage ensured
- Encryption implemented properly
- Audit trail complete thoroughly
- Error handling robust consistently
- Compliance documented accurately

## Payment Gateway Integration

- API authentication
- Transaction processing
- Token management
- Webhook handling
- Error recovery
- Retry logic
- Idempotency
- Rate limiting

## Payment Methods

- Credit/debit cards
- Digital wallets
- Bank transfers
- Instant payment rails (SEPA Instant, FedNow, RTP — check regional mandate vs. opt-in status)
- Cryptocurrencies
- Buy now pay later
- Mobile payments
- Offline payments
- Recurring billing

## PCI Compliance

- PCI DSS v4.0.1 scope assessment (SAQ type, all requirements mandatory as of 2026)
- Data encryption
- Tokenization (including network tokenization, not just PCI-scoped vaulting)
- Secure transmission
- Access control
- Network security
- Vulnerability management
- Security testing
- Compliance documentation

## Transaction Processing

- Authorization flow
- Capture strategies
- Void handling
- Refund processing
- Partial refunds
- Currency conversion
- Fee calculation
- Settlement reconciliation

## Subscription Management

- Billing cycles
- Plan management
- Upgrade/downgrade
- Prorated billing
- Trial periods
- Dunning management
- Payment retry
- Cancellation handling

## Fraud Prevention

- Risk scoring
- Velocity checks
- Address verification
- CVV verification
- 3D Secure
- Passkey/FIDO2 checkout authentication (reduces CNP fraud, complements or replaces OTP-based SCA)
- Machine learning
- Blacklist management
- Manual review

## Multi-Currency Support

- Exchange rates
- Currency conversion
- Pricing strategies
- Settlement currency
- Display formatting
- Tax handling
- Compliance rules
- Reporting

## Webhook Handling

- Event processing
- Reliability patterns
- Idempotent handling
- Queue management
- Retry mechanisms
- Event ordering
- State synchronization
- Error recovery

## Compliance and Security

- PCI DSS v4.0.1 requirements (all mandatory as of 2026; do not assess against v3.2.1 or an unversioned "v4")
- EU PSD3/PSR readiness (final compromise texts published 2026; PSR/PSD3 repeal PSD2 and EMD2, applying EU-wide roughly 21 months after the PSR enters into force — track the transposition timeline for any EU-facing flow)
- Instant payment rails (SEPA Instant is now mandatory for EU PSPs to receive and, on a phased basis, send; FedNow remains adoption-optional per US institution — do not assume parity across regions)
- 3D Secure implementation
- Strong Customer Authentication
- Passkey-based checkout authentication (FIDO2/WebAuthn passwordless flows increasingly offered alongside or instead of OTP-based SCA)
- Network tokenization (card-network tokens, distinct from and often layered with PCI-scoped token vaulting; pairs with passkeys for click-to-pay)
- Token vault setup
- Encryption standards
- Fraud detection
- Chargeback handling
- KYC integration

## Reporting and Reconciliation

- Transaction reports
- Settlement files
- Dispute tracking
- Revenue recognition
- Tax reporting
- Audit trails
- Analytics dashboards
- Export capabilities

## Workflow

### 1. Requirements Analysis

Analysis priorities: business model review, payment method selection, compliance assessment, security requirements, integration planning, cost analysis, risk evaluation, platform selection.

Requirements evaluation: define payment flows, assess compliance needs, review security standards, plan integrations, estimate volumes, document requirements, select providers, design architecture.

### 2. Implementation

Implementation approach: gateway integration, security implementation, testing setup, webhook configuration, error handling, monitoring setup, documentation, compliance verification.

Integration patterns: security first, compliance driven, user friendly, reliable processing, comprehensive logging, error resilient, well documented, thoroughly tested.

### 3. Production Readiness

Excellence checklist: compliance verified, security audited, performance optimal, reliability proven, fraud prevention active, reporting complete, documentation thorough.

## Integration Patterns

- Direct API integration
- Hosted checkout pages
- Mobile SDKs
- Webhook reliability
- Idempotency handling
- Rate limiting
- Retry strategies
- Fallback gateways

## Security Implementation

- End-to-end encryption
- Tokenization strategy
- Secure key storage
- Network isolation
- Access controls
- Audit logging
- Penetration testing
- Incident response

## Error Handling

- Graceful degradation
- User-friendly messages
- Retry mechanisms
- Alternative methods
- Support escalation
- Transaction recovery
- Refund automation
- Dispute management

## Testing Strategies

- Sandbox testing
- Test card scenarios
- Error simulation
- Load testing
- Security testing
- Compliance validation
- Integration testing
- User acceptance

## Optimization Techniques

- Gateway routing
- Cost optimization
- Success rate improvement
- Latency reduction
- Currency optimization
- Fee minimization
- Conversion optimization
- Checkout simplification

Always prioritize security, compliance, and reliability while building payment systems that process transactions seamlessly and maintain user trust.
