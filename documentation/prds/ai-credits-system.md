# PRD · Sprint Sistema de Créditos AI y Pricing

| | |
|---|---|
| **Estado** | Borrador (esqueleto — pendiente investigación de pricing y decisiones del founder) |
| **Owner** | caangogi |
| **Autor** | Claude Code (placeholder; el PRD completo aterriza una vez se resuelvan las decisiones de §3) |
| **Creado** | 2026-05-10 |
| **Duración estimada** | TBD — ~3 sprints una vez bloqueadas las decisiones |
| **¿Camino crítico?** | SÍ para Fase 6.0.4 (hard caps por creador) y para cualquier lanzamiento GA de features AI |

> **Nota de estado:** este PRD es un ESQUELETO. El estudio de pricing en [`documentation/research/gemini-pricing-2026-05.md`](../research/gemini-pricing-2026-05.md) ya está entregado. Una vez el founder firme las decisiones de §3, este PRD se completa siguiendo la estructura usada en [wallet-ledger-migration.md](./wallet-ledger-migration.md).

---

## 1 · Por qué existe

Las features AI ya en producción (editor asistivo, generación de portadas Nano Banana, generador de estructura de cursos, lead magnets / "documento mágico") y las planificadas para Fase 6 (sentiment del Journaling, RAG Companion, Agente Secretarial) consumen llamadas a la API de Gemini. **Cada llamada tiene un coste real en dinero que hoy NO trackeamos, NO limitamos, y NO repercutimos al creador.**

Un creador con cuenta inactiva cuesta a la plataforma €0/mes. Un creador que:
- Genera 50 portadas con Nano Banana al mes → ~€2/mes
- Usa el editor asistivo 200 veces → ~€0.05/mes
- Genera 30 lead magnets → ~€0.15/mes
- (Futuro) RAG companion: 500 consultas de estudiantes → ~€0.50/mes
- (Futuro) Journaling: 30 entradas × análisis de sentimiento → ~€0.10/mes

→ **Aproximadamente €3/mes por creador "activo intensivo".** Sostenible hasta ~1000 creadores activos (€3k/mes de coste, manejable). Por encima de eso, o si un creador se desboca con Nano Banana, los costes se disparan.

**Hoy NO existe ningún mecanismo para:**
- Saber qué creador ha quemado cuánto en llamadas Gemini
- Frenar un loop descontrolado (una automatización que llame a la AI 10k veces)
- Cobrar tiers enterprise por uso superior
- Mostrar al creador su consumo (transparencia = confianza)

Este sprint introduce un **ledger de créditos** separado del Wallet de dinero (D1) para gestionar el consumo AI como su propia superficie de producto.

> **Relacionado pero distinto:** el Wallet de dinero (`src/backend/wallet/`) gestiona flujos reales de dinero (pagos Stripe, ingresos del creador, payouts). El ledger de créditos AI gestiona una unidad contable interna no redimible. Mezclarlos confundiría dos modelos mentales independientes.

---

## 2 · Objetivos y no-objetivos

### Objetivos
- **G1** Fuente única de verdad para el balance de créditos AI por usuario: ledger `AICreditWallet`.
- **G2** Toda llamada AI (existente + futura) consume créditos ANTES de invocar el modelo. Si insuficiente → respuesta tipo 402 ("sin créditos") con UX limpia.
- **G3** Top-up automático mensual por tier (free / pro / enterprise) vía cron. Los créditos no usados expiran a fin de mes (sin rollover) — mantiene la matemática simple y previene acumulación abusiva.
- **G4** Compra manual de packs de créditos vía Stripe (el creador compra packs de €5/€20/€50). Las transacciones aterrizan en el ledger de créditos.
- **G5** Dashboard superadmin con uso por creador + quema total de plataforma + alertas en picos de coste.
- **G6** Superficie en el dashboard del creador: "Te quedan X créditos AI este mes (renueva el día Y)".

### No-objetivos
- Facturación real a creadores del coste exacto de Gemini (los créditos son una unidad opaca, nunca le cobramos al creador el coste literal).
- Conversión cross-currency para los packs de créditos (todo en EUR).
- Pools de créditos compartidos para reseller / white-label (todo el sistema es por UID individual).
- Migrar el uso actualmente sin cap a créditos sin ventana de gracia (rollout gradual — ver §6 abajo).

