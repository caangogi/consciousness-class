# Testing Strategy · Consciousness Class

> Toda decisión de testing aquí. Cualquier agente Claude Code que vaya a tocar código en este repo **debe** leer este archivo antes de codificar en directorios marcados como TDD-strict.

---

## Filosofía: 3 modos de testing según el dominio

No aplicamos TDD a todo — eso paga un impuesto del 30-50% en velocidad sin retorno proporcional. Tampoco aplicamos test-after a todo — para código que mueve dinero o tiene reglas no triviales, los bugs caros se cuelan ahí. Aplicamos el modo correcto según lo que estés tocando.

| Modo | Disciplina | Aplica a |
|------|-----------|----------|
| **TDD estricto** | Test rojo → impl verde → refactor. **Dos commits separados** en el PR (`test(...)` antes que `feat(...)`). | Ver lista *TDD-strict directories* abajo |
| **Test-after riguroso** | Implementas, escribes test antes de mergear. Sin merge sin test. Cobertura ≥70% en el módulo tocado. | API routes (wire-up), servicios que solo orquestan repos, helpers, utilities |
| **Eval-first** | Antes de tocar el prompt/modelo, defines un golden set de inputs + behaviors esperados. Snapshot + revisión humana. | Todo lo de `src/ai/` y endpoints AI |

---

## TDD-strict directories

**Estos directorios requieren TDD estricto. Sin excepciones.**

```
src/backend/payments/
src/backend/wallet/
src/backend/referrals/
src/backend/booking/        ← solo state machine + reglas refund
src/app/api/webhooks/       ← cualquier webhook handler
```

**Por qué estos:** son lógica pura sin UI, mueven dinero o gobiernan estados con consecuencias legales. Una regresión silenciosa cuesta 100x más que escribir el test primero.

**Cómo se ve un PR conformante:**

```
* feat(T0.3): wire stripe webhook to PaymentOrchestrator
* test(T0.3): impl unit tests for webhook idempotency + race
* test(T0.3): fail Stripe webhook idempotency on duplicate event ID  ← este commit es ROJO
* test(T0.3): fail clawback when refund issued post-affiliate-payout ← este commit es ROJO
```

Los commits `test(...)` que fallan deben aparecer **antes** que el `feat(...)` que los hace pasar. Si el code review no ve esa secuencia, **rechaza el PR**.

---

## Test-after riguroso

Aplicable al resto del backend y a la mayoría de APIs. Reglas:

1. **Cobertura mínima del módulo tocado: 70%** (medido con `npm run test:coverage`).
2. **Test obligatorio para cada path lógico no trivial** (no necesitas testear `return res.json(...)` pero sí cualquier `if/switch` en el handler).
3. **Mocks de Firestore via interface del repositorio**, nunca contra una BD real.
4. **No mergeas sin test verde local + en CI** (cuando exista CI).

---

## Eval-first para AI

**Por qué no TDD aquí:** los outputs de un LLM son no-deterministas. `expect(output).toBe("...")` es teatro — falla por variaciones triviales o pasa por casualidad.

**Qué hacemos:**

1. **Golden set por feature AI** en `src/ai/__evals__/<feature>/`:
   - `inputs.json` — casos de prueba reales del dominio
   - `expected.md` — qué debe contener la respuesta (ej. "menciona la lección X", "incluye disclaimer médico", "no inventa fuentes")
2. **Eval runner manual** (por ahora): script `tsx scripts/eval-ai.ts <feature>` que ejecuta los inputs contra el modelo activo y vuelca outputs a `src/ai/__evals__/<feature>/runs/<timestamp>.md`.
3. **Revisión humana** del diff vs runs anteriores antes de cambiar prompt o modelo.
4. **Cuando un output es claramente erróneo:** se añade al golden set como caso negativo + se ajusta el prompt.

Esto se materializa en **Fase 6.0 · T6.0.5** (Mini suite de evals). No hace falta antes.

---

## Crisis detection y safety filters

Reglas extra para `src/lib/safety/` (cuando exista, en Fase 6.1):

- **Toda lista de keywords de crisis** debe tener test que verifique:
  - Detección case-insensitive
  - Detección con tildes/sin tildes (español)
  - Falsos positivos conocidos NO se gatillan (ej. "no aguanto este café" no debe escalar)
- **El test es parte del PR de la regla**. Sin test, sin merge.

---

## Stack técnico

| Capa | Herramienta | Decisión |
|------|-------------|----------|
| Test runner | **Vitest 2.x** | Compatible con TS sin compilar, watch rápido, API Jest-like, integración Vite/Next |
| DOM | **happy-dom** | Más rápido que jsdom para componentes React |
| Component testing | `@testing-library/react` + `jest-dom` matchers | Estándar de facto |
| Mocks | `vi.mock` built-in | Sin librería extra |
| Path alias `@/*` | `vite-tsconfig-paths` | Lee `tsconfig.json` automáticamente |
| E2E | **Playwright** (próximo: F1.7) | Smoke regresivo de checkout |
| Coverage | `@vitest/coverage-v8` | Solo para módulos en test-after riguroso |

### Convenciones de archivos

- **Co-localizados** para unit tests: `foo.ts` + `foo.test.ts` en la misma carpeta.
- **`__tests__/`** para integration tests dentro de un módulo.
- **`__evals__/`** para golden sets de AI.
- **`e2e/`** en la raíz para Playwright (no se mezcla con unit).
- Sufijo: `.test.ts` para unit, `.spec.ts` reservado para Playwright E2E.

### Scripts npm

```bash
npm test              # vitest run (single pass, lo que corre CI)
npm run test:watch    # vitest --watch (desarrollo)
npm run test:ui       # vitest --ui (debug visual en browser)
```

---

## Cómo arranca un agente Claude antes de codificar

1. **Identifica tu carpeta de trabajo.**
2. **¿Está en la lista de TDD-strict?**
   - **Sí** → escribe el test fallando primero, commit con `test(Tx.x): ...`. Solo entonces escribe la impl, commit `feat(Tx.x): ...`.
   - **No** → escribe la impl. Antes de cerrar el PR, añade tests que cubran el módulo a ≥70%.
3. **¿Estás tocando `src/ai/` o un endpoint que invoca AI?**
   - Sí → mira si hay golden set en `__evals__/`. Si lo hay, corre el eval antes y después. Si tu cambio empeora el behaviour, no mergeas.
4. **Antes de declarar la tarea hecha:** `npm test` verde + `npm run typecheck` verde.

---

## Anti-patrones que NO aceptamos

- ❌ Tests que solo verifican que la función se llamó (sin assertion de valor).
- ❌ `expect(true).toBe(true)` o equivalentes "para subir cobertura".
- ❌ Mocks que duplican la lógica que están testeando.
- ❌ Tests escritos después del bug, sin reproducirlo en rojo primero.
- ❌ Skip de tests con `.skip` sin un comentario `// TODO(<ticket>): por qué`.
- ❌ Tests E2E que tocan Stripe real, Firebase real, o APIs externas reales — esos van en staging manual.
- ❌ Snapshots gigantes generados sin revisión.
