/**
 * phishingAnalyzer.js
 * Improved rule-based phishing detection.
 * Moved from src/analyzer.js into utils/ for the modular architecture.
 */

const SUSPICIOUS_KEYWORDS = [
  { word: 'urgent',                 score: 10 },
  { word: 'verify',                 score: 10 },
  { word: 'password',               score: 10 },
  { word: 'bank',                   score: 10 },
  { word: 'click now',              score: 15 },
  { word: 'account suspended',      score: 20 },
  { word: 'login',                  score:  5 },
  { word: 'confirm',                score: 10 },
  { word: 'update your',            score: 10 },
  { word: 'limited time',           score: 10 },
  { word: 'act now',                score: 15 },
  { word: 'free gift',              score: 10 },
  { word: 'winner',                 score: 10 },
  { word: 'you have been selected', score: 15 },
  { word: 'verify your account',    score: 20 },
  { word: 'your account will be closed', score: 20 },
  { word: 'unusual activity',       score: 15 },
  { word: 'suspended',              score: 10 },
  { word: 'deactivated',            score: 10 },
  { word: 'click here',             score: 10 },
];

const URGENCY_WORDS = [
  'urgent', 'immediately', 'asap', 'expires',
  'limited time', 'act now', 'hurry', 'deadline',
  'within 24 hours', 'action required',
];

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
 * Analyze text for phishing indicators.
 * @param {string} text
 * @returns {{ risk_score: number, is_phishing: boolean, reasons: string[] }}
 */
function analyzeText(text) {
  const reasons   = [];
  let   score     = 0;
  const lower     = text.toLowerCase();

  // Rule 1: Suspicious keywords
  for (const { word, score: w } of SUSPICIOUS_KEYWORDS) {
    if (lower.includes(word)) {
      score += w;
      reasons.push(`Contains suspicious keyword: "${word}"`);
    }
  }

  // Rule 2: HTTP instead of HTTPS
  if (lower.includes('http://')) {
    score += 20;
    reasons.push('Uses insecure HTTP instead of HTTPS');
  }

  // Rule 3: Raw IP address as host
  if (/https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(text)) {
    score += 25;
    reasons.push('URL uses a raw IP address instead of a domain name');
  }

  // Rule 4: Number substitutions in domain (typosquatting)
  const hostname = extractHostname(text);
  if (hostname) {
    const domainWithoutTLD = hostname.split('.').slice(0, -1).join('.');
    if (/[a-z][0-9]+[a-z]/i.test(domainWithoutTLD)) {
      score += 25;
      reasons.push(`Domain "${hostname}" contains number substitutions — likely typosquatting`);
    }
  }

  // Rule 5: Urgency + link combo
  const hasUrgency = URGENCY_WORDS.some(w => lower.includes(w));
  const hasLink    = /https?:\/\/|www\.|click here/i.test(text);
  if (hasUrgency && hasLink) {
    score += 20;
    reasons.push('Combines urgent language with a link — a common phishing tactic');
  }

  // Rule 6: Many exclamation marks (spam-like)
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 3) {
    score += 10;
    reasons.push(`Excessive exclamation marks (${exclamations}) — spam-like pattern`);
  }

  score = Math.min(score, 100);

  return {
    risk_score:  score,
    is_phishing: score >= 60,
    reasons:     reasons.length > 0 ? reasons : ['No suspicious patterns detected'],
  };
}

module.exports = { analyzeText };