---

## 3 · Decisiones a bloquear ANTES de empezar a programar

Estas son **decisiones PM** requeridas como gating items. Casi todas se responden mejor tras revisar el estudio de pricing.

| # | Pregunta | Decisión bloqueada | Estado |
|---|----------|--------------------|--------|
| **D-AC-1** | Definición de la unidad de crédito | **1 crédito = 1 milésima de USD-equivalente del coste Gemini en precio retail** (es decir, 1000 créditos = $1). La conversión crédito→llamada es una pequeña tabla de lookup por modelo. Internamente mostramos créditos, nunca USD crudo al usuario. | ✅ caangogi · 2026-05-10 |
| **D-AC-2** | Cuota mensual del tier free | **500 créditos/mes ≈ $0.50** (per estudio: cubre ~7 covers + 50 turnos de editor + 3 magic docs + 30 consultas RAG — un creador "probando el producto"). Recalibrar tras 2 semanas de modo logging-only. | ✅ caangogi · 2026-05-10 |
| **D-AC-3** | Cuota mensual del tier pro | **5000 créditos/mes (€9/mes plan plataforma)** ≈ $5 de coste real → ~44% margen bruto sobre el coste Gemini directo. | ✅ caangogi · 2026-05-10 |
| **D-AC-4** | Pricing de packs de top-up | **€5 = 2500 créditos · €20 = 12000 créditos (20% bonus) · €50 = 35000 créditos (40% bonus)**. Los bonuses incentivan packs grandes y mejoran nuestra contribución. | ✅ caangogi · 2026-05-10 |
| **D-AC-5** | Política de expiración | **Créditos otorgados (mensuales): expiran fin de mes, sin rollover. Créditos comprados (top-up): SÍ rollover (es dinero real del creador, no podemos confiscarlo).** | ✅ caangogi · 2026-05-10 |
| **D-AC-6** | Comportamiento al quedarse sin créditos | **Bloqueo duro + UX claro**: "Te has quedado sin créditos AI este mes. Renueva el día X o compra un pack." NO throttle silencioso (engaña al usuario que cree que la AI funciona mal). | ✅ caangogi · 2026-05-10 |
| **D-AC-7** | Creadores preexistentes en el lanzamiento | **Otorgar 1 mes de tier Pro como buena fe.** Después caen a su tier real (free salvo upgrade). Comunicación clara por email + in-app. | ✅ caangogi · 2026-05-10 |
| **D-AC-8** | Modelo de tiers — ¿planes AI separados o bundled con el plan general de plataforma? | **Bundled: el plan general del creador determina su tier AI**. NO hay "suscripción AI" aparte. Más simple, mejor experiencia. | ✅ caangogi · 2026-05-10 |
| **D-AC-9** *(añadida)* | Routing per-feature: ¿todas las llamadas AI por el mismo backend, o split por sensibilidad de datos? | **Split per-feature.** Journaling (Fase 6.1) y RAG Companion (Fase 6.2) van **siempre** por Vertex AI con DPA firmado, independientemente del tier del creador. Editor/cover/magic-doc/structure pueden ir por AI Studio paid tier. La razón: datos de salud (Art. 9 GDPR) en Journaling NO son negociables. Ver §11 abajo. | ✅ caangogi · 2026-05-10 (decisión derivada de la conversación sobre la pregunta crítica) |

> **Mecanismo de sign-off:** PM reemplaza ⏳ por ✅ + iniciales + fecha en esta tabla. El reviewer puede tirar atrás cualquier decisión; nueva revisión del PRD si alguna decisión flipa.

---

## 4 · Estado actual (auditoría rápida; auditoría completa con el §6 plan)

- **5 endpoints AI en producción** (assistive-edit, ai-cover ×2, ai-generate, ai-structure). Todos usan `src/lib/ai/genai.client.ts` directo. NINGUNO chequea ni decrementa balance de créditos.
- **No existe entidad `AICreditWallet`**. Greenfield total.
- **No hay logging de uso** — el `AIUsageLog` está planificado para Fase 6.0.3 pero no construido. **El sprint de créditos debe construirlo como prerequisito hard** (no puedes decrementar un balance sin registrar qué se consumió y a qué coste).
- La integración Stripe ya soporta pagos one-time (usados para compra de cursos) — los packs de top-up reutilizan el mismo flujo `checkout.session.completed` con metadata `purchase_type: 'ai_credits_topup'`.
- El guard de idempotencia del webhook (F1.4b) ya cubre el flujo de compra top-up de forma segura — sin grants duplicados de créditos en re-deliveries de Stripe.
- **NUEVO post-T6.0.1**: la prompt library en `src/lib/ai/prompts/` ya emite `meta.feature` y `meta.version` por llamada. Eso facilita el `AIUsageLog` enormemente — basta con loggear esos campos junto a {tokens, model, cost}.

