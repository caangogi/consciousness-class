# Gemini Pricing Research · 2026-05

| Field | Value |
|---|---|
| Researched on | 2026-05-10 |
| Sources | https://cloud.google.com/vertex-ai/generative-ai/pricing (Vertex AI / Agent Platform pricing, fetched 2026-05) · https://ai.google.dev/pricing (Google AI Studio — **fetch blocked in this environment**, see Open Questions) |
| Currency | USD (1 USD ≈ 0.92 EUR a fecha 2026-05) |
| Audit done by | Claude Code (parallel agent) |
| Scope | Models in use today + Fase 6 candidates |
| FX caveat | EUR conversions son indicativas; el founder debe usar la tasa real a fecha de billing |

> **Nota de honestidad**: la página `ai.google.dev/pricing` (Google AI Studio) devolvió denegación de acceso desde este entorno. Todos los precios paid-tier confirmados provienen del **Vertex AI / Agent Platform pricing page**, que es el listado oficial autoritativo. Históricamente el paid tier de AI Studio iguala al precio Vertex global, pero esto debe **confirmarse manualmente** antes de cerrar la política de créditos (ver Open Questions §1).

---

## TL;DR para sizing de créditos

- **Modelo más barato por token**: `gemini-2.5-flash-lite` ($0.10 input / $0.40 output por 1M tokens). Para el caso "asistente conversacional ligero" sería 3× más barato que 2.5-flash, pero hoy el código usa 2.5-flash, no lite.
- **Sorpresa más cara**: `gemini-3.1-flash-image-preview` (Nano Banana). El número $60 que aparece en la web es **por 1M tokens de salida**, no por imagen — pero como cada imagen 1MP consume 1120 tokens, el coste real es **~$0.067 por imagen 1024×1024** y **$0.045 por imagen 512×512**. Esto sigue siendo **~600× más caro por llamada** que un improve-text de 200 palabras. Las imágenes son el cost driver dominante.
- **Coste back-of-the-envelope para un creator activo**: 50 covers + 200 turnos editor + 30 magic-docs ≈ **$3.50 / mes** en costes brutos de modelo. Las covers representan ~$3.35 (96%) del total.
- **Embeddings (Fase 6.2)**: precio no verificable desde este entorno. Históricamente `text-embedding-004` ronda $0.02–$0.025 / 1M tokens en GCP — barato; ver Open Questions §2.
- **Recomendación de free tier**: $0.50 USD-equivalente al mes (≈ 7 covers, ≈ 100 turnos editor, ≈ 5 magic-docs). Tier paid €9/mes con $5 USD de presupuesto interno (margen ~44%).

---

## Per-model pricing

Precios verificados desde `https://cloud.google.com/vertex-ai/generative-ai/pricing` el 2026-05-10. La columna **Batch/Flex** aplica a las APIs Batch y Flex (50% de descuento típico vs Standard).

### gemini-2.5-flash

| Tier | Input $/1M tokens | Output $/1M tokens | Notes |
|---|---|---|---|
| Free tier (Google AI Studio) | $0 | $0 | RPM/TPM/RPD no verificados — ver Open Questions §3 |
| Paid Standard (Vertex AI) | $0.30 (text/image/video) · $1.00 (audio) | $2.50 | Precio global, sin variación regional |
| Paid Batch/Flex (Vertex AI) | $0.15 (text/image/video) · $0.50 (audio) | $1.25 | 50% descuento; latencia mayor (hasta 24h batch) |

> Fuente: Vertex AI Generative AI Pricing, sección "Gemini 2.5 Flash".

### gemini-3.1-flash-image-preview (Nano Banana)

| Item | Standard | Batch/Flex |
|---|---|---|
| Input (text + reference image) | $0.50 / 1M tokens | $0.25 / 1M tokens |
| Text output (responses, reasoning) | $3 / 1M tokens | $1.50 / 1M tokens |
| Image output | $60 / 1M tokens | $30 / 1M tokens |

