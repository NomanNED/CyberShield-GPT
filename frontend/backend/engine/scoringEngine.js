function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getRiskLevel(score) {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

function deriveConfidence({ score, aiUsed, reasonCount, domainScore, behaviorScore }) {
  if ((aiUsed && reasonCount >= 3) || domainScore >= 70 || behaviorScore >= 45 || score >= 75) {
    return 'high';
  }

  if (reasonCount >= 2 || aiUsed || score >= 35) {
    return 'medium';
  }

  return 'low';
}

function calculateFinalScore({ domainScore, contentScore, behaviorScore, aiScore, aiUsed, reasonCount }) {
  let finalScore;

  if (aiUsed) {
    finalScore =
      (domainScore * 0.4) +
      (contentScore * 0.2) +
      (behaviorScore * 0.1) +
      (aiScore * 0.3);
  } else {
    finalScore =
      (domainScore * (0.4 / 0.7)) +
      (contentScore * (0.2 / 0.7)) +
      (behaviorScore * (0.1 / 0.7));
  }

  const score = clampScore(finalScore);

  return {
    risk_score: score,
    risk_level: getRiskLevel(score),
    confidence: deriveConfidence({
      score,
      aiUsed,
      reasonCount,
      domainScore,
      behaviorScore,
    }),
    is_phishing: score > 60,
  };
}

module.exports = { calculateFinalScore };