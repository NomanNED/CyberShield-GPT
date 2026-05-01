/**
 * UrlShortener.jsx
 * Shortens URLs with an integrated phishing safety check.
 */
import { useState } from 'react';
import ResultCard from '../components/ResultCard';
import RiskBar from '../components/RiskBar';

export default function UrlShortener() {
  const [url,     setUrl]     = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const shorten = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res  = await fetch('/shorten-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  return (
    <div className="page">
      <h2>Secure URL Shortener</h2>
      <p className="page-desc">
        Shorten a URL. Suspicious or phishing URLs will be blocked before shortening.
      </p>

      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com/very/long/path"
      />
      <button onClick={shorten} disabled={loading || !url.trim()}>
        {loading ? 'Processing…' : 'Shorten URL'}
      </button>

      {error && <div className="error-box">{error}</div>}

      {result && (
        <ResultCard verdict={result.shortened ? 'safe' : 'danger'}
                    label={result.shortened ? 'URL Shortened Successfully' : 'URL Blocked - Too Risky'}>

          {result.shortened ? (
            <div className="short-url-box">
              <span>Short URL:</span>
              <a href={result.short_url} target="_blank" rel="noreferrer">{result.short_url}</a>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result.short_url)}>
                Copy
              </button>
            </div>
          ) : (
            <p className="warning-text">{result.warning}</p>
          )}

          <h4>Safety Analysis</h4>
          <RiskBar score={result.analysis.risk_score} />
          <ul>{result.analysis.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </ResultCard>
      )}
    </div>
  );
}
