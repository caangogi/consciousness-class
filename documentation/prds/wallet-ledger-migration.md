# PRD · Wallet Ledger Migration Sprint

| | |
|---|---|
| **Status** | Draft (awaiting PM sign-off on §3 decisions before W1 starts) |
| **Owner** | caangogi |
| **Author** | Claude Code |
| **Created** | 2026-05-09 |
| **Estimated duration** | ~6 calendar sprints (2 weeks each) |
| **Supersedes (when shipped)** | ADR-0001 |
| **Critical path?** | No for Fases 4/5/6 · YES for Fase 3 (Stripe Connect referrals + payouts depend on a clean ledger) |

> **Read first:** [`documentation/decisions/0001-defer-wallet-ledger-migration.md`](../decisions/0001-defer-wallet-ledger-migration.md). This PRD is the operational follow-up to that ADR.

---

## 1 · Why this exists

Today the platform has two **financial data stores** living in parallel and one of them is dormant:

```mermaid
graph LR
    Stripe[Stripe webhook event] --> P[/api/webhooks/stripe<br/>PRINCIPAL]
    Stripe -.unused.-> D[/api/checkout/webhook<br/>DUP - dormant]
    P -->|writes| U[(usuarios.balance*<br/>direct mutation)]
    D -.would write.-> W[(wallets.transactions<br/>ledger)]
    classDef dormant fill:#f4d6d6,stroke:#8b3838;
    class D,W dormant;
```

**Symptoms:**
- Single source of truth for balances is `usuarios.balance*` (mutable scalar fields). The `wallets` collection exists with a clean ledger schema but is never written to in production.
- Refunds are not modeled (today: nobody touches the balance back when Stripe issues a refund — the affiliate keeps a commission on a charge that no longer exists).
- Subscription/invoice cycles call `userRepository.updateCreatorPendingRevenue` directly, bypassing any audit trail of *why* the balance changed.
- The two webhook handlers are both registered code paths but only one is wired to Stripe Dashboard — fragile (depends on dashboard config not in version control).

**This sprint converges to the target architecture (D1):** single Stripe webhook → ledger writes → balance derived from ledger sum. Refund-aware. Audit-trail by construction.

---

## 2 · Goals & non-goals

### Goals
- **G1** Single canonical source of truth for balances: the wallet ledger (`wallets/{uid}/transactions/{txId}` collection structure).
- **G2** Single Stripe webhook handler in production. The dormant one is removed.
- **G3** Zero data loss during migration. All historical balances in `usuarios.balance*` are backfilled into the ledger as `type: 'historical_balance_seed'` transactions.
- **G4** Refund-aware accounting. A Stripe refund event produces a ledger transaction that nets the original sale, plus a clawback transaction against any affiliate commission paid on that charge.
- **G5** Idempotency preserved end-to-end (the F1.4b guard continues to work; ledger writes are themselves idempotent by transaction id).
- **G6** All callers of `userRepository.balance*` migrated to `walletService.getBalance()`.
- **G7** `usuarios.balance*` fields removed from `UserEntity` schema after a 90-day grace period.

### Non-goals
- New balance-driven features (payout flows, withdrawal UI, etc — those belong to Fase 3).
- Multi-currency conversion (we keep `currency` per transaction; conversion is later).
- Multi-account wallets per user (one wallet per UID for now).
- Performance optimization of ledger reads (the `wallets/{uid}/totals` cache document handles this; if it doesn't perform, that's a separate concern).
- Change of webhook URL in Stripe Dashboard (we keep `/api/webhooks/stripe`; only its internals change).

---

## 3 · Decisions to lock BEFORE W1 starts

These are **PM calls** required as gating items. The sprint cannot begin until each has a recorded decision.

