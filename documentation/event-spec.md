# PostHog Event Spec — Consciousness Class

**Status:** Canonical · **Owner:** Product · **Stack:** PostHog (self-hosted, recommended in `documentation/index.html` §Falta cubrir)

This file is the canonical PostHog event taxonomy for Consciousness Class. Every "métrica norte" declared in [docs/hoja-de-ruta.md](../docs/hoja-de-ruta.md) and the dashboard at [documentation/index.html](./index.html) §Métricas norte por fase maps to one or more events defined here. **Anyone instrumenting code MUST consult this file before adding new events.** If a new event is needed for a metric that is already in the roadmap, add it here in the same PR. If the event does not serve a declared metric, do not add it (see Anti-patterns).

---

## Naming convention

`<domain>_<noun>_<verb>` in `snake_case`.

Examples: `booking_session_confirmed`, `referral_payout_succeeded`, `journal_alert_emitted_to_creator`.

Allowed domains (closed set — adding a new domain requires a PR to this file):

| Domain | Scope |
|--------|-------|
| `auth` | Sign-in, sign-up, identify boundaries |
| `booking` | Coaching/session booking lifecycle (Fase 5.1) |
| `enrollment` | Cross-asset enrollments (`inscripciones`) |
| `payment` | Stripe checkout, webhooks, refunds |
| `referral` | Referral commissions and payouts (Fase 3) |
| `journal` | Smart Journaling (Fase 6.1) |
| `companion` | RAG Companion bot (Fase 6.2) |
| `ai` | Generic AI flows not covered by `companion` (cover gen, magic doc, plan gen) |
| `community` | Community asset interactions (only when serving a metric) |

Other prefixes used below for cross-cutting infra (`webhook_*`, `email_*`, `campaign_*`, `agent_*`) are kept verbatim because they map directly to roadmap métricas; treat them as honorary domains.

---

## Property naming conventions

- All property keys are `snake_case`.
- Timestamps: ISO 8601 UTC strings (`"2026-05-08T14:32:01Z"`). Property suffix `_at`.
- Currency codes: lowercase ISO 4217 (`eur`, `usd`). Property name: `currency`.
- Monetary amounts: **major units** (euros, not cents). Property name explicitly carries the unit: `amount_eur`, `commission_amount_eur`, `payout_amount_eur`. Never store cents.
- Booleans: positive form (`is_*`, `has_*`, `was_*`).
- IDs: `<entity>_id` (e.g. `booking_id`, `creator_id`, `asset_id`, `enrollment_id`).
- Asset type: `asset_type` ∈ `course | membership | coaching | podcast | community | download` (matches the unified Catálogo).
- Locale: `locale` (e.g. `es-ES`).
- Never put free-form user content in props (see Privacy).

---

## User identification

`posthog.identify(uid, traits)` is called **once per session at sign-in** from the auth boundary (Firebase auth state listener in `src/contexts/AuthContext.tsx`). It is **not** called on every event.

Required traits on identify:

| Trait | Source | Notes |
|-------|--------|-------|
| `role` | Firebase custom claim `role` | `student \| creator \| admin \| superadmin` |
| `creator_status` | `users/{uid}.creatorStatus` | `none \| pending \| active \| suspended` (only meaningful for creators) |
| `created_at` | `users/{uid}.createdAt` | ISO timestamp |

**No PII in event props beyond `uid`.** Email, full name, phone, and address are never sent as event properties. They live on the PostHog Person via `identify` traits only when strictly necessary, and never inside `track` calls.

---

## Privacy

