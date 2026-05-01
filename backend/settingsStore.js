/**
 * settingsStore.js — Runtime settings store.
 * Settings survive for the duration of the server process only.
 * On server restart the AI key falls back to GROQ_API_KEY env var.
 */

const settings = {
  groqApiKey:    process.env.GROQ_API_KEY || '',
  groqModel:     process.env.GROQ_MODEL   || 'llama-3.1-8b-instant',
  aiEnabled:     true,
  cacheEnabled:  true,
  maxCacheSize:  200,
  aiTimeout:     6000,   // ms
  scanLogging:   true,
};

const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

function get() {
  return { ...settings };
}

function update(patch) {
  const allowed = Object.keys(settings);
  for (const [k, v] of Object.entries(patch)) {
    if (allowed.includes(k)) {
      settings[k] = v;
    }
  }
  // Keep process.env in sync so aiService still works if it reads it directly
  if (patch.groqApiKey !== undefined) {
    process.env.GROQ_API_KEY = patch.groqApiKey;
  }
  if (patch.groqModel !== undefined) {
    process.env.GROQ_MODEL = patch.groqModel;
  }
  return get();
}

function getPublic() {
  const s = get();
  return {
    groqApiKey:   s.groqApiKey ? `${'*'.repeat(Math.max(0, s.groqApiKey.length - 4))}${s.groqApiKey.slice(-4)}` : '',
    groqApiKeySet: s.groqApiKey.length > 10,
    groqModel:    s.groqModel,
    aiEnabled:    s.aiEnabled,
    cacheEnabled: s.cacheEnabled,
    maxCacheSize: s.maxCacheSize,
    aiTimeout:    s.aiTimeout,
    scanLogging:  s.scanLogging,
    availableModels: GROQ_MODELS,
  };
}

module.exports = { get, update, getPublic };
