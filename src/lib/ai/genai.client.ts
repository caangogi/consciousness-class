/**
 * Centralized Google GenAI client.
 *
 * Model names are resolved at runtime from Firestore (platform_config/ai_settings),
 * giving non-technical admins full control via the settings UI.
 *
 * Resolution order (most → least specific):
 *   1. Firestore  platform_config/ai_settings.textModel / imageModel
 *   2. Env vars   GEMINI_TEXT_MODEL / GEMINI_IMAGE_MODEL
 *   3. Hard defaults  gemini-2.5-flash / gemini-2.5-flash-preview-image-generation
 *
 * The Firestore read is cached for 30s to avoid a DB hit on every request.
 *
 * To change models: Dashboard → Configuración → Modelos IA → Guardar.
 */
import { GoogleGenAI } from '@google/genai';

// ─── SDK Singleton ────────────────────────────────────────────────────────────

let _client: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (_client) return _client;

  const config: any = {};

  if (process.env.GEMINI_API_KEY) {
    config.apiKey = process.env.GEMINI_API_KEY;
  } else if (process.env.VERTEX_AI_PROJECT) {
    config.vertexai = {
      project: process.env.VERTEX_AI_PROJECT,
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
    };
  } else {
    throw new Error('Neither GEMINI_API_KEY nor VERTEX_AI_PROJECT is configured.');
  }

  config.httpOptions = { timeout: 60_000 };
  _client = new GoogleGenAI(config);
  return _client;
}

// ─── Model Config Cache ───────────────────────────────────────────────────────

interface ModelConfig {
  textModel: string;
  imageModel: string;
}

const DEFAULTS: ModelConfig = {
  textModel: 'gemini-2.5-flash',
  imageModel: 'gemini-3.1-flash-image-preview',
};

let _cachedConfig: ModelConfig | null = null;
let _cacheExpiresAt = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

async function loadConfigFromFirestore(): Promise<ModelConfig> {
  // Only import adminDb server-side (this file is server-only)
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    const doc = await adminDb.doc('platform_config/ai_settings').get();
    if (doc.exists) {
      const data = doc.data() as Partial<ModelConfig>;
      return {
        textModel: data.textModel || process.env.GEMINI_TEXT_MODEL || DEFAULTS.textModel,
        imageModel: data.imageModel || process.env.GEMINI_IMAGE_MODEL || DEFAULTS.imageModel,
      };
    }
  } catch (e) {
    console.warn('[AI Client] Could not load model config from Firestore, using fallback.', e);
  }
  return {
    textModel: process.env.GEMINI_TEXT_MODEL || DEFAULTS.textModel,
    imageModel: process.env.GEMINI_IMAGE_MODEL || DEFAULTS.imageModel,
  };
}

async function getModelConfig(): Promise<ModelConfig> {
  if (_cachedConfig && Date.now() < _cacheExpiresAt) return _cachedConfig;
  _cachedConfig = await loadConfigFromFirestore();
  _cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return _cachedConfig;
}

// ─── Public Accessors ─────────────────────────────────────────────────────────

/** Active text model — resolved from Firestore → env → default. */
export async function getTextModel(): Promise<string> {
  return (await getModelConfig()).textModel;
}

/** Active image generation model — resolved from Firestore → env → default. */
export async function getImageModel(): Promise<string> {
  return (await getModelConfig()).imageModel;
}

/** Force-invalidate the local cache (call after saving new config). */
export function invalidateModelCache(): void {
  _cachedConfig = null;
  _cacheExpiresAt = 0;
}