- **Journal text content (Fase 6.1) is never sent to PostHog.** The events `journal_entry_created`, `journal_sentiment_analyzed`, `journal_alert_emitted_to_creator`, and `journal_alert_actioned_by_creator` carry only IDs, sentiment scores, and severity buckets. No entry body, no excerpt, no summary text. Sentiment is recorded as a numeric score and a coarse bucket (e.g. `negative | neutral | positive`).
- **RAG Companion chat content (Fase 6.2) is never sent to PostHog.** `companion_query_received`, `companion_response_with_citation`, `companion_response_no_context` carry only IDs, latency, citation counts, and boolean flags. No question text, no answer text, no retrieved chunk text.
- **Payment card data is never sent to PostHog, period.** Stripe handles PAN/CVV; we only ever see `payment_method_type` (`card`, `sepa_debit`, etc.) and `last4` may be sent only on receipt-style events when explicitly required for support — currently no event in this spec carries `last4`.
- WhatsApp/SMS bodies (Fase 4.2 / 6.3) follow the same rule: metadata only, never message text.
- Health-special-category data (Art. 9 GDPR) implications are addressed in `documentation/index.html` §Legal & Compliance — this spec stays on the safe side by encoding only IDs and bucketed numeric signals.

---

## Events

### `auth`

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `auth_user_signed_up` | New user record is created server-side after Firebase signup | `uid`, `role`, `signup_method` (`password`/`google`/`oauth`), `signed_up_at` | Funnel baseline (used by all downstream métricas) |
| `auth_user_signed_in` | User completes a sign-in (after `identify`) | `uid`, `signed_in_at`, `is_first_session` | Funnel baseline |
| `auth_creator_status_changed` | `creatorStatus` transitions on `users/{uid}` | `uid`, `from_status`, `to_status`, `changed_at` | Fase 3 (active creator denominator for payout %) |

### `webhook` (infra — Fase 0)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `webhook_stripe_received` | A Stripe webhook payload is accepted by `/api/webhooks/stripe` | `event_id`, `event_type`, `livemode`, `received_at` | Fase 0 — operational visibility (idempotency baseline) |
| `webhook_stripe_duplicate_skipped` | Idempotency layer detects a re-delivery of an `event_id` already processed | `event_id`, `event_type`, `original_received_at`, `skipped_at` | Fase 0 — idempotency correctness |
| `webhook_stripe_processing_failed` | Webhook handler throws after retries are exhausted | `event_id`, `event_type`, `error_code`, `failed_at` | Fase 0 — operational visibility |

### `email` (Fase 4.1)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `email_template_rendered` | A transactional template finishes rendering before send | `template_id`, `template_version`, `locale`, `creator_id`, `recipient_uid`, `rendered_at` | Fase 4.1 — render-error rate |
| `email_transactional_sent` | Nodemailer accepts the message for delivery (250 OK from SMTP) | `template_id`, `message_id`, `creator_id`, `recipient_uid`, `trigger_event` (`booking_confirmed` \| `booking_cancelled` \| `enrollment_created` \| `creator_alert`), `sent_at`, `latency_from_trigger_ms` | Fase 4.1 — **% bookings con email entregado <5min** (`latency_from_trigger_ms < 300000` && `trigger_event = booking_confirmed`) |
| `email_transactional_delivered` | Provider delivery webhook (or successful SMTP final ack) | `message_id`, `template_id`, `delivered_at` | Fase 4.1 — delivered <5min numerator |
| `email_transactional_bounced` | Hard or soft bounce reported | `message_id`, `template_id`, `bounce_type` (`hard` \| `soft`), `bounced_at` | Fase 4.1 — **Bounce rate** |
| `email_transactional_failed` | Send fails before SMTP accept (auth, render, retry-exhausted) | `message_id`, `template_id`, `error_code`, `failed_at` | Fase 4.1 — operational |