---

## 5 · Estado objetivo (to-be)

```
Cada endpoint AI:
   1. Resuelve userId desde auth
   2. Mira coste(modelName, tokensEstimados) — vía tabla estática
      respaldada por el research de pricing
   3. AICreditWallet.tryDebit(userId, costeEnCreditos)
        → éxito: continúa con la llamada Gemini real, luego loggea a AIUsageLog
        → fallo (balance insuficiente): retorna 402 con payload "sin créditos"

En cada ciclo de billing (cron, mensual):
   1. Para cada usuario, mira su tier (desde el perfil o suscripción)
   2. Resetea créditos otorgados al monto del tier
   3. Mantiene cualquier crédito comprado (rollover de top-up)

Superficies UI:
   - Dashboard del creador: "Créditos AI: 8.40 / 10.00 · renuevan en 12 días"
     + botón "Comprar más" → checkout Stripe con metadata
   - Dashboard superadmin: quema semanal, top spenders, coste vs ingreso por creador
   - Modal "sin créditos": copy claro + CTAs upgrade/topup
```

---

## 6 · Estrategia de migración (3 fases — TBD pendiente decisiones)

### AC1 · Foundation (~1 sprint)
- `AICreditWalletEntity` + repo Firebase (patrón ledger, balance derivado de transacciones)
- Tabla de costes en `src/lib/ai/pricing.ts` poblada desde el research
- Helper `chargeForAICall(userId, model, tokensEstimados): Promise<{allowed, costeEnCreditos}>`
- Entidad `AIUsageLog` (que también es Fase 6.0.3 — se hace en este sprint, con tracking recíproco de créditos)
- Feature flag `AI_CREDITS_ENFORCEMENT_ENABLED` por defecto OFF (modo logging-only primero)

### AC2 · Rollout logging-only (~2 semanas modo shadow)
- El flag se mantiene OFF en producción. Cada llamada AI loggea coste estimado a `AIUsageLog`.
- Corre en paralelo con la operación normal durante 2 semanas para recopilar datos de uso REALES y validar el sizing de §3.
- Ajustar los números de §3 según lo observado.

### AC3 · Enforcement + UX rollout (~1 sprint)
- Flipar el feature flag a ON.
- Cron mensual otorga créditos por tier.
- Flujo Stripe top-up live (checkout, webhook handler, grant de créditos al pago exitoso).
- Dashboard surfaces lanzan.
- Modal "sin créditos" en cada feature AI.

---

## 7 · Estrategia de testing (preview)

- **TDD-strict** para `src/backend/ai-credits/` (se añade a la lista TDD-strict de testing-strategy.md cuando arranque el sprint) — los créditos son proxies de dinero real, errores de matemática golpean el bottom line.
- Tests basados en propiedades para el ledger: `forall txList : sum(txList.amount) === wallet.balance`.
- El script de migración del grant goodwill 1-mes-Pro (D-AC-7) necesita idempotencia (re-ejecutar no duplica grants).
- E2E para el flujo de compra top-up vía Stripe test mode.

---

## 8 · Riesgos (preview)

| Riesgo | Mitigación |
|--------|------------|
| El research de pricing está incorrecto/desactualizado | Tratarlo como input; revisar trimestralmente. La tabla de costes es data, no código. |
| Grant del free-tier demasiado generoso → pérdidas | Modo logging-only (AC2) calibra ANTES del enforcement |
| Grant del free-tier demasiado tacaño → adopción muerta | Mismo — fase de calibración + lever fácil de subir |
| El grant goodwill al lanzamiento confunde a creadores tempranos | Anuncio claro in-app + email |
| UX de "sin créditos" demasiado punitivo | CTAs "renueva el X / compra pack", no solo "bloqueado" |
| Race conditions en top-up Stripe | F1.4b idempotency ya protege |
| Pico de coste por un creador descontrolado | Cap diario por creador adicional al cap mensual; alerta al 80% |
| Free tier de AI Studio entrena con datos | **🚨 Bloqueante** — si se confirma, todo el tráfico va por Vertex/paid AI Studio absorbido por la plataforma. Founder debe responder antes de bloquear D-AC-2 |

