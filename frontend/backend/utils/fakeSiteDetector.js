/**
 * fakeSiteDetector.js
 * Detects fake / spoof websites by comparing a submitted URL's domain
 * against a list of popular brands using simple string similarity.
 */

// Well-known brand domains. Extend this list as needed.
const KNOWN_DOMAINS = [
  'google.com',     'gmail.com',      'google.co.uk',
  'facebook.com',   'fb.com',
  'instagram.com',
  'twitter.com',    'x.com',
  'amazon.com',     'amazon.co.uk',   'amazon.in',
  'apple.com',      'icloud.com',
  'microsoft.com',  'outlook.com',    'live.com',  'hotmail.com',
  'paypal.com',
  'netflix.com',
  'youtube.com',
  'linkedin.com',
  'github.com',
  'dropbox.com',
  'ebay.com',
  'walmart.com',
  'bankofamerica.com', 'chase.com', 'wellsfargo.com', 'citibank.com',
];

/**
 * Very lightweight character-level similarity (0–1).
 * Uses a simple longest-common-subsequence approximation via
 * edit-distance ratio so we don't need an npm package.
 * @param {string} a
 * @param {string} b
 * @returns {number}  1 = identical, 0 = nothing in common
 */
function similarity(a, b) {
  if (a === b) return 1;
  const longer  = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1[i - 1] !== s2[j - 1]) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Normalise a domain string: remove number substitutions so
 * "amaz0n" becomes "amazon" for comparison purposes.
 */
function normalise(domain) {
  return domain
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/8/g, 'b');
}

/**
 * Detect whether a URL looks like a spoofed version of a popular site.
 * @param {string} url
 * @returns {{ is_fake: boolean, risk_score: number, reasons: string[], spoofOf: string|null }}
 */
function detectFakeSite(url) {
  const reasons  = [];
  let   score    = 0;
  let   spoofOf  = null;

  // Extract hostname
  let inputUrl = url.trim();
  if (!/^https?:\/\//i.test(inputUrl)) inputUrl = 'http://' + inputUrl;

  let hostname;
  try {
    hostname = new URL(inputUrl).hostname.toLowerCase();
  } catch {
    return { is_fake: false, risk_score: 0, reasons: ['Could not parse URL'], spoofOf: null };
  }

  // Strip leading www.
  const domain = hostname.replace(/^www\./, '');

  // Check 1: Is it an exact known domain? → safe
  if (KNOWN_DOMAINS.includes(domain)) {
    return { is_fake: false, risk_score: 0, reasons: ['Domain matches a known trusted brand'], spoofOf: null };
  }

  // Check 2: Compare (normalised) against every known domain
  const normDomain = normalise(domain);

  let bestMatch   = null;
  let bestScore   = 0;

  for (const known of KNOWN_DOMAINS) {
    const normKnown = normalise(known);
    const sim       = similarity(normDomain, normKnown);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatch = known;
    }
  }

  // Similarity threshold: > 0.75 is suspicious
  if (bestScore > 0.75 && bestMatch) {
    spoofOf = bestMatch;
    const pct = Math.round(bestScore * 100);
    score += Math.round(bestScore * 60); // up to 60 pts from similarity
    reasons.push(`Domain "${domain}" is ${pct}% similar to "${bestMatch}" — possible spoof`);
  }

  // Check 3: Number substitutions present
  if (/[0-9]/.test(domain.split('.')[0])) {
    score += 20;
    reasons.push(`Domain contains digits that may substitute letters (e.g. 0→o, 1→l)`);
  }

  // Check 4: Insecure HTTP
  if (/^http:\/\//i.test(url)) {
    score += 10;
    reasons.push('Uses insecure HTTP');
  }

  // Check 5: Excessively long subdomain chain
  if ((domain.match(/\./g) || []).length >= 3) {
    score += 15;
    reasons.push('Unusually deep subdomain structure — often used to hide the real domain');
  }

  score = Math.min(score, 100);

  return {
    is_fake:    score > 50,
    risk_score: score,
    reasons:    reasons.length > 0 ? reasons : ['No suspicious patterns found'],
    spoofOf:    spoofOf,
    domain:     domain,
  };
}

module.exports = { detectFakeSite, KNOWN_DOMAINS };
