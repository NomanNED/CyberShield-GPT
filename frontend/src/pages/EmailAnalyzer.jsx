/**
 * EmailAnalyzer.jsx
 * Analyzes email text for social engineering indicators.
 */
import { useState } from 'react';
import { apiUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { saveScan } from '../lib/firestore';
import AnalysisResult from '../components/AnalysisResult';

// Simple function to wrap matched phrases in a highlight span
function highlight(text, phrases) {
  if (!phrases || phrases.length === 0) return text;
  // Sort longest first so sub-phrases don't break longer matches
  const sorted  = [...phrases].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Use a fresh (non-global) regex for the test to avoid stateful lastIndex bugs
  const splitRegex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const testRegex  = new RegExp(`^(${escaped.join('|')})$`, 'i');
  return text.split(splitRegex).map((part, i) =>
    testRegex.test(part)
      ? <mark key={i} className="highlight">{part}</mark>
      : part
  );
}

export default function EmailAnalyzer() {
  const { user } = useAuth();
  const [text,    setText]    = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res  = await fetch(apiUrl('/analyze-email'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResult(data);
      if (user) {
        saveScan(user.uid, {
          type:       'Email Threat Triage',
          input:      text.slice(0, 300),
          riskScore:  data.risk_score ?? 0,
          verdict:    data.threat_level === 'HIGH' ? 'threat' : data.threat_level === 'MEDIUM' ? 'warn' : 'safe',
          confidence: data.confidence ?? Math.round((data.risk_score ?? 0) * 0.9),
        });
      }
    } catch (e) {
      const offline = e instanceof TypeError || e.message === 'Failed to fetch';
      setError(offline ? '__offline__' : e.message);
    } finally { setLoading(false); }
  };

  const threatColor = { HIGH: 'danger', MEDIUM: 'warn', LOW: 'safe' };

  return (
    <div className="page">
      <div className="scan-form-card">
        <label className="form-label" htmlFor="ea-input">
          Email content
          <span className="form-label-hint">Include headers (From, Subject) for best results</span>
        </label>
        <textarea
          id="ea-input"
          className="form-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste full email content here — headers, subject, and body…"
          rows={7}
          spellCheck={false}
        />
        <div className="form-actions">
          <button type="button" className="scan-btn" onClick={analyze} disabled={loading || !text.trim()}>
            {loading ? <><span className="scan-btn-spinner" aria-hidden="true" /> Analyzing…</> : 'Analyze Email'}
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
          title="Inbox Threat Triage"
          safeLabel="Low-Risk Message"
          dangerLabel={`Threat Level: ${result.threat_level}`}
          verdictOverride={threatColor[result.threat_level] || 'safe'}
          overview={result.is_phishing
            ? 'This message contains coordinated social-engineering indicators and should be treated as a phishing attempt.'
            : 'The email currently appears low-risk, with no strong multi-signal phishing pattern detected.'}
          summaryRows={[
            { label: 'Sender', value: result.metadata?.sender || 'No sender extracted' },
            { label: 'Links Found', value: String(result.links_found?.length || 0) },
          ]}
          evidenceSections={[
            ...(result.links_found.length > 0 ? [{
              title: `Links Found (${result.links_found.length})`,
              content: (
                <ul className="link-list">
                  {result.links_found.map((link, index) => <li key={index}>{link}</li>)}
                </ul>
              ),
            }] : []),
            ...(result.suspicious_phrases.length > 0 ? [{
              title: 'Highlighted Email Content',
              content: (
                <div className="email-preview">
                  {highlight(text, result.suspicious_phrases)}
                </div>
              ),
            }] : []),
          ]}
          technicalRows={[
            { label: 'Scan Type', value: 'Email Threat Analysis' },
            { label: 'Threat Level', value: result.threat_level },
          ]}
        />
      )}
    </div>
  );
}