### `booking` (Fase 5.1)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `booking_reserved` | Student lands on Stripe checkout / holds a slot (pre-payment) | `booking_id`, `asset_id`, `asset_type` (=`coaching`), `creator_id`, `student_id`, `slot_start_at`, `slot_end_at`, `amount_eur`, `currency`, `reserved_at` | Fase 5.1 — funnel start |
| `booking_confirmed` | Stripe payment succeeded **and** booking state machine moved to `confirmed` | `booking_id`, `asset_id`, `creator_id`, `student_id`, `slot_start_at`, `amount_eur`, `currency`, `confirmed_at` | Fase 5.1 — denominator for completion %; trigger for Fase 4.1 email latency metric |
| `booking_cancelled` | Booking moves to `cancelled` (by student, creator, or system) | `booking_id`, `cancelled_by` (`student` \| `creator` \| `system`), `cancelled_at`, `hours_until_slot`, `refund_eligible` (boolean), `cancellation_reason` (enum) | Fase 5.1 — drop-off in funnel; refund-policy validation |
| `booking_completed` | Slot ended and creator (or auto-rule) marked it complete | `booking_id`, `creator_id`, `student_id`, `completed_at`, `auto_completed` (boolean) | Fase 5.1 — **% bookings que llegan a `completed`** (numerator) |
| `booking_no_show` | Slot passed and student did not attend (state machine transition) | `booking_id`, `creator_id`, `student_id`, `slot_start_at`, `marked_at`, `marked_by` (`creator` \| `system`) | Fase 5.1 — drop-off classification |
| `booking_rescheduled` | Booking moves to a new slot in-place | `booking_id`, `old_slot_start_at`, `new_slot_start_at`, `rescheduled_by`, `rescheduled_at` | Fase 5.1 — funnel correction (does not break completion metric) |

### `enrollment`

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `enrollment_created` | A row is written to `inscripciones` for any asset type | `enrollment_id`, `asset_id`, `asset_type`, `creator_id`, `student_id`, `access_type` (`one_time` \| `subscription` \| `free`), `amount_eur`, `currency`, `created_at` | Cross-fase — denominator for creator revenue / completion analyses; trigger for Fase 4.1 enrollment email |
| `enrollment_revoked` | Access revoked (refund, sub cancellation, manual admin) | `enrollment_id`, `revocation_reason` (`refund` \| `subscription_cancelled` \| `admin` \| `chargeback`), `revoked_at` | Cross-fase |

### `payment`

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `payment_checkout_started` | Stripe Checkout Session created server-side | `checkout_session_id`, `asset_id`, `asset_type`, `creator_id`, `student_id`, `amount_eur`, `currency`, `started_at` | Funnel baseline |
| `payment_checkout_succeeded` | `checkout.session.completed` processed and not a duplicate | `checkout_session_id`, `payment_intent_id`, `asset_id`, `asset_type`, `creator_id`, `student_id`, `amount_eur`, `currency`, `payment_method_type`, `succeeded_at` | Funnel; precondition for `enrollment_created` & `booking_confirmed` |
| `payment_refunded` | Refund processed via Stripe webhook | `payment_intent_id`, `refund_id`, `amount_eur`, `currency`, `reason`, `refunded_at` | Fase 5.1 (`refund_eligible` validation) |

### `referral` (Fase 3)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `referral_link_visited` | A `?ref=<code>` URL hits the platform and is attributed | `referral_code`, `referrer_creator_id`, `landing_path`, `visited_at` | Fase 3 — funnel baseline |
| `referral_attribution_recorded` | A purchase is attributed to a referral policy snapshot | `enrollment_id` \| `booking_id`, `policy_id`, `policy_snapshot_id`, `referrer_creator_id`, `tier`, `recorded_at` | Fase 3 — denominator for commission calculation |
| `referral_commission_calculated` | Commission ledger row written for a referrer (per tier) | `commission_id`, `policy_id`, `policy_snapshot_id`, `referrer_creator_id`, `source_creator_id`, `tier`, `commission_amount_eur`, `currency`, `calculated_at` | Fase 3 — commission engine correctness |
| `referral_payout_initiated` | Wallet → bank transfer queued (Stripe Connect transfer / payout request) | `payout_id`, `creator_id`, `payout_amount_eur`, `currency`, `provider` (`stripe_connect` \| `manual`), `initiated_at` | Fase 3 — **% creadores con payout exitoso** (denominator) |
| `referral_payout_succeeded` | Provider confirms payout settled | `payout_id`, `creator_id`, `payout_amount_eur`, `currency`, `provider`, `succeeded_at` | Fase 3 — **% creadores con payout exitoso** (numerator) |
| `referral_payout_failed` | Provider returns failure | `payout_id`, `creator_id`, `payout_amount_eur`, `currency`, `provider`, `error_code`, `failed_at` | Fase 3 — failure analysis |
| `creator_payout_completed` | Aggregate event when the creator's payout for a period is fully reconciled | `creator_id`, `period_start_at`, `period_end_at`, `total_amount_eur`, `currency`, `completed_at` | Fase 3 — **% creadores con payout exitoso** (per-period view) |

