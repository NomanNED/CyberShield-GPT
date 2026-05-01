const aiCache = new Map();
const settingsStore = require('../settingsStore');

function extractJsonPayload(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in AI response');
    return JSON.parse(match[0]);
  }
}

/**
 * Build a rule-based fallback report from heuristic findings.
 * Used when Groq is unavailable so the AI tab is still informative.
 */
function buildFallbackReport(findings, ruleVerdict) {
  const steps = [];
  const domainHits  = findings.filter(f => /(domain|tld|brand|subdomain|http|similar)/i.test(f));
  const contentHits = findings.filter(f => /(urgency|phrase|link|sender|exclamation|provider)/i.test(f));
  const behaviorHits= findings.filter(f => /(login|form|mismatch|title|redirect)/i.test(f));

  if (domainHits.length) {
    steps.push({
      step: steps.length + 1,
      signal: 'Domain Intelligence',
      finding: domainHits.slice(0, 3).join('; '),
      implication: domainHits.length >= 2
        ? 'Multiple domain anomalies increase phishing likelihood significantly.'
        : 'Domain irregularity is a common phishing indicator; treat with caution.',
    });
  }
  if (contentHits.length) {
    steps.push({
      step: steps.length + 1,
      signal: 'Content Analysis',
      finding: contentHits.slice(0, 3).join('; '),
      implication: 'Urgency language and suspicious phrases are tactics used to manipulate user action.',
    });
  }
  if (behaviorHits.length) {
    steps.push({
      step: steps.length + 1,
      signal: 'Behavioral Signals',
      finding: behaviorHits.slice(0, 3).join('; '),
      implication: 'Credential harvesting attempts typically include login forms and brand impersonation.',
    });
  }
  if (steps.length === 0) {
    steps.push({
      step: 1,
      signal: 'Rule Engine',
      finding: findings.slice(0, 5).join('; ') || 'No suspicious indicators found.',
      implication: 'Heuristic rules did not identify strong phishing patterns.',
    });
  }

  const isThreat = ruleVerdict === 'phishing';
  return {
    verdict: isThreat ? 'phishing' : 'safe',
    confidence: isThreat ? 60 : 85,
    summary: isThreat
      ? `Rule-based analysis detected ${findings.length} indicator(s) consistent with phishing or brand impersonation.`
      : 'No significant phishing indicators were detected by the rule engine.',
    reasoning: steps,
    source: 'rules',
  };
}

async function analyzeWithAI({ input, findings, type }) {
  const s        = settingsStore.get();
  const apiKey   = s.groqApiKey || process.env.GROQ_API_KEY || '';
  const model    = s.groqModel  || 'llama-3.1-8b-instant';
  const cacheKey = `${type}:${input}`;

  if (s.cacheEnabled && aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey);
  }

  if (!s.aiEnabled || !apiKey || apiKey === 'your_api_key_here') {
    const fallback = buildFallbackReport(findings, findings.length >= 3 ? 'phishing' : 'safe');
    return {
      aiScore: 0,
      aiExplanation: fallback.summary,
      aiReport: { ...fallback, source: s.aiEnabled ? 'rules' : 'disabled' },
      aiVerdict: 'unknown',
      aiUsed: false,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), s.aiTimeout || 6000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'You are a senior cybersecurity analyst.',
              'Return ONLY a JSON object with exactly these keys:',
              '  risk_score (integer 0-100),',
              '  verdict (string: "phishing", "suspicious", or "safe"),',
              '  confidence (integer 0-100),',
              '  summary (string: one sentence overall assessment),',
              '  reasoning (array of 2-4 objects, each with: step(int), signal(string), finding(string), implication(string))',
              'No extra keys. No markdown. Pure JSON.',
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              `Analyze this ${type} input for phishing/threat indicators.`,
              `INPUT: ${input.slice(0, 500)}`,
              `RULE FINDINGS: ${findings.slice(0, 10).join(' | ') || 'None'}`,
              'Provide a structured investigative analysis. Each reasoning step should name a specific signal category, describe the finding, and explain its security implication.',
            ].join('\n'),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || '{}';
    const parsed  = extractJsonPayload(content);

    const aiReport = {
      verdict:    parsed.verdict   || 'unknown',
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 70)),
      summary:    parsed.summary   || 'AI analysis completed.',
      reasoning:  Array.isArray(parsed.reasoning) ? parsed.reasoning.slice(0, 5) : [],
      source:     'ai',
    };

    const result = {
      aiScore:      Math.max(0, Math.min(100, Number(parsed.risk_score) || 0)),
      aiExplanation: aiReport.summary,
      aiReport,
      aiVerdict:    parsed.verdict || 'unknown',
      aiUsed:       true,
    };

    aiCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const fallback = buildFallbackReport(findings, findings.length >= 3 ? 'phishing' : 'safe');
    return {
      aiScore: 0,
      aiExplanation: fallback.summary,
      aiReport: { ...fallback, source: 'rules-fallback', error: error.message },
      aiVerdict: 'unknown',
      aiUsed: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { analyzeWithAI };