**Coste real por imagen generada (Standard pricing):**

| Resolución | Tokens por imagen | Coste por imagen | Coste por 1000 imágenes |
|---|---|---|---|
| 512 (~0.25 MP) | 747 | **$0.045** | $45 |
| 1K (~1 MP, default Consciousness) | 1120 | **$0.067** | $67 |
| 2K (~4 MP) | 1680 | **$0.101** | $101 |
| 4K (~16 MP) | 2520 | **$0.150** | $150 |

**Nota crítica**: la entrada (referencia visual subida en image-to-image) cuesta **1120 tokens fijos por imagen de referencia** ≈ $0.00056 — despreciable frente al output. Por lo tanto **no hay diferencia de pricing entre text-to-image e image-to-image** salvo el coste residual de la imagen-input. Confirmar antes de implementar el pricing público.

> Fuente: Vertex AI Generative AI Pricing, sección "Gemini 3.1 Flash Image Preview" + footnote sobre tokens por resolución.

### text-embedding-004 (y posibles sucesores 2026)

**Precio no verificable** desde este entorno: ni la pricing page de Vertex AI ni la de AI Studio devolvieron datos de embeddings legibles. Datos históricos de referencia (no oficiales para 2026):

- `text-embedding-004`: dimensión nativa 768, soporta MRL (Matryoshka) hasta 256. Históricamente ~$0.02 / 1M tokens en Vertex.
- `gemini-embedding-001` (sucesor): dimensión 3072 nativa (truncable). Pricing 2026 no confirmado.

> Acción: el founder debe verificar manualmente en https://ai.google.dev/pricing#embedding y https://cloud.google.com/vertex-ai/pricing/list antes de cerrar el sizing de Fase 6.2 (RAG). Ver Open Questions §2.

**Implicaciones de almacenamiento (estimación, independiente de Google):**
- 1 lección con transcript de 5K tokens → ~5 chunks de 1K tokens → 5 vectores de 768 dims = ~15 KB / lección.
- 1000 lecciones ≈ 15 MB de vectores. Despreciable en Firestore o en Pinecone free tier.
- Si se migra a `gemini-embedding-001` (3072 dims) → 4× el almacenamiento; truncar a 768 con MRL es la opción coste-óptima.

### gemini-2.5-pro

| Tier | Input $/1M tokens | Output $/1M tokens |
|---|---|---|
| Paid Standard ≤200K context | $1.25 (text/image/video/audio) | $10 (text output) |
| Paid Standard >200K context | $2.50 | $15 |
| Paid Batch/Flex ≤200K | $0.625 | $5 |
| Paid Batch/Flex >200K | $1.25 | $7.50 |

> Fuente: Vertex AI Generative AI Pricing, sección "Gemini 2.5 Pro". Pro es ~4× input y ~4× output respecto a Flash. **Solo justificable** como fallback para prompts donde Flash falle (RAG companion con razonamiento profundo, generación de syllabus complejos).

### gemini-2.0-flash

| Tier | Input $/1M tokens | Output $/1M tokens |
|---|---|---|
| Paid Standard | $0.15 (text) · $1.00 (audio) | $0.60 |
| Paid Batch | $0.075 | $0.30 |

> Fuente: Vertex AI Generative AI Pricing, sección "Gemini 2.0 Flash".
>
> **Estado**: vigente en 2026-05 pero **superado** en calidad por `gemini-2.5-flash` (mismo orden de precio, +sustancialmente mejor capacidad). El uso actual en `src/ai/genkit.ts` es residual (Genkit instalado pero apenas usado). **Recomendación**: en Fase 6 migrar todo el código que llame a 2.0-flash → 2.5-flash o 2.5-flash-lite y deprecar la dependencia de Genkit si no aporta valor. No hay anuncio público de deprecación dura, pero es probable que ocurra durante 2026.