---

## 9 · Preguntas abiertas (a cerrar cuando aterricen las decisiones)

- ¿Cuál es el €/€/€ real de la estructura de tiers de la plataforma? (free/pro/enterprise son placeholders)
- ¿Ofrecemos contratos enterprise custom con bring-your-own-API-key? (cambiaría significativamente el modelo de coste)
- ¿Hay venta B2B donde la plataforma paga Gemini directo desde un budget separado vs cargarlo al creador?
- ¿Cuál es nuestro techo aceptable de gasto mensual Gemini al MRR actual?
- **🚨 Crítica:** ¿el free tier de AI Studio entrena con los datos del usuario? (impacto: si sí → no podemos usarlo para creadores holísticos sin consentimiento explícito; si no → podemos absorber gratis a usuarios free-tier)

---

## 11 · Routing AI por sensibilidad de datos (decisión D-AC-9)

Aunque el sprint sea "AI Credits", la conversación de PM derivó esta decisión arquitectónica que afecta el wallet:

| Feature AI | Backend obligatorio | Razón |
|------------|--------------------|-------|
| `editor` (assistive-edit) | AI Studio paid tier ✅ (o Vertex si se confirma necesario) | Contenido del creador, bajo riesgo |
| `cover` (Nano Banana ×2) | AI Studio paid tier ✅ | Prompts estéticos, sin sensibilidad |
| `magic-doc` (lead magnet) | AI Studio paid tier ✅ | Texto autoría del creador |
| `course-structure` | AI Studio paid tier ✅ | Metadatos de curso, sin sensibilidad |
| **`journaling-sentiment` (Fase 6.1)** | **Vertex AI · región EU · DPA firmado · zero-retention** | Datos de salud (GDPR Art. 9) — NEGOCIABLE solo con consentimiento granular del estudiante |
| **`rag-companion` (Fase 6.2)** | **Vertex AI · región EU · DPA firmado** | Propiedad intelectual del creador (PDFs, cursos completos) |
| `agente-secretarial` (Fase 6.3) | Vertex AI · DPA firmado | Conversaciones con pacientes — datos personales identificables |

**Implicación para el wallet:**
- `AICreditWallet.tryDebit()` recibe el `featureSlug` y el wrapper de AI elige el backend correcto via `GEMINI_BACKEND_<feature>` env var
- El coste por llamada depende del backend (Vertex tiene pricing similar pero ligeramente distinto a AI Studio paid tier)
- La tabla de costes en `src/lib/ai/pricing.ts` carga el coste por (modelo, backend) tuple, no solo por modelo

**Tarea pendiente del founder (NO bloquea el sprint):**
- Investigar si AI Studio free tier entrena con datos del usuario — ver §9 pregunta crítica
- Si sí: TODO va por paid tier o Vertex (la economía no cambia, ya costeamos así)
- Si no: editor/cover/magic-doc/structure de creadores free pueden ir por AI Studio free tier sin consumir nuestro presupuesto, mejorando margen
- Acción concreta: pregunta escrita a Google Cloud sales + lectura de https://ai.google.dev/gemini-api/terms y https://cloud.google.com/terms/service-terms

---

## 10 · Referencias

- Input de pricing: [documentation/research/gemini-pricing-2026-05.md](../research/gemini-pricing-2026-05.md)
- PRD del wallet de dinero (concepto separado): [documentation/prds/wallet-ledger-migration.md](./wallet-ledger-migration.md)
- Roadmap viewer: [documentation/index.html](../index.html) § callout "Sprint AI Pricing & Credits System"
- Estrategia de testing: [documentation/testing-strategy.md](../testing-strategy.md) — `src/backend/ai-credits/` se unirá a la lista TDD-strict
- Prompt library (T6.0.1, ya en producción): [src/lib/ai/prompts/](../../src/lib/ai/prompts/) — emite `meta.feature` + `meta.version` que el `AIUsageLog` consume
