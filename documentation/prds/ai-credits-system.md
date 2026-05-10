# PRD · AI Pricing & Credits System Sprint

| | |
|---|---|
| **Status** | Draft (skeleton — awaiting pricing research from parallel agent) |
| **Owner** | caangogi |
| **Author** | Claude Code (placeholder; full PRD lands once pricing research is in) |
| **Created** | 2026-05-10 |
| **Estimated duration** | TBD — ~3 sprints once decisions are locked |
| **Critical path?** | YES for Fase 6.0.4 (hard caps por creador) and any GA launch of AI features |

> **Status note:** this PRD is a SKELETON. The pricing-research file [`documentation/research/gemini-pricing-2026-05.md`](../research/gemini-pricing-2026-05.md) (parallel agent in flight at the time of writing) is the input to the §3 decisions. Once that lands, the founder picks the §3 answers and this PRD gets fleshed out per the structure used in [wallet-ledger-migration.md](./wallet-ledger-migration.md).

---

## 1 · Why this exists

The AI features shipped in FASE CORE (assistive editor, Nano Banana cover gen, course structure, magic-doc lead magnets) and the ones planned for Fase 6 (Journaling sentiment, RAG Companion, Agente Secretarial) all consume Gemini API calls. **Each call has a real-money cost we currently don't track, don't cap, and don't bill back to creators.**

A single creator with an inactive account costs the platform €0/mo. A creator who:
- Generates 50 AI covers per month with Nano Banana → ~€2/mo
- Uses the assistive editor 200 turns → ~€0.05/mo
- Generates 30 lead magnets → ~€0.15/mo
- (Future) RAG companion 500 student queries → ~€0.50/mo
- (Future) Journaling 30 entries × sentiment scoring → ~€0.10/mo

→ **Roughly €3/mo per active "heavy" creator.** Sustainable until ~1000 active creators (€3k/mo cost, manageable). Above that, or if a single creator goes wild on Nano Banana, costs balloon.

**Today there is NO mechanism to:**
- Know which creator burned how much in Gemini calls
- Stop a runaway loop (an automation that calls AI 10k times)
- Bill enterprise tiers for higher usage
- Show the creator their consumption (transparency = trust)

This sprint introduces a **credits ledger** separate from the money Wallet (D1) so we can manage AI consumption as its own product surface.

> **Related but different:** the money Wallet (`src/backend/wallet/`) handles real money flows (Stripe payments, creator earnings, payouts). The AI credits ledger handles a non-redeemable internal accounting unit. Mixing them would muddle two unrelated mental models.

---

## 2 · Goals & non-goals

### Goals
- **G1** Single source of truth for AI credit balance per user: `AICreditWallet` ledger.
- **G2** Every AI call (existing + future) consumes credits BEFORE invoking the model. If insufficient → 402-style "out of credits" response surfaced as a clean UX.
- **G3** Monthly automatic top-up per tier (free / pro / enterprise) via cron. Unused credits expire end-of-month (no rollover) — keeps the math simple and prevents hoarding.
- **G4** Manual top-up purchase via Stripe (creator buys €5/€20/€50 packs of credits). Transactions land in the credits ledger.
- **G5** Superadmin dashboard with usage by creator + total platform burn + alerting on cost spikes.
- **G6** Creator dashboard surface: "Te quedan X créditos AI este mes (renueva el día Y)".

### Non-goals
- Per-user real-money Gemini billing (we never bill the creator the literal Gemini cost — credits are an opaque unit).
- Cross-currency conversion for credit packs (all in EUR).
- Reseller / white-label credit pools (the entire credit system is per-individual creator UID).
- Migration of currently-uncapped usage to credits without a grace window (the rollout is gradual — see §6 strategy below).

---

## 3 · Decisions to lock BEFORE coding starts

These are **PM calls** required as gating items. Most cannot be answered until the pricing research file is reviewed.