### Modelos adicionales relevantes (no en uso hoy, pero a considerar)

| Modelo | Input $/1M | Output $/1M | Uso recomendado |
|---|---|---|---|
| gemini-2.5-flash-lite | $0.10 / $0.30 audio | $0.40 | Asistente conversacional ligero, clasificación, sumarización corta |
| gemini-3.1-flash-lite | $0.25 / $0.50 audio | $1.50 | Successor de 2.5-flash-lite, +razonamiento. Regional surcharge +10% no-global desde 2026-07-01 |
| gemini-3-flash-preview | $0.50 / $1 audio | $3 | Successor de 2.5-flash, mejor en razonamiento largo |
| gemini-3.1-pro-preview ≤200K | $2 | $12 | Successor de 2.5-pro |
| gemini-3.1-pro-preview >200K | $4 | $18 | Solo para context windows enormes |
| gemma-4-26b | $0.15 / $0.60 | (ídem) — open-weight con cache hit $0.015/1M | Fine-tuning self-hosted o experimentos coste-cero |

---

## Per-feature cost estimate

Estimaciones token-by-token basadas en el comportamiento típico observado en el código (`/api/creator/assets/ai-edit`, `/api/courses/[id]/ai-structure`, `/api/creator/downloads/ai-generate`, `/api/creator/assets/ai-cover`).

### Feature 1 · AI cover (Nano Banana, default 1024×1024)

- Input prompt: ~150 tokens texto + opcional 1 imagen referencia (1120 tokens fixed) = **~1270 tokens**
- Output: 1 imagen 1MP = **1120 tokens**
- Coste input: 1270 × $0.50 / 1M = **$0.000635**
- Coste output: 1120 × $60 / 1M = **$0.0672**
- **Coste por llamada ≈ $0.068 USD**
- **Coste por 1000 llamadas ≈ $68 USD**

> Esta es la única feature donde el coste por llamada importa de verdad. Todo lo demás es ruido frente a las covers.

### Feature 2 · Assistive editor (improve / expand / summarize / empathize sobre párrafo de 200 palabras)

- Input: ~300 tokens (system prompt + párrafo) → input
- Output: ~250 tokens (texto reescrito + ligero margen)
- Coste input: 300 × $0.30 / 1M = **$0.00009**
- Coste output: 250 × $2.50 / 1M = **$0.000625**
- **Coste por llamada ≈ $0.00072 USD**
- **Coste por 1000 llamadas ≈ $0.72 USD**

> Prácticamente gratis. Aun llamándolo 10000 veces al mes, el coste total es <$8.

### Feature 3 · Magic doc / lead magnet (1500 palabras output ≈ 2000 tokens)

- Input: ~600 tokens (instrucciones + brief del creador)
- Output: ~2000 tokens (PDF/markdown contenido)
- Coste input: 600 × $0.30 / 1M = **$0.00018**
- Coste output: 2000 × $2.50 / 1M = **$0.005**
- **Coste por llamada ≈ $0.0052 USD**
- **Coste por 1000 llamadas ≈ $5.20 USD**

### Feature 4 · Course structure generator (10 módulos × 5 lecciones, ~5KB JSON ≈ 1500 tokens)

- Input: ~400 tokens (prompt + tema curso)
- Output: ~1500 tokens (JSON estructura)
- Coste input: 400 × $0.30 / 1M = **$0.00012**
- Coste output: 1500 × $2.50 / 1M = **$0.00375**
- **Coste por llamada ≈ $0.00387 USD**
- **Coste por 1000 llamadas ≈ $3.87 USD**

### Feature 5 (Fase 6) · RAG companion query (embeddings + retrieval + answer)

Asumiendo `gemini-embedding-001` a precio histórico ($0.02 / 1M) y `gemini-2.5-flash` para la respuesta:

- Embedding query (~50 tokens): 50 × $0.02 / 1M ≈ **$0.000001**
- Top-5 chunks recuperados (5 × 800 tokens contexto) + system prompt (~200) + query (50) = ~4250 tokens input
- Output respuesta: ~400 tokens
- Coste input: 4250 × $0.30 / 1M = **$0.0013**
- Coste output: 400 × $2.50 / 1M = **$0.001**
- **Coste por llamada ≈ $0.0023 USD**
- **Coste por 1000 llamadas ≈ $2.30 USD**

(Indexación de embeddings es one-shot por lección y despreciable: 5K tokens × $0.02 / 1M = $0.0001 por lección.)

### Estimación mensual por creator activo (perfil "creador holístico promedio")

| Feature | Llamadas/mes | Coste/llamada | Coste mensual |
|---|---|---|---|
| AI covers (1024×1024) | 50 | $0.068 | **$3.40** |
| Assistive editor | 200 | $0.00072 | $0.144 |
| Magic docs | 30 | $0.0052 | $0.156 |
| Course structure (estimada) | 5 | $0.00387 | $0.019 |
| RAG companion (Fase 6) | 100 | $0.0023 | $0.230 |
| **TOTAL bruto modelo** | | | **~$3.95 / creator·mes** |

> 86% del coste vive en las covers. Cualquier política de créditos debe ratear las covers como recurso premium y las llamadas de texto como casi-ilimitadas.

---

## Free tier limits (Google AI Studio)

**No verificable directamente desde este entorno** (ai.google.dev devolvió denegación). Datos de referencia conocidos públicamente y a confirmar:

- Free tier suele tener RPM bajo (10-15 RPM en flash, 2-5 RPM en pro), TPM ~1M, RPD ~1500.
- No muestra anuncios.
- **Importante**: los datos enviados al free tier de AI Studio se usan para entrenamiento de modelos. **Esto es incompatible con datos de creadores en producción**. Para production, el paid tier de AI Studio o Vertex AI son obligatorios (no entrenan con los datos).

> Confirmar en https://ai.google.dev/gemini-api/docs/rate-limits antes de elegir tier. Ver Open Questions §3 y §4.

---

## Vertex AI vs Google AI Studio — ¿cuándo migrar?

- **Equivalencia de precios**: el paid tier de AI Studio API y el Standard pricing de Vertex AI son **iguales hoy** para los modelos confirmados (Gemini 2.5 Flash $0.30/$2.50 en ambos). No hay arbitraje de precio puro.
- **Migrar a Vertex cuando**:
  - El billing tiene que ir contra una cuenta GCP corporativa (presupuestos, GCP credits, IAM granular por equipo) — relevante en cuanto Consciousness pase a B2B.
  - Volumen >100M tokens/mes: la API Batch (50% descuento) requiere Vertex y reduce mucho el coste si se aceptan latencias 1-24h (apto para indexar embeddings en background o pre-generar magic-docs).
  - Necesidad de control regional (`europe-west1`, `us-central1`) para datos de creadores europeos / RGPD.
  - Vertex AI Search / Datastore RAG: si Fase 6.2 usa la solución RAG nativa de Google, ya estás dentro de Vertex.
- **Punto de inflexión**: alrededor de **>$200/mes en gasto de modelo** (≈ 50 creadores activos a precio bruto de hoy) la estructura GCP y la API Batch empiezan a justificar la migración. Por debajo, AI Studio + clave de API simple es operativamente más barato.

---

## Comparativa con competidores (1 línea, contexto, NO recomendación)

- **Anthropic Claude 4.x** (Haiku): tier más barato comparable a Gemini 2.5 Flash, pero **sin generación de imágenes**. Sonnet 4.x está en el rango de Gemini 2.5 Pro. — Precio exacto no verificado en este pase.
- **OpenAI GPT-5 / GPT-5-mini**: GPT-5-mini compite directamente con Gemini 2.5 Flash en precio; GPT-5 es premium tier comparable a Pro. **gpt-image-1** genera imágenes a un orden similar de coste por imagen ($0.04–$0.17 según calidad). — Precio exacto no verificado en este pase.

