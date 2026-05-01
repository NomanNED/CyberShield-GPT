/**
 * PhishingAnalyzer.jsx
 * Analyzes URLs / text snippets for phishing indicators.
 */
import { useState } from 'react';
import AnalysisResult from '../components/AnalysisResult';

export default function PhishingAnalyzer() {
  const [text,      setText]      = useState('');
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res  = await fetch('/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResult(data);
    } catch (e) {
      const offline = e instanceof TypeError || e.message === 'Failed to fetch';
      setError(offline ? '__offline__' : e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="scan-form-card">
        <label className="form-label" htmlFor="pa-input">
          URL or message body
          <span className="form-label-hint">Paste a suspicious link, email snippet, or page URL</span>
        </label>
        <textarea
          id="pa-input"
          className="form-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. http://amaz0n-verify.com/login  — or paste full email text…"
          rows={5}
          spellCheck={false}
        />
        <div className="form-actions">
          <button type="button" className="scan-btn" onClick={analyze} disabled={loading || !text.trim()}>
            {loading ? <><span className="scan-btn-spinner" aria-hidden="true" /> Analyzing…</> : 'Run Analysis'}
          </button>
          {result && (
            <button type="button" className="scan-btn scan-btn-ghost"
              onClick={() => { setText(''); setResult(null); setError(null); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {error === '__offline__' && (
        <div className="error-banner">
          <span className="error-banner-icon">⚠</span>
          <div>
            <strong>Backend offline</strong>
            <p>Cannot reach the analysis server. Make sure it is running on port 5000.</p>
          </div>
          <button type="button" className="retry-btn" onClick={analyze}>Retry</button>
        </div>
      )}
      {error && error !== '__offline__' && <div className="error-box">{error}</div>}

      {result && (
        <AnalysisResult
          result={result}
          title="Hybrid Threat Assessment"
          safeLabel="Likely Safe"
          dangerLabel="Suspicious or Phishing Risk"
          overview={result.is_phishing
            ? 'CyberShield GPT found multiple correlated phishing indicators across domain, content, and behavioral analysis.'
            : 'The current scan produced low-risk signals and no strong indicators of phishing.'}
          summaryRows={[
            { label: 'Detected Domain', value: result.metadata?.domain || 'No domain extracted' },
            { label: 'Closest Trusted Match', value: result.metadata?.closest_trusted_domain || 'No brand match' },
          ]}
          technicalRows={[
            { label: 'Scan Type', value: 'Generic Phishing Analysis' },
          ]}
        />
      )}
    </div>
  );
}
