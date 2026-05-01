const { getBrandToken, TRUSTED_DOMAINS } = require('./domainLayer');

const URGENCY_WORDS = [
  'urgent',
  'verify',
  'act now',
  'immediately',
  'asap',
  'deadline',
  'action required',
  'limited time',
  'expires',
  'suspended',
];

const SENSITIVE_TERMS = [
  'password',
  'otp',
  'bank',
  'account',
  'login',
  'credit card',
  'ssn',
  'gift card',
  'wire transfer',
  'security code',
  'confirm identity',
];

const SUSPICIOUS_PHRASES = [
  'verify your account',
  'click here',
  'confirm your password',
  'update your payment information',
  'your account will be closed',
  'you have won',
  'bank account',
  'gift card',
];

const LINK_REGEX = /https?:\/\/[^\s"'<>]+/gi;
const EMAIL_REGEX = /from:\s*.*?([\w.+-]+@[\w.-]+\.[a-z]{2,})/i;
const FREE_PROVIDER = /@(gmail|yahoo|hotmail|outlook|aol|proton)\./i;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function detectBrandsInText(text) {
  const lowerText = text.toLowerCase();
  return TRUSTED_DOMAINS
    .map(getBrandToken)
    .filter((brand, index, values) => values.indexOf(brand) === index)
    .filter(brand => brand.length >= 4 && lowerText.includes(brand));
}

async function analyzeContent({ text }) {
  const findings = [];
  const lowerText = text.toLowerCase();

  const matchedUrgency = URGENCY_WORDS.filter(word => lowerText.includes(word));
  const matchedSensitiveTerms = SENSITIVE_TERMS.filter(term => lowerText.includes(term));
  const matchedPhrases = SUSPICIOUS_PHRASES.filter(phrase => lowerText.includes(phrase));
  const links = text.match(LINK_REGEX) || [];
  const senderMatch = text.match(EMAIL_REGEX);
  const sender = senderMatch ? senderMatch[1].toLowerCase() : null;
  const detectedBrands = detectBrandsInText(text);

  let score = 0;

  if (matchedUrgency.length > 0) {
    score += Math.min(30, matchedUrgency.length * 10);
    findings.push(`Urgency language detected: ${matchedUrgency.join(', ')}`);
  }

  if (matchedSensitiveTerms.length > 0) {
    score += Math.min(25, matchedSensitiveTerms.length * 7);
    findings.push(`Sensitive terms detected: ${matchedSensitiveTerms.join(', ')}`);
  }

  if (matchedPhrases.length > 0) {
    score += Math.min(25, matchedPhrases.length * 8);
    findings.push(`Known phishing phrases detected: ${matchedPhrases.join(', ')}`);
  }

  if (links.length > 0) {
    score += 15;
    findings.push(`Contains ${links.length} link(s)`);
  }

  if (matchedUrgency.length > 0 && links.length > 0) {
    score += 15;
    findings.push('Combines urgency language with a link');
  }

  if (sender && FREE_PROVIDER.test(sender)) {
    score += 15;
    findings.push(`Sender uses free provider address: ${sender}`);
  }

  if ((text.match(/!/g) || []).length >= 3) {
    score += 5;
    findings.push('Excessive exclamation marks detected');
  }

  return {
    contentScore: clampScore(score),
    contentFindings: findings,
    contentData: {
      detectedBrands,
      links,
      matchedPhrases,
      matchedSensitiveTerms,
      matchedUrgency,
      sender,
    },
  };
}

module.exports = { analyzeContent };