| # | Question | Recommended answer | Reason | Status |
|---|----------|--------------------|--------|--------|
| **D-W1** | Direction of migration: do we migrate the principal handler to ledger-write semantics, or migrate the dup to cover all event types? | **Migrate principal.** | Stripe Dashboard URL stays unchanged. The dup is removed at the end of W5 instead of becoming the canonical handler. | ⏳ open |
| **D-W2** | Backfill transaction type & description for historical seeding. | `type: 'historical_balance_seed'` · `description: 'Backfill from legacy usuarios.balance* on YYYY-MM-DD'` · `relatedStripeChargeId: null` · `sourceAssetId: 'MIGRATION'`. | Distinguishable in queries; cannot collide with real Stripe charges. | ⏳ open |
| **D-W3** | Refund handling: clawback or no-clawback for affiliate commissions on refunded charges? | **Clawback deferred to next payout** — write a negative `type: 'commission_clawback'` transaction that nets at the affiliate's next payout cycle. Do NOT retroactively rewrite past payouts. | Same as the F1.4 plan stated; user's livelihood expectation. | ⏳ open |
| **D-W4** | Dual-read window length before flipping the canonical read path to ledger. | **Minimum 30 days dual-read with mismatch logging. Cutover only after 7 consecutive days with 0 mismatches.** | Conservative for money. | ⏳ open |
| **D-W5** | Cutover style: gradual feature flag rollout vs hard switch. | **Feature flags** (`WALLET_LEDGER_WRITE_ENABLED`, `WALLET_LEDGER_READ_ENABLED`) read from a Firestore `platform_config/wallet_migration` document so they can flip without redeploy. | Instant rollback if anything goes wrong. | ⏳ open |
| **D-W6** | Mismatch tolerance: is a discrepancy of e.g. ±€0.01 acceptable due to historical floor/round behavior? | **No tolerance for new transactions** (post-W2). For backfilled transactions, allow ±€0.01 logged-and-accepted, anything more is investigated. | New code must be exact (we proved we can do this in F1.4a). | ⏳ open |
| **D-W7** | Schema cleanup of `usuarios.balance*` fields: drop after how long post-W5? | **90 days** post-W5 cutover. Keep the field readable (returns ledger-derived value) for backwards compat during this window. | Buffer for any external integrations or data exports we forgot. | ⏳ open |

> **Sign-off mechanism:** PM replaces ⏳ with ✅ + initials + date in this table. Reviewer is allowed to push back; new PRD revision starts if any decision flips.

---

## 4 · Current state (as-is, audited 2026-05-09)

### 4.1 Code paths

| Component | Path | Today's behavior |
|-----------|------|------------------|
| Principal webhook | `src/app/api/webhooks/stripe/route.ts` | Handles `checkout.session.completed` + `customer.subscription.{created,updated,deleted}` + `invoice.payment_succeeded` + `invoice.payment_failed`. Idempotency via F1.4b. Writes via `PaymentOrchestratorService` → `userRepository.update{CreatorPendingRevenue,ReferrerBalance}`, which mutates `usuarios.{uid}.{balanceComisionesPendientes,balanceIngresosPendientes,referidosExitosos}` directly. |
| Dup webhook | `src/app/api/checkout/webhook/route.ts` | Handles ONLY `checkout.session.completed`. NO idempotency. Writes via `FirebaseWalletRepository.processTransaction(WalletTransactionEntity)` to a `wallets` collection with ledger semantics. **Stripe Dashboard does NOT point here.** Dormant. |
| Wallet module | `src/backend/wallet/` | Entity + repo extracted in T0.1 (commit `b0d4cf9`). The repo's `processTransaction` writes one ledger entry. No `WalletService` exists yet — repo is called directly by the dup handler. |
| Read paths to balances | Various | All reads of `usuarios.balanceComisionesPendientes` / `balanceIngresosPendientes` / `balanceCredito` / `referidosExitosos` go through `FirebaseUserRepository`. Grep at sprint start to enumerate exhaustively. `AuthContext.tsx` exposes them on `UserProfile`. |

### 4.2 Data shape

**Legacy (`usuarios.{uid}` document):**
```
{
  ...,
  balanceComisionesPendientes: 124.50,
  balanceIngresosPendientes:   2380.00,
  balanceCredito:                0.00,
  referidosExitosos:            12,
  ...
}
```