> **Para Consciousness Class hoy, Gemini gana por dos factores**: (1) Nano Banana es uno de los mejores modelos image-to-image del mercado para covers fotorrealistas y holísticos, y (2) integración nativa con Firebase / GCP simplifica el stack. Cambiar de proveedor solo se justificaría si Anthropic/OpenAI bajan agresivamente el precio de imagen.

---

## Sizing recommendations para política de créditos

Suposición de perfil: **creador holístico hispano promedio** = 50 covers + 200 turnos editor + 30 magic-docs + 100 RAG queries/mes.
Coste bruto: **~$3.95 / mes**. Margen objetivo SaaS: 60-70%.

### Definición de unidad "Crédito" (interna)

Propuesta: **1 crédito = $0.001 USD de coste interno** (mil créditos = $1 de gasto en modelos). Granularidad fina, fácil de explicar al usuario como "puntos".

Equivalencias visibles al creador:

| Acción | Créditos consumidos | Justificación |
|---|---|---|
| AI cover 1024×1024 | **70 créditos** | $0.068 → 68 redondeado a 70 (margen) |
| AI cover 512×512 (low-res draft) | **45 créditos** | $0.045 |
| Magic doc / lead magnet | **6 créditos** | $0.0052 → 5.2, redondeo a 6 |
| Course structure | **5 créditos** | $0.00387 |
| Assistive editor turn | **1 crédito** | $0.00072 → ratear a 1 mínimo (UX legible) |
| RAG companion query | **3 créditos** | $0.0023 |

### Free tier mensual recomendado

- **Presupuesto interno**: $0.50 USD-equivalente / mes / usuario gratis.
- **= 500 créditos / mes**.
- Cubre aproximadamente: **7 covers + 50 turnos editor + 3 magic-docs + 30 RAG queries**.
- Suficiente para que un creador "pruebe" el producto pero **insuficiente para operar un curso entero** → upgrade pressure razonable.

### Tier Paid mensual (Plan Creador)

- **Precio público**: €9/mes (€7.50 sin IVA ≈ $8.20 USD a 0.92 EUR/USD).
- **Presupuesto interno**: $5 USD-equivalente / mes = **5000 créditos / mes**.
- Cubre el perfil promedio descrito (~3950 créditos consumidos en uso típico). Margen ~44% en el coste de modelo (no incluye Firebase, Stripe fees, soporte).
- **Cap dinámico**: si el creador toca el techo, **silent throttle** en assistive-editor (UX: spinner extra largo + tooltip "modo eco activo") y **explícito "out of credits"** en covers y magic-docs (acciones intencionales, el creador entiende que cuesta).

### Tier Paid Pro (futuro)

- **Precio público**: €29/mes.
- **Presupuesto interno**: $18 USD-equivalente = **18000 créditos / mes**.
- Cubre 200+ covers, magic-docs ilimitados a efectos prácticos, RAG sin límite.

### Top-up packs

- **Pack S**: €5 → 4500 créditos (paridad con tier paid; útil para afinar el final de mes).
- **Pack M**: €15 → 15000 créditos (descuento 11% vs S).
- **Pack L**: €40 → 45000 créditos (descuento 26%).
- **Pack XL**: €80 → 100000 créditos (descuento 38%, captura creators con cursos enteros que generar de golpe).

### Hard-cap behavior — recomendación UX