### `campaign` (Fase 4.2)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `campaign_segment_built` | A creator builds/saves an audience segment in the CRM | `creator_id`, `segment_id`, `segment_size`, `built_at` | Fase 4.2 — adoption baseline |
| `campaign_email_sent` | Campaign blast accepted by SMTP for a given recipient | `campaign_id`, `creator_id`, `recipient_uid`, `template_id`, `sent_at` | Fase 4.2 — denominator for open/click rates |
| `campaign_email_opened` | Open pixel ping (deduped per recipient) | `campaign_id`, `recipient_uid`, `opened_at`, `is_first_open` | Fase 4.2 — **Open rate campañas** (numerator) |
| `campaign_email_clicked` | Tracked link clicked | `campaign_id`, `recipient_uid`, `link_id`, `clicked_at` | Fase 4.2 — Click rate; serves Open rate denominator validation |
| `campaign_email_unsubscribed` | Recipient unsubs via tracked link | `campaign_id`, `recipient_uid`, `unsubscribed_at` | Fase 4.2 — list health |
| `campaign_whatsapp_sent` | WhatsApp Business message delivered for a campaign | `campaign_id`, `creator_id`, `recipient_phone_hash`, `template_id`, `sent_at` | Fase 4.2 — omnichannel parity |

### `journal` (Fase 6.1) — **NO TEXT CONTENT**

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `journal_entry_created` | Student saves a new diary entry | `entry_id`, `student_id`, `creator_id`, `asset_id`, `char_count_bucket` (`xs`/`s`/`m`/`l`/`xl`), `created_at` | Fase 6.1 — engagement denominator (no body text) |
| `journal_sentiment_analyzed` | Async NLP job finishes scoring an entry | `entry_id`, `sentiment_score` (numeric, -1..1), `sentiment_bucket` (`negative` \| `neutral` \| `positive`), `risk_level` (`none` \| `low` \| `medium` \| `high`), `model_version`, `analyzed_at` | Fase 6.1 — alert pipeline upstream |
| `journal_alert_emitted_to_creator` | Risk threshold tripped, creator notified silently | `alert_id`, `entry_id`, `student_id`, `creator_id`, `risk_level`, `emitted_at` | Fase 6.1 — **% alertas IA accionadas por creador** (denominator) |
| `journal_alert_actioned_by_creator` | Creator opens, dismisses, or reaches out (any action on the alert) | `alert_id`, `creator_id`, `action_type` (`viewed` \| `messaged` \| `dismissed`), `time_to_action_ms`, `actioned_at` | Fase 6.1 — **% alertas IA accionadas por creador** (numerator; `messaged` = strong action) |

### `companion` (Fase 6.2) — **NO QUESTION/ANSWER TEXT**

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `companion_query_received` | Student submits a question to the RAG widget | `query_id`, `student_id`, `creator_id`, `asset_id`, `query_char_count_bucket`, `received_at` | Fase 6.2 — denominator for citation-rate metric |
| `companion_response_with_citation` | RAG produced an answer with at least one citation from creator-uploaded source | `query_id`, `citation_count`, `top_chunk_score`, `latency_ms`, `model_version`, `responded_at` | Fase 6.2 — **% preguntas con cita** (numerator) |
| `companion_response_no_context` | RAG fell back to the "no cubierto" safety response | `query_id`, `fallback_reason` (`no_chunks_above_threshold` \| `topic_filtered` \| `safety_block`), `latency_ms`, `responded_at` | Fase 6.2 — **% preguntas con "no cubierto"** (complement) |
| `companion_response_failed` | RAG pipeline errored | `query_id`, `error_code`, `failed_at` | Fase 6.2 — operational |

