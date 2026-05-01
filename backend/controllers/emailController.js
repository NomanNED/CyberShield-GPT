/**
 * emailController.js — Email security analysis
 */
const { detectThreat } = require('../engine/detectionEngine');
const { logScan }       = require('../scanHistory');

async function emailHandler(req, res) {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim())
    return res.status(400).json({ error: 'Provide a non-empty "text" field.' });
  if (text.length > 50_000)
    return res.status(400).json({ error: 'Input too long (max 50,000 chars).' });

  const result = await detectThreat({ text: text.trim(), type: 'email' });

  const level = result.risk_level?.toLowerCase();
  logScan({
    type:       'Email Threat Triage',
    input:      text.trim(),
    verdict:    level === 'high' ? 'threat' : (level === 'medium' ? 'warn' : 'safe'),
    riskScore:  result.risk_score,
    confidence: result.confidence,
  });

  return res.json({
    ...result,
    threat_level: result.risk_level.toUpperCase(),
    suspicious_phrases: result.metadata.suspicious_phrases || [],
    links_found: result.metadata.links_found || [],
  });
}

module.exports = { emailHandler };