| # | Question | Recommendation (placeholder; revisit post-research) | Status |
|---|----------|-----------------------------------------------------|--------|
| **D-AC-1** | Credit unit definition | **1 credit = 1 USD-equivalent of Gemini cost at retail price** (so the credit-to-call conversion is a small lookup table per model). Internally we display credits, never raw USD. | ⏳ open |
| **D-AC-2** | Free tier monthly grant | TBD — need pricing research. Sized to support ~50 AI covers + ~200 assistive turns + ~30 magic docs (typical "trying-the-product" creator). | ⏳ open |
| **D-AC-3** | Pro tier monthly grant | TBD. ~5x free tier as starting hypothesis. | ⏳ open |
| **D-AC-4** | Top-up pack pricing | TBD. €5 / €20 / €50 with bonus % at higher tiers? Need the per-call cost data first. | ⏳ open |
| **D-AC-5** | Expiry policy | **Monthly expiry, no rollover** for granted credits. Top-up packs DO roll over (purchased credits are real money). | ⏳ open |
| **D-AC-6** | Out-of-credits behavior | **Hard block + clear UX**: "Te has quedado sin créditos AI este mes. Renueva el día X o compra un pack." NOT silent throttle. | ⏳ open |
| **D-AC-7** | Pre-existing creators on launch | One-time grant of 1 month of Pro tier as goodwill. Then drops to their actual tier (free unless they upgraded). | ⏳ open |
| **D-AC-8** | Tier model — separate paid AI plans, OR bundled with overall platform plan? | TBD — needs broader product packaging decision. Most likely: bundled (creator's overall plan determines AI tier, no separate "AI subscription"). | ⏳ open |

> **Sign-off:** PM replaces ⏳ with ✅ + initials + date once pricing data arrives.

---

## 4 · Current state (quick audit, full audit lands with §6 plan)

- **5 AI endpoints in production** (assistive-edit, ai-cover ×2, ai-generate, ai-structure). All use `src/lib/ai/genai.client.ts` directly. NONE check or decrement any credit balance.
- **No `AICreditWallet` entity exists.** Greenfield.
- **No usage logging** — `AIUsageLog` is planned for Fase 6.0.3 but not built yet. **The credits sprint must build it as a hard prereq** (you cannot decrement a balance without recording what was consumed and at what cost).
- Stripe integration already supports one-time payments (used for course purchases) — top-up packs reuse the same `checkout.session.completed` flow with a metadata flag `purchase_type: 'ai_credits_topup'`.
- The webhook idempotency guard (F1.4b) already covers the top-up purchase flow safely — no duplicate credit grants on Stripe re-deliveries.

---

## 5 · Target state (to-be)

```
Every AI endpoint:
   1. Resolve userId from auth
   2. Look up cost(modelName, estimatedTokens) — via a static cost table
      backed by the pricing research
   3. AICreditWallet.tryDebit(userId, costInCredits)
        → success: continue with the actual Gemini call, then log to AIUsageLog
        → fail (insufficient balance): return 402 with the "out of credits" payload

Every billing cycle (cron, monthly):
   1. For each user, look up tier (from user profile or subscription)
   2. Reset monthly grant credits to tier amount
   3. Roll over any purchased credits

UI surfaces:
   - Creator dashboard: "Créditos AI: 8.40 / 10.00 · renuevan en 12 días"
     + "Comprar más" button → Stripe checkout with metadata
   - Superadmin dashboard: weekly burn, top spenders, cost vs revenue per creator
   - Out-of-credits modal: clear copy + upgrade/topup CTAs
```

---

## 6 · Migration strategy (3 phases — TBD pending decisions)

### AC1 · Foundation (~1 sprint)
- AICreditWalletEntity + Firestore repo (ledger pattern, balance derived from transactions)
- Cost table at `src/lib/ai/pricing.ts` populated from pricing research
- Helper `chargeForAICall(userId, model, estimatedTokens): Promise<{allowed, costInCredits}>`
- AIUsageLog entity (which is also Fase 6.0.3 — done in this sprint instead, with reciprocal credit tracking)
- Feature flag `AI_CREDITS_ENFORCEMENT_ENABLED` defaults OFF (logging-only mode first)

### AC2 · Logging-only rollout (~2 weeks shadow mode)
- Flag stays OFF in production. Every AI call logs estimated cost to AIUsageLog.
- Run in parallel with normal operation for 2 weeks to gather REAL usage data and validate the §3 grant sizing.
- Adjust §3 numbers based on what we observed.

### AC3 · Enforcement + UX rollout (~1 sprint)
- Flip feature flag ON.
- Monthly cron grants credits per tier.
- Stripe top-up flow live (checkout, webhook handler, credit grant on payment success).
- Dashboard surfaces ship.
- Out-of-credits modal in every AI feature.

---

## 7 · Test strategy (preview)

- **TDD-strict** for `src/backend/ai-credits/` (will be added to the testing-strategy.md TDD-strict watchlist when the sprint starts) — credits are real money proxies, math errors hit the bottom line.
- Property-based tests for the ledger: `forall txList : sum(txList.amount) === wallet.balance`.
- Migration script for the goodwill 1-month-Pro grant (D-AC-7) needs idempotency (re-running doesn't double-grant).
- E2E for the top-up purchase flow via Stripe test mode.

---

## 8 · Risks (preview)

| Risk | Mitigation |
|------|------------|
| Pricing research is wrong/stale | Treat as input; revisit quarterly. Cost table is data, not code. |
| Free-tier grant too generous → losses | Logging-only mode (AC2) calibrates BEFORE enforcement |
| Free-tier grant too stingy → adoption killed | Same — calibration phase + easy lever to bump |
| Goodwill grant on launch confuses early creators | Clear in-app announcement + email |
| Out-of-credits UX too punitive | "Renew on X / top-up pack" CTAs, not just "blocked" |
| Stripe top-up race conditions | F1.4b idempotency already protects |
| Cost spike from a single runaway creator | Per-creator daily cap on top of monthly cap; alert at 80% |

---

## 9 · Open questions (will close once pricing research lands)

- What is the actual €/€/€ tier structure of the platform itself? (free/pro/enterprise are placeholders)
- Do we offer enterprise custom contracts with bring-your-own-API-key? (would change the cost model significantly)
- Is there a B2B sale where the platform pays Gemini directly out of a separate budget vs counting it against the creator?
- What's our acceptable monthly Gemini spend ceiling at current MRR?

---

## 10 · References

- Pricing input (in flight): [documentation/research/gemini-pricing-2026-05.md](../research/gemini-pricing-2026-05.md)
- Money wallet PRD (separate concern): [documentation/prds/wallet-ledger-migration.md](./wallet-ledger-migration.md)
- Roadmap viewer: [documentation/index.html](../index.html) § "Sprint AI Pricing & Credits System" callout
- Testing strategy: [documentation/testing-strategy.md](../testing-strategy.md) — `src/backend/ai-credits/` will join the TDD-strict list