### `agent` (Fase 6.3 — Agente Secretarial AI)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `agent_conversation_started` | New WhatsApp/chat thread opened with the secretarial agent | `conversation_id`, `creator_id`, `student_id`, `channel` (`whatsapp` \| `web_chat`), `started_at` | Fase 6.3 — denominator for "% reservas vía agente sin escalación" |
| `agent_tool_invoked` | Agent calls one of its tools (availability lookup, booking creation, etc.) | `conversation_id`, `tool_name` (e.g. `check_availability` \| `create_booking` \| `send_confirmation`), `latency_ms`, `was_successful` (boolean), `invoked_at` | Fase 6.3 — instrumentation of agent capability |
| `agent_booking_created` | Agent successfully completed a booking end-to-end | `conversation_id`, `booking_id`, `creator_id`, `student_id`, `created_at` | Fase 6.3 — **% reservas vía agente sin escalación** (numerator when no `agent_escalated_to_human` exists for the same `conversation_id`) |
| `agent_escalated_to_human` | Agent yields the conversation to the creator (any reason) | `conversation_id`, `escalation_reason` (`unclear_intent` \| `out_of_scope` \| `safety` \| `user_requested` \| `error`), `escalated_at` | Fase 6.3 — disqualifies a conversation from "sin escalación" |

### `ai` (cross-cutting AI features)

| Event name | When fired | Required props | Roadmap metric served |
|---|---|---|---|
| `ai_generation_requested` | Any creator-facing AI feature (cover, magic doc, plan, community guidelines, assistive editor) starts | `feature` (`cover` \| `magic_doc` \| `coaching_plan` \| `community_guidelines` \| `assistive_editor`), `creator_id`, `model_version`, `requested_at` | Cross-fase — adoption of FASE CORE AI features |
| `ai_generation_completed` | Generation succeeds | `feature`, `creator_id`, `latency_ms`, `output_accepted` (boolean if user accepts/inserts), `completed_at` | Cross-fase — quality signal |
| `ai_generation_failed` | Generation errors out | `feature`, `creator_id`, `error_code`, `failed_at` | Cross-fase — operational |

---

## Computing the métricas norte from these events

| Fase | Métrica norte (target) | Formula |
|------|------------------------|---------|
| 0 | Decisiones técnicas convergidas (100%) | Manual gate; `webhook_stripe_*` events confirm idempotency works in prod |
| 4.1 | % bookings con email entregado <5min (>95%) | `count(email_transactional_delivered where trigger_event='booking_confirmed' and (delivered_at - <booking_confirmed.confirmed_at>) < 5min) / count(booking_confirmed)` |
| 4.1 | Bounce rate (low) | `count(email_transactional_bounced) / count(email_transactional_sent)` |
| 5.1 | % bookings → completed (>75%) | `count(booking_completed) / count(booking_confirmed)` over a cohort of confirmed bookings whose slot is in the past |
| 3 | % creadores con payout exitoso (>60%) | `unique(creator_id from creator_payout_completed) / unique(creator_id from auth_creator_status_changed where to_status='active')` for the period |
| 4.2 | Open rate campañas (>35%) | `unique(recipient_uid from campaign_email_opened) / count(campaign_email_sent)` per campaign |
| 6.1 | % alertas IA accionadas (>25%) | `count(journal_alert_actioned_by_creator where action_type in ('viewed','messaged')) / count(journal_alert_emitted_to_creator)` |
| 6.2 | % preguntas con cita (>70%) | `count(companion_response_with_citation) / (count(companion_response_with_citation) + count(companion_response_no_context))` |
| 6.3 | % reservas vía agente sin escalación (>50%) | `count(agent_booking_created where not exists agent_escalated_to_human for same conversation_id) / count(agent_conversation_started)` |