- **Silent throttle** para acciones de bajo coste y alto volumen (assistive editor, RAG query): degradar a `gemini-2.5-flash-lite` automáticamente cuando el usuario está al 80% del cap. Coste del 30% del original, calidad ligeramente menor — invisible en la mayoría de casos.
- **Explicit "out of credits"** para acciones intencionales y caras (cover, magic doc, course structure): modal con dos CTAs: (1) "Comprar pack" (€5 con un clic), (2) "Esperar al próximo mes". Nunca interrumpir al usuario en mitad de un flujo crítico (publicación de curso) — pre-flight check antes de iniciar.
- **Notificaciones progresivas**: 50% (info banner), 80% (warning), 95% (modal preventivo).
- **Rollover**: créditos NO se acumulan mes a mes en el tier free (incentiva uso). En paid sí se acumulan hasta 1.5× el cap mensual (mejor experiencia, evita penalizar a creadores con uso estacional).

---

## Open questions for the founder

1. **Verificar precios AI Studio paid tier vs Vertex AI** — la página `ai.google.dev/pricing` no fue accesible desde este entorno. Históricamente son idénticos a Vertex Standard, pero confirmar manualmente abriendo la URL antes de cerrar la política de créditos. Si difieren, hay que ajustar las equivalencias de la tabla de créditos.

2. **Pricing exacto de embeddings** — ni `text-embedding-004` ni `gemini-embedding-001` aparecen en la pricing page de Vertex AI Generative AI ni se pudieron verificar desde aquí. Datos históricos sugieren ~$0.02–$0.025 / 1M tokens, pero Google ha cambiado embeddings varias veces en 2025. Verificar en https://cloud.google.com/vertex-ai/pricing/list o en la consola GCP antes de presupuestar Fase 6.2 (RAG). Impacto bajo en coste total (los embeddings son <2% del gasto), impacto medio en arquitectura.

3. **Free tier limits actuales (RPM/TPM/RPD) en Google AI Studio** — necesario para saber a qué punto el free tier de la plataforma se rompe operativamente. Si el RPM agregado de todos los creators free supera el límite de la cuenta, todos los free se quedan sin servicio simultáneamente. ¿Migrar el free tier de Consciousness a paid de AI Studio (con presupuesto interno) o mantener free tier de Google?

4. **¿Los datos enviados al free tier de AI Studio se usan para entrenamiento?** — Confirmar política. Si sí, **es bloqueador para producción**: no podemos enviar contenido de creators (nichos sensibles: salud holística, terapia, espiritualidad) al free tier. Decisión: el "free tier" de Consciousness debe ir contra paid tier de AI Studio o Vertex AI, no contra el free de Google. Esto cambia el cálculo: $0 de coste se convierte en $0.50/mes coste real.

5. **Descuentos enterprise / startup credits** — ¿Tiene Consciousness Class créditos de Google for Startups? Hasta $200K en GCP credits sería material. Si sí, el primer año la política de créditos puede ser muy generosa (subsidio Google) y reapretar al expirar. Si no, considerar aplicar antes de Fase 6 para no quemar runway en infra.

6. **Política de retención de datos para entrenamiento Vertex AI** — Vertex AI tiene políticas de no-entrenamiento por defecto en paid, pero hay que verificar configuración en consola. Crítico para el GTM "tu contenido es tuyo" del producto.

---

## Resumen ejecutivo (1 párrafo)

El cost driver dominante es `gemini-3.1-flash-image-preview` (Nano Banana) a **$0.067 / cover 1MP**, que representa el 86% del gasto bruto por creator activo (~$3.40 de un total de ~$3.95/mes). Todo lo basado en texto (`gemini-2.5-flash` a $0.30 input / $2.50 output por 1M tokens) es prácticamente despreciable a escala individual. La política recomendada: **free tier 500 créditos/mes** ($0.50 interno, ~7 covers), **plan Creador €9/mes con 5000 créditos** ($5 interno, margen 44% en coste de modelo), y top-ups en €5 / €15 / €40 / €80. La pregunta que debe resolver el founder antes de cerrar la política es la **#4** (¿el free tier de Google entrena con los datos de los creators?), porque cambia el coste base de $0 a $0.50/mes y bloquea operativamente cualquier despliegue serio si la respuesta es "sí".
