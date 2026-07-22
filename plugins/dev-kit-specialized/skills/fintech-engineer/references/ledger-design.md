# Ledger Design

## Double-Entry as the Foundation

Every financial event posts as two or more balanced entries (debits = credits) across accounts. This is not bookkeeping ceremony — it is the invariant that makes a ledger self-checking: if debits and credits ever diverge, you have a bug, not just an accounting curiosity.

- Model a **journal entry** (the atomic, immutable unit of posting) containing two or more **postings** (account, amount, direction).
- A journal entry either posts in full or not at all — never partially post one side of an entry.
- Reject any entry where the sum of debits ≠ sum of credits, at write time, not at reconciliation time.

## Immutability & Append-Only

- Ledger entries are never updated or deleted once posted. Corrections are new, reversing entries that reference the original.
- This gives you a complete, tamper-evident audit trail for free — "what did the balance look like as of last Tuesday" is just a query over immutable history, not a snapshot you hoped to have kept.
- If a posting was wrong, post a reversal plus a corrected entry; both remain visible forever. Never mutate history to "fix" it.

## Chart of Accounts

- Structure accounts by type: assets, liabilities, equity, revenue, expense — and within fintech specifically, separate **customer-owned funds** (a liability to the customer) from **company-owned funds** (an asset/revenue to the business). Conflating the two is the single most common ledger-design mistake in payments products.
- Use a hierarchical account structure (e.g. `liabilities:customer:<account_id>:available`, `liabilities:customer:<account_id>:held`) so balance queries can roll up or drill down without schema changes.
- Model holds/reserves as their own sub-accounts, not as a flag on the main balance — a held amount and an available amount are different claims on the same funds and should be independently auditable.

## Balances Are Derived, Not Stored (or Cached Carefully)

- The authoritative balance is the sum of postings to an account as of a point in time — compute it from the journal, don't treat a mutable "balance" column as the source of truth.
- For performance, maintain a cached/materialized balance updated transactionally alongside each posting, but always be able to rebuild it from the journal and treat divergence as a hard error requiring investigation, not a value to just overwrite.
- Running balance snapshots (checkpoints) are an optimization for query speed, not a substitute for the append-only journal.

## Precision & Representation

- Store amounts as integers in the smallest unit of the currency (cents, not dollars) to eliminate floating-point rounding errors. Never use `float`/`double` for money.
- Track currency alongside every amount; a "1000" with no currency code is not a valid financial fact.
- For currencies with non-decimal or unusual minor-unit conventions, don't assume 2 decimal places universally — look up the ISO 4217 minor unit for each currency rather than hardcoding.

## Idempotency & Concurrency

- Every journal entry has a unique, client- or system-supplied idempotency key; replaying the same key returns the original result rather than double-posting.
- Use database-level constraints (unique index on idempotency key, check constraint on debit=credit balance where feasible) as a backstop — application-layer checks alone will eventually race.
- Serialize concurrent postings to the same account (row-level lock or optimistic concurrency with retry) to prevent lost-update balance corruption under load.

## Event Sourcing & CQRS Fit

- A ledger is naturally an event-sourced system: the journal *is* the event log. Read models (account balances, statements, dashboards) are projections rebuilt from that log.
- CQRS separates the write path (append journal entries, enforce invariants) from the read path (fast balance/statement queries against a projection) — don't force reads through the same contention point as writes.
- Because the journal is immutable and complete, projections can always be rebuilt from scratch — treat that as a required capability, not a theoretical one, and test it.

## Reconciliation

- Reconcile the internal ledger against external sources of truth (bank statements, processor settlement files, custodian records) on a scheduled cadence, not only when something looks wrong.
- Every reconciliation run should produce three buckets: matched, ledger-only (external record missing), external-only (ledger record missing) — and each unmatched item needs an owner and an SLA to resolve, not just a log line.
- Reconciliation breaks are a leading indicator of ledger bugs; treat a rising unmatched count as a production incident signal, not routine noise.

## Multi-Currency Ledgers

- Each account has a home currency; cross-currency movements post through an explicit FX conversion entry (source currency out, FX gain/loss account, destination currency in) rather than silently converting inline.
- Record the FX rate and its timestamp/source on the conversion entry itself — rates drift, and you need to reproduce exactly what rate was used for any historical entry.

## Common Mistakes

- Storing a single mutable `balance` field as the only representation of an account's state (no audit trail, no way to detect corruption).
- Using floats for currency amounts.
- Allowing partial posting of a journal entry (one side succeeds, the other fails, no atomic transaction wrapping both).
- Deleting or editing historical entries instead of reversing them.
- Conflating customer-owned liability accounts with company revenue/asset accounts.
