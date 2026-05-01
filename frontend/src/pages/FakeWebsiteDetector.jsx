/**
 * FakeWebsiteDetector.jsx
 * Detects if a URL is a fake / typosquatted version of a popular brand.
 */
import { useState } from 'react';
import AnalysisResult from '../components/AnalysisResult';

export default function FakeWebsiteDetector() {
  const [url,     setUrl]     = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const detect = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res  = await fetch('/detect-fake-site', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResult(data);
    } catch (e) {
      const offline = e instanceof TypeError || e.message === 'Failed to fetch';
      setError(offline ? '__offline__' : e.message);
    } finally { setLoading(false); }
  };

  const onKeyDown = (e) => { if (e.key === 'Enter') detect(); };

  return (
    <div className="page">
      <div className="scan-form-card">
        <label className="form-label" htmlFor="fd-input">
          Website URL
          <span className="form-label-hint">Include the full URL with http:// or https://</span>
        </label>
        <input
          id="fd-input"
          type="text"
          className="form-input"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. http://faceb00k-login.com"
          spellCheck={false}
          autoComplete="off"
        />
        <div className="form-actions">
          <button type="button" className="scan-btn" onClick={detect} disabled={loading || !url.trim()}>
            {loading ? <><span className="scan-btn-spinner" aria-hidden="true" /> Detecting…</> : 'Detect Fake Site'}
          </button>
          {result && (
            <button type="button" className="scan-btn scan-btn-ghost"
              onClick={() => { setUrl(''); setResult(null); setError(null); }}>
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
          <button type="button" className="retry-btn" onClick={detect}>Retry</button>
        </div>
      )}
      {error && error !== '__offline__' && <div className="error-box">{error}</div>}

      {result && (
        <AnalysisResult
          result={result}
          title="Brand Spoof Investigation"
          safeLabel="Appears Legitimate"
          dangerLabel="Possible Fake Site"
          verdictOverride={result.is_fake ? 'danger' : result.risk_level === 'medium' ? 'warn' : 'safe'}
          overview={result.is_fake
            ? 'This domain shows strong signs of impersonating a trusted brand and should be treated as suspicious.'
            : 'The domain does not currently resemble a high-confidence spoof of a trusted brand.'}
          summaryRows={[
            { label: 'Observed Domain', value: result.domain || result.metadata?.domain || 'Unavailable' },
            { label: 'Potential Spoof Target', value: result.spoofOf || 'No spoof target detected' },
          ]}
          evidenceSections={result.metadata?.similarity !== undefined ? [
            {
              title: 'Technical Snapshot',
              content: (
                <div className="analysis-summary-rows analysis-summary-rows-compact">
                  <div className="analysis-summary-row">
                    <span>Similarity Score</span>
                    <strong>{Math.round((result.metadata.similarity || 0) * 100)}%</strong>
                  </div>
                  <div className="analysis-summary-row">
                    <span>Base Domain</span>
                    <strong>{result.metadata.base_domain || 'Unavailable'}</strong>
                  </div>
                </div>
              ),
            },
          ] : []}
          technicalRows={[
            { label: 'Scan Type', value: 'Website Spoof Analysis' },
          ]}
        />
      )}
    </div>
  );
}
