const SUSPICIOUS_TLDS = new Set(['xyz', 'tk', 'ml', 'ga']);

const TRUSTED_DOMAINS = [
  'amazon.com',
  'apple.com',
  'bankofamerica.com',
  'chase.com',
  'citibank.com',
  'dropbox.com',
  'facebook.com',
  'github.com',
  'gmail.com',
  'google.com',
  'icloud.com',
  'instagram.com',
  'linkedin.com',
  'microsoft.com',
  'netflix.com',
  'outlook.com',
  'paypal.com',
  'walmart.com',
  'wellsfargo.com',
  'x.com',
  'youtube.com',
];

const HOMOGLYPH_MAP = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeHomoglyphs(value) {
  return value
    .toLowerCase()
    .split('')
    .map(character => HOMOGLYPH_MAP[character] || character)
    .join('');
}

function levenshteinDistance(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () => []);

  for (let index = 0; index <= left.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= right.length; index += 1) rows[0][index] = index;

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost
      );
    }
  }

  return rows[left.length][right.length];
}

function similarityScore(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const distance = levenshteinDistance(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function ensureUrl(rawValue) {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function extractFirstUrl(text) {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}

function extractDomainCandidate(text, type) {
  if (type === 'url') {
    return ensureUrl(text);
  }

  const firstUrl = extractFirstUrl(text);
  return firstUrl ? ensureUrl(firstUrl) : null;
}

function stripWww(hostname) {
  return hostname.replace(/^www\./, '');
}

function getBaseDomain(domain) {
  const labels = domain.split('.');
  if (labels.length <= 2) return domain;
  return labels.slice(-2).join('.');
}

function getDomainStem(domain) {
  return domain.split('.')[0];
}

function getBrandToken(domain) {
  return getDomainStem(domain).replace(/[^a-z0-9]/gi, '');
}

function findClosestTrustedDomain(domain) {
  const baseDomain = getBaseDomain(domain);
  const normalizedBaseDomain = normalizeHomoglyphs(baseDomain);
  const normalizedStem = normalizeHomoglyphs(getDomainStem(baseDomain));

  let bestMatch = null;
  let bestSimilarity = 0;
  let normalizedExactMatch = false;

  for (const trustedDomain of TRUSTED_DOMAINS) {
    const trustedBase = getBaseDomain(trustedDomain);
    const normalizedTrustedBase = normalizeHomoglyphs(trustedBase);
    const normalizedTrustedStem = normalizeHomoglyphs(getDomainStem(trustedBase));

    const baseSimilarity = similarityScore(normalizedBaseDomain, normalizedTrustedBase);
    const stemSimilarity = similarityScore(normalizedStem, normalizedTrustedStem);
    const currentSimilarity = Math.max(baseSimilarity, stemSimilarity);

    if (normalizedBaseDomain === normalizedTrustedBase && baseDomain !== trustedBase) {
      normalizedExactMatch = true;
    }

    if (currentSimilarity > bestSimilarity) {
      bestSimilarity = currentSimilarity;
      bestMatch = trustedDomain;
    }
  }

  return {
    closestTrustedDomain: bestMatch,
    closestSimilarity: bestSimilarity,
    normalizedExactMatch,
  };
}

async function analyzeDomain({ text, type = 'generic' }) {
  const findings = [];
  const inspectionUrl = extractDomainCandidate(text, type);

  if (!inspectionUrl) {
    return {
      domainScore: 0,
      domainFindings: [],
      domainData: {
        domain: null,
        baseDomain: null,
        closestTrustedDomain: null,
        closestSimilarity: 0,
        brandTokens: [],
        inspectionUrl: null,
        trusted: false,
      },
    };
  }

  let hostname;
  try {
    hostname = new URL(inspectionUrl).hostname.toLowerCase();
  } catch {
    return {
      domainScore: 20,
      domainFindings: ['Input contains a malformed or unparsable URL'],
      domainData: {
        domain: null,
        baseDomain: null,
        closestTrustedDomain: null,
        closestSimilarity: 0,
        brandTokens: [],
        inspectionUrl,
        trusted: false,
      },
    };
  }

  const domain = stripWww(hostname);
  const baseDomain = getBaseDomain(domain);
  const stem = getDomainStem(baseDomain);
  const normalizedStem = normalizeHomoglyphs(stem);
  const tld = baseDomain.split('.').pop();
  const labels = domain.split('.');

  let score = 0;

  const isTrustedDomain = TRUSTED_DOMAINS.includes(baseDomain);
  if (isTrustedDomain) {
    findings.push(`Domain matches trusted domain: ${baseDomain}`);
  }

  const closest = findClosestTrustedDomain(domain);
  const closestBrandToken = closest.closestTrustedDomain ? getBrandToken(closest.closestTrustedDomain) : null;

  if (!isTrustedDomain && closest.normalizedExactMatch && closest.closestTrustedDomain) {
    score += 90;
    findings.push(`Domain impersonates trusted brand using homoglyphs: ${baseDomain} → ${closest.closestTrustedDomain}`);
  } else if (!isTrustedDomain && closest.closestSimilarity >= 0.86 && closest.closestTrustedDomain) {
    score += 75;
    findings.push(`Domain is highly similar to trusted domain ${closest.closestTrustedDomain}`);
  } else if (!isTrustedDomain && closest.closestSimilarity >= 0.72 && closest.closestTrustedDomain) {
    score += 45;
    findings.push(`Domain resembles trusted domain ${closest.closestTrustedDomain}`);
  }

  if (!isTrustedDomain && normalizedStem !== stem && closest.closestTrustedDomain) {
    score += 25;
    findings.push('Domain uses homoglyph or number substitutions such as 0→o or 1→l');
  }

  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 25;
    findings.push(`Uses suspicious top-level domain .${tld}`);
  }

  const subdomainBrand = TRUSTED_DOMAINS.find(trustedDomain => {
    const trustedStem = getDomainStem(trustedDomain);
    return labels.length > 2 && labels.slice(0, -2).some(label => normalizeHomoglyphs(label) === trustedStem);
  });

  if (subdomainBrand && baseDomain !== subdomainBrand) {
    score += 35;
    findings.push(`Subdomain attempts to mimic trusted brand ${subdomainBrand}`);
  }

  if (!isTrustedDomain && closestBrandToken && normalizedStem.includes(closestBrandToken) && baseDomain !== closest.closestTrustedDomain) {
    score += 30;
    findings.push(`Domain embeds trusted brand name ${closestBrandToken} inside a non-trusted domain`);
  }

  if (!isTrustedDomain && /(login|signin|secure|verify|account|update)/i.test(domain) && closestBrandToken && normalizedStem.includes(closestBrandToken)) {
    score += 35;
    findings.push('Domain combines a trusted brand name with login or security bait terms');
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)) {
    score += 40;
    findings.push('URL uses a raw IP address instead of a normal brand domain');
  }

  if (/^http:\/\//i.test(text)) {
    score += 10;
    findings.push('URL uses HTTP instead of HTTPS');
  }

  return {
    domainScore: clampScore(score),
    domainFindings: findings,
    domainData: {
      domain,
      baseDomain,
      closestTrustedDomain: closest.closestTrustedDomain,
      closestSimilarity: closest.closestSimilarity,
      brandTokens: closestBrandToken ? [closestBrandToken] : [],
      inspectionUrl,
      trusted: isTrustedDomain,
    },
  };
}

module.exports = {
  TRUSTED_DOMAINS,
  analyzeDomain,
  extractFirstUrl,
  getBaseDomain,
  getBrandToken,
  normalizeHomoglyphs,
  similarityScore,
};