**Target (`wallets/{uid}` document + `wallets/{uid}/transactions/{txId}` subcollection):**
```
wallets/{uid} (cache totals, derived):
{
  uid: 'u_42',
  totalEarned:        2380.00,   // sum of type in {sale, subscription_renewal}
  totalCommissions:    124.50,   // sum of type in {commission_tier_1, commission_tier_2}
  totalRefunded:         0.00,
  totalClawback:         0.00,
  pendingPayout:      2504.50,   // = earned + commissions - paidOut - refunded - clawback
  paidOut:               0.00,
  currency: 'eur',
  updatedAt: <ts>
}

wallets/{uid}/transactions/{txId}:
{
  walletId: 'u_42',
  type: 'sale' | 'commission_tier_1' | 'commission_tier_2'
       | 'subscription_renewal' | 'refund' | 'commission_clawback'
       | 'payout' | 'historical_balance_seed',
  amount: 2380.00,                 // signed: positive credit, negative debit
  currency: 'eur',
  sourceAssetId: 'asset_xxx' | null,
  relatedStripeChargeId: 'pi_xxx' | null,
  description: 'Comisión Directa (Nivel 1) por venta de coaching',
  createdAt: <ts>,
}
```

The cache `wallets/{uid}` is **derived** from the transaction subcollection. A consistency check (sum of subcollection equals stored totals) MUST run as part of every test and as a periodic audit job.

### 4.3 Stripe Dashboard config (off-repo, audit before W1)

- Webhook URL: `https://<domain>/api/webhooks/stripe`
- Signing secret: env var `STRIPE_WEBHOOK_SECRET` (single secret used by both handlers because they accept the same secret)
- Subscribed event types: confirm exact list during W1.1 audit. Expected: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`. **If `charge.refunded` is not subscribed, add it before W2** — refund flow needs it.

---

## 5 · Target state (to-be)

```mermaid
graph LR
    Stripe[Stripe webhook event] --> P[/api/webhooks/stripe<br/>only handler]
    P --> Idem[ProcessedStripeEvent guard<br/>F1.4b]
    Idem --> Svc[WalletService.recordTransaction]
    Svc --> Tx[(wallets/uid/transactions<br/>append-only ledger)]
    Tx --> Cache[(wallets/uid<br/>derived totals)]
    Cache -.read.-> API[Other modules read via<br/>walletService.getBalance]
```

- One handler. Idempotent by Stripe event id (F1.4b unchanged) AND by ledger transaction id (no double-write within a single event).
- `usuarios.balance*` fields are gone (after W5 + 90-day grace).
- `WalletService` (new application-layer file) exposes:
  - `recordTransaction(walletId, txInput): Promise<WalletTransaction>`
  - `getBalance(walletId): Promise<BalanceSnapshot>`
  - `listTransactions(walletId, filter?): Promise<WalletTransaction[]>`
  - `processStripeChargeRefunded(stripeChargeId): Promise<void>` (handles the refund + clawback fan-out)

---

## 6 · Migration strategy

5 phases. Each phase ends with a verification gate.

```mermaid
gantt
    title Wallet Ledger Migration Sprint — phase plan
    dateFormat  YYYY-MM-DD
    section Foundation
    W1 Foundation                 :w1, 2026-XX-XX, 14d
    section Dual write
    W2 Dual-write + mismatch log  :w2, after w1, 14d
    section Backfill
    W3 Historical backfill         :w3, after w2, 7d
    section Dual read
    W4 Dual-read + caller migration :w4, after w3, 30d
    section Cutover
    W5 Cutover + cleanup           :w5, after w4, 14d
