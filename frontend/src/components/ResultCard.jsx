/**
 * ResultCard.jsx
 * Generic container for displaying analysis results.
 * verdict: 'safe' | 'warn' | 'danger'
 */
const VERDICT_ICON = { safe: '✓', warn: '⚠', danger: '✕' };

export default function ResultCard({ verdict, label, title, children }) {
  return (
    <div className={`result-card result-${verdict}`}>
      <div className={`verdict-header verdict-header-${verdict}`}>
        <span className={`verdict-icon verdict-icon-${verdict}`} aria-hidden="true">
          {VERDICT_ICON[verdict] ?? '●'}
        </span>
        <span className={`verdict verdict-${verdict}`}>{label}</span>
      </div>
      {title && <div className="result-title-row">{title}</div>}
      {children}
    </div>
  );
}
