/**
 * urlShortener.js
 * In-memory URL shortener with integrated phishing pre-check.
 * Stored in a plain object — resets when the server restarts.
 */

const { detectThreat } = require('../engine/detectionEngine');

// In-memory store: shortCode → { originalUrl, createdAt }
const store = {};

/** Generates a 6-character alphanumeric random code. */
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Shorten a URL — but only if the phishing check passes.
 * @param {string} url
 * @param {string} baseUrl  The server's public URL (e.g. http://localhost:5000)
 * @returns {Promise<{ shortened: boolean, short_url?: string, short_code?: string, warning?: string, analysis: object }>}
 */
async function shortenUrl(url, baseUrl = 'http://localhost:5000') {
  const analysis = await detectThreat({ text: url, type: 'url' });

  if (analysis.is_phishing) {
    return {
      shortened: false,
      warning:   'URL was flagged as potentially malicious and cannot be shortened.',
      analysis,
    };
  }

  // Avoid duplicate codes
  let code;
  do { code = generateCode(); } while (store[code]);

  store[code] = { originalUrl: url, createdAt: new Date().toISOString() };

  return {
    shortened:  true,
    short_url:  `${baseUrl}/s/${code}`,
    short_code: code,
    analysis,
  };
}

/**
 * Resolve a short code back to the original URL.
 * @param {string} code
 * @returns {string|null}
 */
function resolveCode(code) {
  return store[code] ? store[code].originalUrl : null;
}

/** Return all stored mappings (for debugging). */
function listAll() {
  return Object.entries(store).map(([code, data]) => ({ code, ...data }));
}

module.exports = { shortenUrl, resolveCode, listAll };
