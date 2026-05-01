const { analyzeDomain } = require('./domainLayer');
const { analyzeContent } = require('./contentLayer');
const { analyzeBehavior } = require('./behaviorLayer');
const { calculateFinalScore } = require('./scoringEngine');
const { analyzeWithAI } = require('../services/aiService');
const { inspectPage } = require('../services/scraperService');

const detectionCache = new Map();

function uniqueReasons(reasons) {
  return Array.from(new Set(reasons.filter(Boolean)));
}

async function detectThreat({ text, type = 'generic' }) {
  const normalizedText = String(text || '').trim();
  const cacheKey = `${type}:${normalizedText}`;

  if (detectionCache.has(cacheKey)) {
    return detectionCache.get(cacheKey);
  }

  const [domainResult, contentResult] = await Promise.all([
    analyzeDomain({ text: normalizedText, type }),
    analyzeContent({ text: normalizedText, type }),
  ]);

  const inspectionUrl = domainResult.domainData.inspectionUrl || contentResult.contentData.links?.[0] || null;

  const [scrapeData, aiResult] = await Promise.all([
    inspectPage(inspectionUrl),
    analyzeWithAI({
      input: normalizedText,
      findings: [...domainResult.domainFindings, ...contentResult.contentFindings],
      type,
    }),
  ]);

  const behaviorResult = await analyzeBehavior({
    text: normalizedText,
    domainData: domainResult.domainData,
    contentData: contentResult.contentData,
    scrapeData,
  });

  const reasons = uniqueReasons([
    ...domainResult.domainFindings,
    ...contentResult.contentFindings,
    ...behaviorResult.behaviorFindings,
  ]);

  const finalScore = calculateFinalScore({
    domainScore: domainResult.domainScore,
    contentScore: contentResult.contentScore,
    behaviorScore: behaviorResult.behaviorScore,
    aiScore: aiResult.aiScore,
    aiUsed: aiResult.aiUsed,
    reasonCount: reasons.length,
  });

  const result = {
    ...finalScore,
    reasons: reasons.length > 0 ? reasons : ['No suspicious indicators detected'],
    ai_explanation: aiResult.aiExplanation,
    ai_report:      aiResult.aiReport || null,
    breakdown: {
      domain: domainResult.domainScore,
      content: contentResult.contentScore,
      behavior: behaviorResult.behaviorScore,
      ai: aiResult.aiScore,
    },
    metadata: {
      domain: domainResult.domainData.domain,
      base_domain: domainResult.domainData.baseDomain,
      closest_trusted_domain: domainResult.domainData.closestTrustedDomain,
      similarity: domainResult.domainData.closestSimilarity,
      links_found: contentResult.contentData.links,
      suspicious_phrases: contentResult.contentData.matchedPhrases,
      sender: contentResult.contentData.sender,
      scrape: scrapeData,
    },
  };

  detectionCache.set(cacheKey, result);
  return result;
}

module.exports = { detectThreat };