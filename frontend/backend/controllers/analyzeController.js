/**
 * analyzeController.js — Phishing analysis
 */
const { detectThreat } = require('../engine/detectionEngine');
const { logScan }       = require('../scanHistory');

async function analyzeHandler(req, res) {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim())
    return res.status(400).json({ error: 'Provide a non-empty "text" field.' });
  if (text.length > 10_000)
    return res.status(400).json({ error: 'Input too long (max 10,000 chars).' });

  const result = await detectThreat({ text: text.trim(), type: 'generic' });

  logScan({
    type:       'Phishing Analysis',
    input:      text.trim(),
    verdict:    result.is_phishing ? 'threat' : (result.risk_score >= 30 ? 'warn' : 'safe'),
    riskScore:  result.risk_score,
    confidence: result.confidence,
  });

  return res.json(result);
}

module.exports = { analyzeHandler };