---

## Where to instrument (code map)

This section is non-normative guidance for engineers. The architecture in `CLAUDE.md` says routes never talk to Firestore directly; the same applies here — **events fire from the `application/<name>.service.ts` layer**, not from API routes or React components, except where the event is intrinsically a UI signal (open pixel, link click, AI accept/dismiss).

| Event family | Fire from |
|---|---|
| `auth_*` | `src/contexts/AuthContext.tsx` (client identify) + `src/app/api/users/create-profile` (server `signed_up`) |
| `webhook_stripe_*` | `src/app/api/webhooks/stripe/route.ts` (after Fase 0 consolidation in T0.3) |
| `email_*` | Nodemailer wrapper from T4.1.2 (`src/backend/notifications/`) |
| `booking_*` | `src/backend/booking/application/booking.service.ts` (state machine transitions) |
| `enrollment_*` | `src/backend/enrollment/application/enrollment.service.ts` |
| `payment_*` | `src/backend/payments/application/*.service.ts` and the unified Stripe webhook |
| `referral_*` | `src/backend/referrals/application/*.service.ts` (post Fase 0 T0.2 consolidation) |
| `creator_payout_completed` | `src/backend/wallet/application/wallet.service.ts` (post T0.1 extraction) |
| `campaign_*` | Fase 4.2 CRM service (TBD path) |
| `journal_*` | Fase 6.1 journal service + sentiment NLP worker |
| `companion_*` | Fase 6.2 RAG endpoint (server-side, after retrieval) |
| `agent_*` | Fase 6.3 agent orchestrator |
| `ai_*` | `src/app/api/creator/assets/ai-cover` and the assistive editor endpoints |

PostHog client/server SDKs:

- **Server-side** (Node, API routes, services): use `posthog-node`. Always pass `distinctId: uid`. Never block the request — flush asynchronously.
- **Client-side** (React): use `posthog-js` for `identify` at sign-in, `$pageview` autocapture, and the small handful of UI-only events (`campaign_email_opened`, `campaign_email_clicked`, `ai_generation_completed.output_accepted`).

Tests for events that gate métricas norte (Fase 4.1 latency, Fase 5.1 completion, Fase 3 payout) must assert the event is emitted with the required props — see `documentation/testing-strategy.md` for the TDD-strict perimeter; booking and payments events fall inside it.

---

## Versioning this spec

- This file is the single source of truth. Adding, renaming, or removing an event requires a PR that edits this file in the same commit as the instrumentation change.
- Removing an event in production is a breaking change for dashboards. Prefer deprecation: mark the row with `(deprecated YYYY-MM-DD — replaced by <new_event>)` and keep emitting both for one release cycle.
- Property additions are non-breaking and may be done freely; document them in the props column.
- Renaming a property is breaking. Add the new name, dual-write for one release, then remove the old.

---

## Anti-patterns (do NOT do this)

- **Don't track every click.** This taxonomy is for **product metrics**, not for analytics curiosity. If a click does not advance, complete, or break a métrica norte, do not emit an event for it.
- **Don't add `*_viewed` page-view events** unless they gate a métrica (none do at present). PostHog autocaptures `$pageview`; that is sufficient for funnel context.
- **Don't include free-form user-generated content.** No journal text, no chat text, no email body, no community post body. Bucketed numeric proxies (`char_count_bucket`, `sentiment_bucket`) are the only allowed shape.
- **Don't ship an event without first adding it here.** PRs that introduce un-spec'd `posthog.capture(...)` calls will be rejected at review.
- **Don't use camelCase or PascalCase** for event names or properties. This taxonomy is `snake_case` end to end.
- **Don't reuse an event for two métricas with different semantics.** Add a new event with clear props rather than overloading.
- **Don't put PII in event props** (email, phone, full name, address, IP, payment details). PII lives on `identify` traits where strictly necessary; everything else is `uid`-only.
