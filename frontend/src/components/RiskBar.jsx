/**
 * RiskBar.jsx
 * Animated progress bar that changes colour based on score (0–100).
 */
import { useState, useEffect } from 'react';

export default function RiskBar({ score, level }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Two rAF frames ensure the 0% state is painted before the transition starts
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimatedWidth(score));
    });
    return () => cancelAnimationFrame(id);
  }, [score]);

  const color =
    score >= 60 ? '#ff4444'
    : score >= 30 ? '#ffaa00'
    : '#00ff88';

  return (
    <div className="score-container">
      <div className="score-label-row">
        <span className="score-label">
          Risk Score: <strong>{score}</strong> / 100
        </span>
        {level && <span className={`score-level-badge score-level-${level}`}>{level}</span>}
      </div>
      <div className="score-bar-bg">
        <div
          className="score-bar-fill"
          style={{
            width: `${animatedWidth}%`,
            backgroundColor: color,
            transition: 'width 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}
