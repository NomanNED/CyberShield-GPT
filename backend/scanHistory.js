/**
 * scanHistory.js — In-memory scan log store.
 * Keeps the last MAX_ENTRIES scans across all analysis endpoints.
 * Resets on server restart (acceptable for demo use).
 */

const MAX_ENTRIES = 100;
const store = [];

/**
 * Log a completed scan.
 * @param {object} opts
 * @param {string} opts.type       Human label, e.g. "Phishing Analysis"
 * @param {string} opts.input      Raw input string (will be truncated)
 * @param {'threat'|'warn'|'safe'} opts.verdict
 * @param {number} opts.riskScore  0–100
 * @param {number} [opts.confidence] 0–100
 */
function logScan({ type, input, verdict, riskScore, confidence = 0 }) {
  const entry = {
    id:         Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    input:      typeof input === 'string' ? input.trim().slice(0, 80) : '',
    verdict,
    riskScore:  Math.round(riskScore),
    confidence: Math.round(confidence),
    timestamp:  new Date().toISOString(),
  };

  store.unshift(entry); // newest first
  if (store.length > MAX_ENTRIES) store.length = MAX_ENTRIES;
}

/**
 * Return up to `limit` recent scans.
 */
function getHistory(limit = 20) {
  return store.slice(0, Math.min(limit, MAX_ENTRIES));
}

/**
 * Return aggregate stats.
 */
function getStats() {
  const total   = store.length;
  const threats = store.filter(s => s.verdict === 'threat').length;
  const warns   = store.filter(s => s.verdict === 'warn').length;
  const safe    = store.filter(s => s.verdict === 'safe').length;
  const lastScan = total > 0 ? store[0].timestamp : null;
  return { total, threats, warns, safe, lastScan };
}

function clearHistory() {
  store.length = 0;
}

module.exports = { logScan, getHistory, getStats, clearHistory };
