/**
 * fakeSiteController.js — Fake / spoof website detection
 */
const { detectThreat } = require('../engine/detectionEngine');
const { logScan }       = require('../scanHistory');

async function fakeSiteHandler(req, res) {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim())
    return res.status(400).json({ error: 'Provide a non-empty "url" field.' });

  const result = await detectThreat({ text: url.trim(), type: 'url' });

  logScan({
    type:       'Fake Site Detection',
    input:      url.trim(),
    verdict:    result.is_phishing ? 'threat' : (result.risk_score >= 30 ? 'warn' : 'safe'),
    riskScore:  result.risk_score,
    confidence: result.confidence,
  });

  return res.json({
    ...result,
    is_fake: result.is_phishing,
    spoofOf: result.metadata.closest_trusted_domain,
    domain: result.metadata.domain,
  });
}

module.exports = { fakeSiteHandler };