```

> Calendar dates are placeholders. The sprint kicks off after the §3 decisions are signed off by PM.

### W1 · Foundation (no behavioral change, prep work only)

| ID | Task | Branch | Path | TDD-strict? |
|----|------|--------|------|------------|
| W1.1 | Audit + lock §3 decisions; PM sign-off table updated | `chore/W1.1-prd-signoff` | `documentation/prds/wallet-ledger-migration.md` | n/a |
| W1.2 | Create `WalletService` (application layer) with `getBalance`, `listTransactions`, `recordTransaction`. Unit tests for derivation math. | `feature/W1.2-wallet-service` | `src/backend/wallet/application/wallet.service.ts` + spec | ✅ TDD-strict |
| W1.3 | Migration script `scripts/migrate-balances-to-ledger.ts`: dry-run mode, idempotent (skips if backfill marker already exists), produces a report file `migration-reports/<ts>.json` | `feature/W1.3-migration-script` | `scripts/migrate-balances-to-ledger.ts` | TDD-strict for the pure functions; integration test runs against Firestore emulator |
| W1.4 | Feature flag scaffolding: `src/lib/feature-flags.ts` reads from `platform_config/wallet_migration` Firestore doc with 30s cache. Defaults: both flags OFF. | `feature/W1.4-feature-flags` | `src/lib/feature-flags.ts` | Test-after rigorous |
| W1.5 | Stripe test-mode env vars in `.env.test`. Helper at `e2e/helpers/stripe-events.ts` to create signed test webhook payloads. | `chore/W1.5-stripe-test-helpers` | `e2e/helpers/stripe-events.ts` | n/a |
| W1.6 | Add `charge.refunded` to Stripe Dashboard webhook subscription (manual op, document in §10 ops checklist) | n/a | external | n/a |

**W1 exit criteria:**
- All §3 decisions show ✅ in the PRD table.
- `WalletService` shipped with ≥90% unit coverage.
- Migration script dry-run runs against a Firestore emulator + a fixture of 50 fake users without errors.
- Feature flags exist and are wired into the principal webhook (default OFF, no behavior change).

### W2 · Dual-write (writes go to BOTH stores, gated by flag)

| ID | Task | Branch | Path | TDD-strict? |
|----|------|--------|------|------------|
| W2.1 | In `PaymentOrchestratorService.distributeStripePayment`, after each `userRepository.update*` call, also call `walletService.recordTransaction` with the same numbers, gated on `WALLET_LEDGER_WRITE_ENABLED`. | `feature/W2.1-dual-write-orchestrator` | `src/backend/payments/application/payment.orchestrator.service.ts` | ✅ TDD-strict |
| W2.2 | Same pattern for the subscription/invoice handlers in the principal webhook (`handleCustomerSubscriptionEvent`, `handleInvoicePaymentSucceeded`). | `feature/W2.2-dual-write-subscriptions` | `src/app/api/webhooks/stripe/route.ts` | ✅ TDD-strict |
| W2.3 | Mismatch detector: after each dual-write, compute ledger-derived balance and compare to stored `usuarios.balance*`. If diff > tolerance, write to `walletMismatches/{uid}_{ts}` with both values + the triggering event id. | `feature/W2.3-mismatch-detector` | `src/backend/wallet/application/mismatch-detector.ts` + spec | ✅ TDD-strict |
| W2.4 | Add `charge.refunded` handler in principal webhook → calls `walletService.processStripeChargeRefunded` (no-op until W3 backfill so old charges don't fail) | `feature/W2.4-refund-handler` | `src/app/api/webhooks/stripe/route.ts` | ✅ TDD-strict |
| W2.5 | Enable `WALLET_LEDGER_WRITE_ENABLED=true` in production. Monitor `walletMismatches` for 7 days. | n/a | ops | n/a |

**W2 exit criteria:**
- Every new payment writes to BOTH stores with identical net amounts.
- 7 consecutive days with 0 entries in `walletMismatches` collection.
- Refund flow works end-to-end (test-mode E2E).

### W3 · Backfill historical data (one-time, scheduled window)

| ID | Task | Branch | Path | TDD-strict? |
|----|------|--------|------|------------|
| W3.1 | Run migration script in `--dry-run --output reports/dry-run-prod.json` against a snapshot of production. Review output line-by-line with PM. | `chore/W3.1-dry-run` | scripts/ | n/a |
| W3.2 | Schedule a low-traffic window. Pause webhook processing (return 503 with retry-after) for the duration. Run migration script for real. | n/a | ops | n/a |
| W3.3 | Re-enable webhook processing. Verify mismatch count == 0 over the next 24 hours. | n/a | ops | n/a |

**W3 exit criteria:**
- All users with non-zero `usuarios.balance*` have corresponding `historical_balance_seed` ledger transactions.
- Sum of ledger per user matches legacy field within ±€0.01 (per D-W6).
- Mismatch alert is silent for 24h post-backfill.

### W4 · Dual-read (callers migrate; ledger becomes the trusted source)

| ID | Task | Branch | Path | TDD-strict? |
|----|------|--------|------|------------|
| W4.1 | `userRepository.balance*` reads now wrap a comparison: ledger value (primary) vs legacy field (fallback). Log mismatches. Behavior gated on `WALLET_LEDGER_READ_ENABLED`. | `feature/W4.1-dual-read-shim` | `src/backend/user/infrastructure/repositories/firebase-user.repository.ts` | ✅ TDD-strict |
| W4.2 | Migrate every direct caller of `userRepository.balance*` to use `walletService.getBalance()` directly. Grep at sprint start to enumerate. | `refactor/W4.2-callers-to-wallet-service` | various | TDD-strict per file |
| W4.3 | Update `AuthContext.tsx` `UserProfile` interface — balance fields read from a `walletSnapshot` returned by a new `/api/me/wallet` endpoint instead of the user document. | `refactor/W4.3-authcontext-wallet` | `src/contexts/AuthContext.tsx` + new endpoint | TDD-strict |
| W4.4 | Enable `WALLET_LEDGER_READ_ENABLED=true` in production. Monitor for 30 days. Cutover to W5 only after 7 consecutive days with 0 read-mismatches. | n/a | ops | n/a |

**W4 exit criteria:**
- `grep -r "balanceComisionesPendientes\|balanceIngresosPendientes\|balanceCredito" src/` returns ONLY the userRepository shim (no other callers).
- 7 consecutive days, 0 read-mismatches, `WALLET_LEDGER_READ_ENABLED=true`.

### W5 · Cutover + cleanup

| ID | Task | Branch | Path | TDD-strict? |
|----|------|--------|------|------------|
| W5.1 | Disable `usuarios.balance*` writes (remove the legacy lines from PaymentOrchestratorService). Keep the FIELD on UserEntity for the 90-day grace per D-W7. | `refactor/W5.1-stop-legacy-writes` | `src/backend/payments/application/payment.orchestrator.service.ts` | ✅ TDD-strict |
| W5.2 | Remove `userRepository.balance*` shim from W4.1 (read goes straight to walletService now). | `refactor/W5.2-remove-shim` | `src/backend/user/infrastructure/repositories/firebase-user.repository.ts` | ✅ TDD-strict |
| W5.3 | Remove the dup webhook handler entirely (`src/app/api/checkout/webhook/`). Update Stripe Dashboard subscription if it was somehow there (it should not be). | `chore/W5.3-remove-dup-webhook` | delete dir | n/a |
| W5.4 | Update ADR-0001 status to "Superseded by completion of Wallet Ledger Migration sprint" + link to this PRD. | `docs/W5.4-adr-supersede` | `documentation/decisions/0001-defer-wallet-ledger-migration.md` | n/a |
| W5.5 | E2E smoke covering: checkout → subscription create → invoice cycle → refund. All ledger entries present and correct. | `test/W5.5-wallet-e2e` | `e2e/wallet-flow.spec.ts` | n/a |
| W5.6 | (T+90 days) Drop the `balance*` columns from UserEntity + Firestore documents. Migration script `scripts/drop-legacy-balance-fields.ts`. | `chore/W5.6-drop-legacy-fields` | scripts + UserEntity | TDD-strict |

**W5 exit criteria:**
- One webhook handler in production.
- Dup handler directory does not exist in repo.
- Wallet E2E passes in CI.
- ADR-0001 marked superseded.
- Calendar reminder set for T+90 to execute W5.6.

---

## 7 · Test strategy

### 7.1 Unit (per file)
- All wallet domain code is on the **TDD-strict** list (per `documentation/testing-strategy.md`). Every PR shows the `test(...)` RED commit before the `feat(...)` GREEN commit.
- Property-based test: `forall txList : sum(txList.amount) === wallet.totals.derived(txList)`. Use `fast-check` library if needed.
- Mismatch detector tests: feed it both stores' values, verify it logs only when diff exceeds the configured tolerance.

### 7.2 Migration script
- **Eval-style** golden tests: input fixtures of fake users with various balance shapes (zero, positive, mixed), expected output ledger transactions stored as `__golden__/<case>.json`. Diff on every script change.
- Idempotency: running the script twice produces identical output (no duplicate `historical_balance_seed` transactions per user).
- Dry-run mode: produces report file but does NOT write to Firestore. Test verifies the report shape.

### 7.3 E2E (Stripe test mode)
- New file `e2e/wallet-flow.spec.ts`. Lands in W5 but skeleton stubbed in W1.5.
- Test cases:
  1. Successful one-time checkout → ledger `sale` + `commission_tier_1` (if affiliate) + `commission_tier_2` (if exists)
  2. Subscription create → ledger `subscription_renewal`
  3. Invoice cycle (subscription renewal) → ledger `subscription_renewal`
  4. Refund of (1) → ledger `refund` (negative) + `commission_clawback` (negative)
  5. Same Stripe event delivered twice → ledger has only one of each transaction
- Stripe test mode credentials in `.env.test`. CI gets them as encrypted secrets when CI is set up.

### 7.4 Audit job
- Daily Cloud Scheduler job (post-sprint, not in scope) that runs `walletService.auditAll()` and writes mismatches to `walletMismatches`. Alert on count > 0.

---

## 8 · Edge cases & risks

| Risk | Likelihood | Impact | Mitigation |
|------|:---:|:---:|------------|
| Stripe re-delivers an event mid-W2 (after legacy write succeeded but before ledger write) | Medium | Medium | F1.4b idempotency key is on the EVENT, not the write. Ledger write inside the same handler invocation is short. If the handler restarts mid-write, the next replay is short-circuited by F1.4b — but legacy fields might already be updated. **Document as known scenario; accept ±1 transaction window for first 7 days; mismatch detector will catch.** |
| Migration script bugs corrupt historical data | Low (with dry-run gate) | Critical | Dry-run + PM review (W3.1) + idempotent script + each backfilled tx carries a `migration_run_id` field allowing surgical reversal |
| Concurrent webhook deliveries cause race in cache totals doc | Medium | Medium | Use Firestore transaction when updating totals. Test under concurrent fixture in W1.2. |
| Refund clawback math wrong (D-W3) | Low | High | TDD-strict + property test: `sum(all txs of affiliate) === expected pending payout post-clawback`. |
| Multi-currency handling drifts | Low | Medium | Each tx carries its own currency. `getBalance` returns per-currency breakdown. Cross-currency aggregation is OUT OF SCOPE. |
| 90-day grace window forgotten — fields deleted before consumers updated | Medium | Medium | W5.6 is on calendar with reminder. PR template adds checkbox: "did you grep for usuarios.balance* before merging?" |
| Stripe Dashboard URL changed mid-sprint by ops mistake | Low | Critical | Add a banner to the dup webhook: returns 410 Gone with a clear log if invoked. Operational runbook in §10 calls it out. |

---

## 9 · Rollback plan

| What goes wrong | Rollback action | Time to rollback |
|------|-----------------|------------------|
| W2 dual-write produces sustained mismatches | Set `WALLET_LEDGER_WRITE_ENABLED=false` in `platform_config/wallet_migration`. Cache TTL is 30s. | <1 minute |
| W3 backfill is wrong | Run `scripts/rollback-backfill.ts <migration_run_id>` — deletes all transactions tagged with that run id. Legacy fields untouched. | <5 minutes |
| W4 read flip causes UI to show wrong balance | Set `WALLET_LEDGER_READ_ENABLED=false`. Reads fall back to legacy fields (still being written by W2 dual-write). | <1 minute |
| W5 cutover regresses anything | Re-enable legacy writes via temporary commit + flag flip. Worst case revert PR. | <30 minutes (PR + Vercel deploy) |

The most dangerous moment is W5.1 (legacy writes off). Before merging W5.1: the team confirms 14+ consecutive days of 0 mismatches in W4 dual-read.

---

## 10 · Operational runbook

### Before W1 starts
- [ ] PM signs off all §3 decisions
- [ ] Verify Stripe Dashboard webhook URL is `/api/webhooks/stripe` only (not `/api/checkout/webhook`)
- [ ] Verify subscribed event types include `charge.refunded` (add it if missing)
- [ ] Get a fresh export of production `usuarios` documents for migration dry-run

### Before W2.5 (enabling dual-write in prod)
- [ ] Mismatch detector passing in pre-prod with synthetic load
- [ ] Add Cloud Logging alert: `severity=ERROR AND message=~"wallet mismatch"` → email PM

### Before W3.2 (running backfill in prod)
- [ ] Schedule low-traffic window (announce 24h ahead)
- [ ] Confirm `scripts/migrate-balances-to-ledger.ts --dry-run` output reviewed and approved by PM (W3.1)
- [ ] Take Firestore export immediately before run (manual snapshot via gcloud)
- [ ] Set webhook to return 503 retry-after for the duration (PR ready, just merge + deploy)

### Before W5.3 (deleting dup webhook)
- [ ] `gh api ...` to query Stripe Dashboard webhook subscriptions — confirm dup URL is NOT there
- [ ] Add a 30-day deprecation notice in code (the dup returns 410 Gone with a comment for 30 days BEFORE deletion, just in case any third party was hitting it)

---

## 11 · Metrics of success

| Metric | Target |
|--------|--------|
| Wallet mismatch rate post-W4 | 0 in any 7-day rolling window |
| Webhook handler count in production | 1 |
| Time from balance change to ledger reflection | <1 second |
| Migration data loss | 0 cents (verified by audit) |
| `grep usuarios.balance` callers in src/ post-W5.6 | 0 |
| Stripe event types handled (post-W5) | ≥6 (checkout, sub.created, sub.updated, sub.deleted, invoice.payment_succeeded, invoice.payment_failed, **charge.refunded**) |

---

## 12 · Out of scope (explicitly)

- Wallet UI surfacing balances to creators (Fase 3 territory)
- Withdrawal / payout endpoints to Stripe Connect (Fase 3)
- Multi-currency cross-conversion
- Multi-account wallets per user
- Crypto / non-Stripe payment rails (decoupled in `PaymentGatewayInterface` already; not exercised here)
- Replacing `referidosExitosos` counter — that's a stat field, not a balance, leave it on UserEntity
- Per-asset commission split policies — already handled by `ReferralPolicyEntity`, not changed by this sprint

---

## 13 · Dependencies & sequencing

- **Hard prereq:** §3 decisions signed off by PM.
- **Soft prereq:** F1.6 (PostHog SDK install + identify) recommended before W2 so the mismatch detector can emit a `wallet_mismatch_detected` event for dashboards.
- **Blocks:** Fase 3 (Stripe Connect Express + payouts) — payouts must read from the ledger, not from `usuarios.balance*`. Recommendation: run this sprint AT LATEST in parallel with Fase 3 design, ship before Fase 3.B (Connect Adapter).
- **Does NOT block:** Fases 4.1, 5.1, 6.x — they don't touch balances.

---

## 14 · Open questions to resolve in W1.1

1. Do we have a Firestore emulator available in CI for the migration script integration tests, or do we mock?
2. Does `STRIPE_WEBHOOK_SECRET` rotate on a schedule? If so, who notifies us so dual-write doesn't break.
3. Is there ANY external system (Zapier, ETL, BI tool) reading `usuarios.balance*` that would break when we drop the fields in W5.6?
4. For dual-read (W4), do we want a tiny dashboard surface for ops to monitor mismatch rate, or is a Cloud Logging query enough?
5. The `referidosExitosos` increment lives in `userRepository.incrementSuccessfulReferrals` — it's a counter, not a balance. Confirm it stays as-is on UserEntity (recommendation: yes; it's a cached count, not money).

---

## 15 · Appendix · Glossary

- **Ledger** — append-only collection of money-movement events. Balances are derived by summing.
- **Mismatch** — a difference between the legacy `usuarios.balance*` value and the ledger-derived value, exceeding the per-D-W6 tolerance.
- **Backfill** — one-time write of `historical_balance_seed` transactions to seed the ledger from existing legacy values.
- **Dual-write** — writes go to both stores simultaneously, gated by flag.
- **Dual-read** — reads from ledger primarily, falls back to legacy on miss, logs mismatches.
- **Cutover** — moment when legacy writes are turned off and the ledger becomes the only source of truth.
- **Clawback** — negative ledger transaction that reduces an affiliate's balance to recover a commission paid on a refunded charge.
