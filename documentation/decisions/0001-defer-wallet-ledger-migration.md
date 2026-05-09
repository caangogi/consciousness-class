# ADR-0001 · Defer Wallet ledger migration to a dedicated sprint

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-05-09 |
| **Decided by** | caangogi (PM) + Claude Code (advisor) |
| **Supersedes** | — |
| **Affects** | Fase 0 scope · Fase 3 (referidos/payouts) · all future webhook work |

## Context

During Fase 0 *saneamiento*, while planning **T0.3 — unify Stripe webhooks**, we audited the two existing handlers (`src/app/api/webhooks/stripe/route.ts` "principal" and `src/app/api/checkout/webhook/route.ts` "dup") expecting one to be dead code we could safely delete.

**Audit result: they are NOT redundant.** They implement two different financial architectures:

| Aspect | Principal `webhooks/stripe/` | Dup `checkout/webhook/` |
|---|---|---|
| Stripe events handled | 5 (checkout + 3× subscription + invoice) | 1 (checkout only) |
| Idempotency guard | ✅ added in F1.4b | ❌ |
| Balance update pattern | Direct mutation of `usuarios.balance*` | **Ledger** — appends a `WalletTransactionEntity` to a `wallets` collection; balance is derived |
| Alignment with PM decision **D1** ("Wallet entidad dedicada") | ❌ legacy | ✅ exactly this |

The "dup" is in fact the *target architecture* (ledger pattern, source-of-truth in Wallet) that we committed to with D1 during the Sprint Foundation planning session. The "principal" is the legacy direct-mutation path that pre-dates D1.

## Decision

**We close Fase 0 with the saneamiento that does NOT depend on this resolution:**

- ✅ T0.1 — Wallet extracted from `finance/` to its own backend domain `src/backend/wallet/` (D1 step 1: the entity now lives in the right place, regardless of which webhook writes to it)
- ✅ T0.2 — orphan `src/backend/referral/` removed (was dead code)
- ✅ Out-of-band cleanup — hardcoded `caangogi@gmail.com` superadmin backdoor removed under TDD-strict (`d647639` RED → `f2d4bfa` GREEN)
- ✅ F1.4b (already shipped during Sprint Foundation) — idempotency guard on the principal webhook prevents the most obvious double-charge class of bugs

**We defer to a dedicated future sprint ("Wallet Ledger Migration"):**

- ⏸ T0.3 — webhook unification
- ⏸ T0.4 — Firestore migration of `usuarios.balance*` → wallet ledger transactions
- ⏸ T0.5 — post-saneamiento smoke E2E for the unified flow

## Why defer (rationale)

1. **Out of scope.** Fase 0 was framed as "saneamiento" — convergence of obvious duplication. A migration of two production-touching webhooks to a different architecture is a feature-sized change, not a saneamiento.

2. **Risk-to-value ratio.** The migration touches the critical-path of money movement. It needs:
   - Real Stripe test-mode end-to-end coverage (we only have a smoke E2E today; F1.7 doesn't exercise checkout)
   - A migration plan for in-flight balances already accumulated in `usuarios.balance*`
   - A dual-write transitional period or feature flag (otherwise we lose historical commission data)
   - A reprocess strategy for past events to backfill wallet transactions
   None of these were planned for Fase 0.

3. **Nothing downstream is blocked.** Fases 3 (referidos/payouts), 4.1 (email transactional), 5.1 (booking close) and 6.x (AI features) all build on top of the principal webhook + `usuarios.balance*` as it stands today. The only thing that changes when we migrate is the *internal source-of-truth* for balances — the API surface to other modules stays identical.

4. **Idempotency already shipped.** The most dangerous failure mode (Stripe re-deliveries causing double-commissions) is already mitigated by F1.4b on the principal webhook. The dup webhook is rarely exercised in practice (different event subset) and Stripe Dashboard typically only points to one webhook URL per project.

## Consequences

### Positive

- Fase 0 ships clean and unblocks Fase 3 / 4 / 5 / 6 immediately.
- The ADR creates auditable record of *why* the dup webhook is still there — future contributors won't be tempted to "just delete it" and silently regress D1.
- The Wallet module at `src/backend/wallet/` is the agreed home — when the migration sprint happens, the destination is already in place.

### Negative

- Two webhook code paths live in production. They register the same Stripe signing secret, so in principle Stripe can deliver to either. Today the deployment uses only the principal URL — but that fact is fragile; it depends on Stripe Dashboard config that is not in version control.
- Balance source-of-truth remains fragmented: `usuarios.balance*` (writes via principal) vs `wallets.{transactions,totals}` (writes via dup, currently never invoked in prod). Until the migration sprint, **do not** wire any new feature to read `wallets` directly.
- `documentation/index.html` roadmap shows Fase 0 as "60% done with deferred items" — visible asterisk on the plan.

### Neutral / forward-looking

- Future sprint **"Wallet Ledger Migration"** must be planned with its own PRD before any code lands. Suggested scope:
  1. Decide canonical write path: migrate principal to ledger writes (preferred) vs migrate dup to cover missing event types
  2. Migration script for in-flight balances (`usuarios.balance*` → `wallets.transactions` backfilled with `type: 'historical_balance_seed'`)
  3. Dual-read window (read both, prefer ledger, log mismatches) before flipping reads
  4. Feature flag for the new write path
  5. Full Stripe test-mode E2E covering: checkout / subscription create / subscription invoice cycle / refund
  6. Eventual delete of the legacy webhook + the legacy balance fields on UserEntity

## Operational notes

- Stripe Dashboard webhook URL is currently pointed at `/api/webhooks/stripe` (the principal). **Do not change this in the dashboard without coordinating** — switching to `/api/checkout/webhook` would silently start writing to the wallet ledger AND stop processing subscriptions/invoices.
- Any new webhook handler additions go to the principal until the migration sprint runs.
- The `wallets` Firestore collection is currently a sleeping store — no cron/job reads from it, no UI surfaces it. Safe to leave untouched.

## References

- Roadmap viewer: `documentation/index.html` § Fase 0
- Testing strategy: `documentation/testing-strategy.md` (TDD-strict applies to the eventual migration code)
- Idempotency entity introduced in F1.4b: `src/backend/payments/domain/entities/processed-stripe-event.entity.ts`
- Wallet module (target): `src/backend/wallet/`
