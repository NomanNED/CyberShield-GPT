/**
 * CyberGuard – Phishing Detection Analyzer
 *
 * Pure rule-based logic. No external APIs or ML models.
 * Each rule adds a score; the total (capped at 100) determines risk.
 * is_phishing is true when score > 60.
 */

// ── Suspicious keywords with individual weights ─────────────────────────────
const SUSPICIOUS_KEYWORDS = [
  { word: 'urgent',               score: 10 },
  { word: 'verify',               score: 10 },
  { word: 'password',             score: 10 },
  { word: 'bank',                 score: 10 },
  { word: 'click now',            score: 15 },
  { word: 'account suspended',    score: 20 },
  { word: 'login',                score:  5 },
  { word: 'confirm',              score: 10 },
  { word: 'update your',          score: 10 },
  { word: 'limited time',         score: 10 },
  { word: 'act now',              score: 15 },
  { word: 'free gift',            score: 10 },
  { word: 'winner',               score: 10 },
  { word: 'you have been selected', score: 15 },
  { word: 'verify your account',  score: 20 },
];

// Words that convey urgency — used in the urgency+link combination check
const URGENCY_WORDS = [
  'urgent', 'immediately', 'asap', 'expires',
  'limited time', 'act now', 'hurry', 'deadline',
];

/**
 * Attempts to extract the hostname from the first URL found in `text`.
 * Returns null if no URL is present or the URL cannot be parsed.
 * @param {string} text
 * @returns {string|null}
 */
function extractHostname(text) {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (!match) return null;
  try {
    return new URL(match[0]).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Analyzes input text for phishing indicators using rule-based detection.
 *
 * @param {string} text - URL or email body provided by the user
 * @returns {{ risk_score: number, is_phishing: boolean, reasons: string[] }}
 */
function analyzeText(text) {
  const reasons   = [];
  let   score     = 0;
  const lowerText = text.toLowerCase();

  // ── Rule 1: Suspicious keywords ───────────────────────────────────────────
  for (const { word, score: kScore } of SUSPICIOUS_KEYWORDS) {
    if (lowerText.includes(word)) {
      score += kScore;
      reasons.push(`Contains suspicious keyword: "${word}"`);
    }
  }

  // ── Rule 2: Insecure HTTP protocol ────────────────────────────────────────
  if (lowerText.includes('http://')) {
    score += 20;
    reasons.push('Uses insecure HTTP instead of HTTPS');
  }

  // ── Rule 3: Raw IP address used as host ───────────────────────────────────
  if (/https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/i.test(text)) {
    score += 25;
    reasons.push('URL uses a raw IP address instead of a domain name');
  }

  // ── Rule 4: Number substitutions in domain (typosquatting) ───────────────
  // Detects patterns like: faceb00k, amaz0n, paypa1, g00gle
  const hostname = extractHostname(text);
  if (hostname) {
    // Strip the TLD to avoid false positives on things like ".mp3"
    const domainWithoutTLD = hostname.split('.').slice(0, -1).join('.');
    if (/[a-z][0-9]+[a-z]/i.test(domainWithoutTLD)) {
      score += 25;
      reasons.push(`Domain "${hostname}" contains number substitutions — likely typosquatting`);
    }
  }

  // ── Rule 5: Urgency language combined with a link ─────────────────────────
  const hasUrgency = URGENCY_WORDS.some(w => lowerText.includes(w));
  const hasLink    = /https?:\/\/|www\.|click here/i.test(text);
  if (hasUrgency && hasLink) {
    score += 20;
    reasons.push('Combines urgent language with a link — a common phishing tactic');
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    risk_score:  score,
    is_phishing: score > 60,
    reasons:     reasons.length > 0 ? reasons : ['No suspicious patterns detected'],
  };
}

module.exports = { analyzeText };
