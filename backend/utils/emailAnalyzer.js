/**
 * emailAnalyzer.js
 * Analyzes email body text for social engineering indicators.
 */

const URGENCY_WORDS = [
  'urgent', 'immediately', 'asap', 'expires', 'expiring',
  'limited time', 'act now', 'hurry', 'deadline', 'within 24 hours',
  'action required', 'final notice', 'last chance', 'respond now',
];

const SUSPICIOUS_PHRASES = [
  { phrase: 'verify your account',         score: 20, label: 'Account verification request' },
  { phrase: 'update your information',     score: 15, label: 'Personal info update request' },
  { phrase: 'confirm your identity',       score: 15, label: 'Identity confirmation request' },
  { phrase: 'your account will be closed', score: 20, label: 'Account closure threat' },
  { phrase: 'unusual activity',            score: 15, label: 'False security alert' },
  { phrase: 'click here',                  score: 10, label: 'Generic click-here link' },
  { phrase: 'dear customer',              score:  5, label: 'Impersonal salutation (bulk email)' },
  { phrase: 'dear user',                  score:  5, label: 'Impersonal salutation (bulk email)' },
  { phrase: 'congratulations',            score: 10, label: 'Prize/reward lure' },
  { phrase: 'you have won',               score: 20, label: 'Prize scam indicator' },
  { phrase: 'free',                        score:  5, label: 'Free offer (low-trust signal)' },
  { phrase: 'password',                    score: 10, label: 'Password-related content' },
  { phrase: 'bank account',               score: 10, label: 'Financial account reference' },
  { phrase: 'wire transfer',              score: 20, label: 'Wire transfer request' },
  { phrase: 'send money',                 score: 20, label: 'Money request' },
  { phrase: 'gift card',                  score: 20, label: 'Gift card scam indicator' },
  { phrase: 'no-reply',                   score:  5, label: 'No-reply sender address' },
];

// Regex patterns for structural checks
const LINK_REGEX    = /https?:\/\/[^\s"'<>]+/gi;
const EMAIL_REGEX   = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
// Suspicious sender: mismatched domain or free provider posing as a brand
const FREE_PROVIDER = /@(gmail|yahoo|hotmail|outlook|aol|proton|mail\.ru)\./i;

/**
 * @param {string} emailText - Raw email body (may include From/Subject headers)
 * @returns {{ risk_score: number, threat_level: string, reasons: string[], suspicious_phrases: string[], links_found: string[] }}
 */
function analyzeEmail(emailText) {
  const reasons           = [];
  const suspiciousPhrases = [];
  let   score             = 0;
  const lower             = emailText.toLowerCase();

  // Check 1: Suspicious phrases with highlights
  for (const { phrase, score: s, label } of SUSPICIOUS_PHRASES) {
    if (lower.includes(phrase)) {
      score += s;
      reasons.push(label);
      suspiciousPhrases.push(phrase);
    }
  }

  // Check 2: Urgency words
  const foundUrgency = URGENCY_WORDS.filter(w => lower.includes(w));
  if (foundUrgency.length > 0) {
    score += foundUrgency.length * 8;
    reasons.push(`Urgency language detected: ${foundUrgency.slice(0, 3).map(w => `"${w}"`).join(', ')}`);
  }

  // Check 3: Extract all links
  const links = emailText.match(LINK_REGEX) || [];
  if (links.length > 0) {
    // Any http:// link is extra suspicious
    const insecureLinks = links.filter(l => l.startsWith('http://'));
    if (insecureLinks.length > 0) {
      score += 15;
      reasons.push(`Contains ${insecureLinks.length} insecure HTTP link(s)`);
    }
  }

  // Check 4: Urgency + link combination
  if (foundUrgency.length > 0 && links.length > 0) {
    score += 15;
    reasons.push('Combines urgency language with clickable links');
  }

  // Check 5: Free email provider posing as sender
  const senderMatch = emailText.match(/from:.*?([\w.+-]+@[\w.-]+\.[a-z]{2,})/i);
  if (senderMatch) {
    const senderEmail = senderMatch[1];
    if (FREE_PROVIDER.test(senderEmail)) {
      score += 10;
      reasons.push(`Sender uses a free email provider (${senderEmail}) — may impersonate a brand`);
    }
  }

  // Check 6: Multiple exclamation marks
  const bangs = (emailText.match(/!/g) || []).length;
  if (bangs >= 3) {
    score += 5;
    reasons.push(`Excessive use of exclamation marks (${bangs})`);
  }

  score = Math.min(score, 100);

  const threatLevel =
    score > 70 ? 'HIGH'
    : score > 40 ? 'MEDIUM'
    : 'LOW';

  return {
    risk_score:          score,
    threat_level:        threatLevel,
    reasons:             reasons.length > 0 ? reasons : ['No suspicious patterns detected'],
    suspicious_phrases:  suspiciousPhrases,
    links_found:         links,
  };
}

module.exports = { analyzeEmail };
