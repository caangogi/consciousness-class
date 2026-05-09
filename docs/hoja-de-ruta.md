# Hoja de Ruta Maestra - Consciousness Class (AI-First)

Este documento centraliza el roadmap a seguir para transformar Consciousness Class en el ecosistema número 1 para creadores holísticos, psicólogos y terapeutas.

---

## Fase 1: Branding y Consistencia Apple HIG (Completado)
- [x] Migración a marca "Consciousness Class".
- [x] Implementación de paleta de colores natural (Tierra, Arcilla, Aceituna, Hueso).
- [x] Refactorización del dashboard de edición de cursos a `ios-list` (Paso 1, 2 y 3).
- [x] Aplicar esquemas CSS globales (Natureza).
- [x] Auditoría del modo oscuro (Dark Mode) con `Charcoal` / Negro sutil.
- [x] Incorporación de Dashboard Bento Grid (Apple HIG).

## Fase 2: Escalar Cursos (AI-First) (Completado)
- [x] Constructor de Estructuras IA: Agente de LLM integrado (Nano Banana) autogenera Módulos y Lecciones listos en tiempo real sobre la base de datos y UI (drag-and-drop).
- [x] Mini Studio IA (Nano Banana) para generación de portadas Text-to-Image integradas directamente en el flujo de publicación.

## FASE CORE: Arquitectura Unificada "Catálogo de Activos" (Completado)
- [x] Backend Desacoplado: Entidades independientes `Course`, `Membership`, `Download`, `Coaching`, `Podcast`, `Community` con arquitectura hexagonal (Entidad → Repositorio → Servicio → API).
- [x] Entidad ligera `CatalogItem` (Registro Financiero) para checkout unificado. Sincronización automática al crear/actualizar cualquier activo.
- [x] Endpoint unificado `GET /api/creator/catalog` para el storefront.
- [x] Frontend: `/dashboard/products` consume el catálogo unificado. Wizard de creación `/dashboard/products/new` con los 6 tipos de producto activos.
- [x] Builders completos para `Membership`, `Coaching`, `Podcast`, `Community` y `Download` con soporte de portadas IA (Nano Banana refactorizado a endpoint genérico `/api/creator/assets/ai-cover`).
- [x] IA-First: **Assistive Markdown Editor** con menú flotante (tipo Notion) al sombrear texto — acciones: Mejorar Tono, Expandir, Resumir, Empatía (vía `gemini-2.5-flash`).
- [x] IA-First: Generador de "Documento Mágico" para Lead Magnets en el builder de Descargas.
- [x] IA-First: Generador de Plan de Sesión para Coaching. Generador de Normas Comunitarias para Community.
- [x] **Arquitectura Universal de Inscripciones**: Migración de `cursosInscritos` (array plano) a la subcolección `inscripciones` (modelo universal `EnrollmentEntity`) soportando todos los tipos de activos con validaciones centralizadas.

## Fase 3: Motor de Referidos y Pagos Abstractos (Niveles Multi-Tier)
- [ ] Entidad de Política de Referidos (`ReferralPolicyEntity`): Desacoplar las comisiones de los activos. Un creador puede asignar a un activo una política (Ej: "Nivel 1: 30%, Nivel 2: 10%").
- [ ] Orquestador de Pagos Abstracto: Crear interfaces sólidas (Puertos/Adaptadores) de forma que la división de cobros sea agnóstica a la pasarela final (Stripe Connect, Crypto Smart Contracts, Bank Transfers).

## Fase 4: CRM Embebido y Marketing Local Nativo (Nodemailer)
Empoderando a los terapeutas para comercializar sin salir de la plataforma.
- [ ] Motor de **Email Marketing Nativo (Nodemailer)**: Conexión nativa SMTP sin depender brutalmente de terceros. Plantillas elegantes (Natureza style).
- [ ] **Integración WhatsApp Omnicanal**: Opción de conectar el número del terapeuta para recordatorios y OTP.

## Fase 5: Coaching, Agenda y Booking Integrado
- [ ] Motor Nativo de Recepción: Creación de Agenda interna de bloques horarios.
- [ ] Opcional: Integración de Google Calendar OAuth para auto-generación de Google Meet.
- [ ] Interfaz de agendamiento del lado del paciente ultra-minimalista.

## Fase 6: Características AI-First (Diferenciador Core)
### 1. Smart Journaling & Sentiment Tracker
- Diario para estudiantes dentro de sus paneles.
- IA invisible que analiza el sentimiento de texto (NLP) a diario y avisa silenciosamente al terapeuta (Picos de frustración, desánimo, riesgo de deserción del curso) permitiéndole enviar un mensaje en el momento justo.

### 2. Bot "Companion" de Curso (RAG)
- Un widget de chat "Acompañante".
- Estricta técnica RAG (Retrieval-Augmented Generation) anclado *únicamente* a los PDFs, videos y transcripciones subidas por el creador.
- Objetivo: Responder preguntas de forma empática a las 2AM cuando el terapeuta no está, pero con un tono que no alucina información (Safety First).

### 3. Agente Secretarial AI
- Un asistente que procese solicitudes de reservas por WhatsApp o chat, preguntando la disponibilidad del experto e interconectando con la Fase 5 (Agenda).

---

`Última Evolución: FASE CORE y Arquitectura Universal de Inscripciones completadas. El backend base está completamente sólido para soportar los 6 modelos de negocio. Siguiente: Decidir entre Fase 3 (Pagos/Referidos) o Fase 5 (Agenda para habilitar funcionalidad de Coaching).`
