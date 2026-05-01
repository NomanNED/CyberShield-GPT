const { getBaseDomain, getBrandToken, TRUSTED_DOMAINS } = require('./domainLayer');

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function findExpectedDomainForBrand(brand) {
  return TRUSTED_DOMAINS.find(domain => getBrandToken(domain) === brand) || null;
}

async function analyzeBehavior({ text, domainData, contentData, scrapeData }) {
  const findings = [];
  const lowerText = text.toLowerCase();
  let score = 0;

  const actualBaseDomain = domainData.baseDomain;
  const mentionedBrands = new Set([
    ...(contentData.detectedBrands || []),
    ...(domainData.brandTokens || []),
  ]);

  for (const brand of mentionedBrands) {
    const expectedDomain = findExpectedDomainForBrand(brand);
    if (expectedDomain && actualBaseDomain && getBaseDomain(expectedDomain) !== actualBaseDomain) {
      score += 45;
      findings.push(`Brand mention mismatch: references ${brand} but uses ${actualBaseDomain}`);
    }
  }

  if (actualBaseDomain && /(login|signin|verify|secure|account|password)/i.test(lowerText) && !domainData.trusted) {
    score += 25;
    findings.push('Login or verification language appears on a non-trusted domain');
  }

  if (scrapeData && !scrapeData.skipped) {
    if (scrapeData.hasLoginForm && !domainData.trusted) {
      score += 20;
      findings.push('Detected a login form on a suspicious domain');
    }

    if (scrapeData.title && actualBaseDomain) {
      const titleLower = scrapeData.title.toLowerCase();
      const titleBrandMismatch = Array.from(mentionedBrands).some(brand => titleLower.includes(brand) && actualBaseDomain !== findExpectedDomainForBrand(brand));
      if (titleBrandMismatch) {
        score += 20;
        findings.push('Page title references a trusted brand that does not match the actual domain');
      }
    }
  }

  if ((contentData.links || []).length > 0 && (contentData.matchedUrgency || []).length > 0 && !domainData.trusted) {
    score += 15;
    findings.push('Urgent messaging links users to a non-trusted destination');
  }

  return {
    behaviorScore: clampScore(score),
    behaviorFindings: findings,
  };
}

module.exports = { analyzeBehavior };