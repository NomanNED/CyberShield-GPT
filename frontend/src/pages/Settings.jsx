/**
 * Settings.jsx — CyberShield GPT runtime configuration panel.
 * Reads from and writes to GET/POST /settings on the backend.
 */
import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

const SECTION = ({ title, kicker, children }) => (
  <section className="settings-section">
    <div className="settings-section-header">
      <span className="settings-kicker">{kicker}</span>
      <h3>{title}</h3>
    </div>
    <div className="settings-section-body">{children}</div>
  </section>
);

const Field = ({ label, hint, children }) => (
  <div className="settings-field">
    <div className="settings-field-label">
      <span>{label}</span>
      {hint && <p className="settings-hint">{hint}</p>}
    </div>
    <div className="settings-field-control">{children}</div>
  </div>
);

const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    className={`settings-toggle ${value ? 'settings-toggle-on' : ''}`}
    onClick={() => onChange(!value)}
    disabled={disabled}
    aria-pressed={value}
  >
    <span className="settings-toggle-thumb" />
    <span className="settings-toggle-label">{value ? 'On' : 'Off'}</span>
  </button>
);

export default function Settings() {
  const [cfg,        setCfg]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [apiKeyDraft,setApiKeyDraft] = useState('');
  const [showKey,    setShowKey]    = useState(false);
  const [toast,      setToast]      = useState(null);

  // ── Fetch current settings ────────────────────────────────────────────────
  useEffect(() => {
    fetch(apiUrl('/api/settings'))
      .then(r => r.json())
      .then(data => {
        setCfg(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Generic boolean / select patch ───────────────────────────────────────
  async function patch(key, value) {
    setSaving(true);
    try {
      const res  = await fetch(apiUrl('/api/settings'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCfg(data.settings);
      showToast('Setting saved.');
    } catch (e) {
      showToast(e.message || 'Failed to save.', 'err');
    }
    setSaving(false);
  }

  // ── Save API key ──────────────────────────────────────────────────────────
  async function saveApiKey() {
    if (!apiKeyDraft.trim()) return;
    await patch('groqApiKey', apiKeyDraft.trim());
    setApiKeyDraft('');
    setShowKey(false);
  }

  // ── Clear scan history ────────────────────────────────────────────────────
  async function clearHistory() {
    setSaving(true);
    try {
      const res  = await fetch(apiUrl('/api/settings/clear-history'), { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Scan history cleared.');
    } catch (e) {
      showToast(e.message || 'Failed.', 'err');
    }
    setSaving(false);
  }

  // ── Health check ─────────────────────────────────────────────────────────
  const [health, setHealth] = useState(null);
  async function checkHealth() {
    try {
      const res  = await fetch(apiUrl('/health'));
      const data = await res.json();
      setHealth(data.status === 'ok' ? 'Backend online' : 'Unexpected response');
    } catch {
      setHealth('Backend unreachable');
    }
  }

  if (loading) {
    return (
      <div className="page settings-page">
        <div className="settings-loading">Loading configuration…</div>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="page settings-page">
        <div className="settings-error">Could not reach the backend. Make sure the API server is running on port 5000.</div>
      </div>
    );
  }

  return (
    <div className="page settings-page">

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`settings-toast settings-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          AI ENGINE
      ═══════════════════════════════════════════════════════════════════ */}
      <SECTION kicker="AI-01" title="AI Engine Configuration">
        <Field
          label="Groq API Key"
          hint="Required for live LLM explanations. Key is stored in the server process only — it resets on restart unless you add it to backend/.env."
        >
          <div className="settings-api-key-row">
            <div className="settings-key-display">
              {cfg.groqApiKeySet
                ? <span className="settings-key-set">Key configured — {cfg.groqApiKey}</span>
                : <span className="settings-key-missing">No key configured — AI will use rule-based fallback</span>
              }
            </div>
            <input
              className="settings-input"
              type={showKey ? 'text' : 'password'}
              placeholder="gsk_…  paste new key here"
              value={apiKeyDraft}
              onChange={e => setApiKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
              autoComplete="off"
              spellCheck={false}
            />
            <div className="settings-key-actions">
              <button
                type="button"
                className="settings-btn-ghost"
                onClick={() => setShowKey(v => !v)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="settings-btn-primary"
                onClick={saveApiKey}
                disabled={!apiKeyDraft.trim() || saving}
              >
                Save Key
              </button>
            </div>
          </div>
        </Field>

        <Field label="AI Model" hint="Model used for Groq API requests. Faster smaller models are better for live demos.">
          <select
            className="settings-select"
            value={cfg.groqModel}
            onChange={e => patch('groqModel', e.target.value)}
            disabled={saving}
          >
            {(cfg.availableModels || []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="AI Enabled" hint="When off, all analysis uses the local rule engine only. Useful for offline demos.">
          <Toggle value={cfg.aiEnabled} onChange={v => patch('aiEnabled', v)} disabled={saving} />
        </Field>

        <Field label="AI Request Timeout" hint="Milliseconds before the Groq API call is aborted and the rule fallback is used.">
          <div className="settings-number-row">
            <input
              className="settings-input settings-input-sm"
              type="number"
              min={1000}
              max={30000}
              step={500}
              value={cfg.aiTimeout}
              onChange={e => setCfg(c => ({ ...c, aiTimeout: Number(e.target.value) }))}
              onBlur={e => patch('aiTimeout', Number(e.target.value))}
            />
            <span className="settings-unit">ms</span>
          </div>
        </Field>
      </SECTION>

      {/* ══════════════════════════════════════════════════════════════════
          DETECTION CACHE
      ═══════════════════════════════════════════════════════════════════ */}
      <SECTION kicker="DET-01" title="Detection Cache">
        <Field label="Result Cache" hint="Cache detection results for identical inputs. Speeds up repeated demo scans.">
          <Toggle value={cfg.cacheEnabled} onChange={v => patch('cacheEnabled', v)} disabled={saving} />
        </Field>

        <Field label="Max Cache Entries" hint="Maximum number of unique scan results stored in memory before oldest entries are dropped.">
          <div className="settings-number-row">
            <input
              className="settings-input settings-input-sm"
              type="number"
              min={10}
              max={1000}
              step={10}
              value={cfg.maxCacheSize}
              onChange={e => setCfg(c => ({ ...c, maxCacheSize: Number(e.target.value) }))}
              onBlur={e => patch('maxCacheSize', Number(e.target.value))}
            />
            <span className="settings-unit">entries</span>
          </div>
        </Field>
      </SECTION>

      {/* ══════════════════════════════════════════════════════════════════
          ACTIVITY LOGGING
      ═══════════════════════════════════════════════════════════════════ */}
      <SECTION kicker="LOG-01" title="Activity Logging">
        <Field label="Scan Logging" hint="Log each completed analysis to the live feed on the Command Center dashboard.">
          <Toggle value={cfg.scanLogging} onChange={v => patch('scanLogging', v)} disabled={saving} />
        </Field>

        <Field label="Clear Scan History" hint="Removes all entries from the live activity feed. This action cannot be undone.">
          <button
            type="button"
            className="settings-btn-danger"
            onClick={clearHistory}
            disabled={saving}
          >
            Clear History
          </button>
        </Field>
      </SECTION>

      {/* ══════════════════════════════════════════════════════════════════
          SYSTEM
      ═══════════════════════════════════════════════════════════════════ */}
      <SECTION kicker="SYS-01" title="System Status">
        <Field label="API Health Check" hint="Ping the backend to confirm it is reachable and reporting correctly.">
          <div className="settings-health-row">
            <button
              type="button"
              className="settings-btn-ghost"
              onClick={checkHealth}
            >
              Run Check
            </button>
            {health && (
              <span className={`settings-health-result ${health.includes('online') ? 'health-ok' : 'health-err'}`}>
                {health}
              </span>
            )}
          </div>
        </Field>

        <Field label="Backend Port" hint="The Express API server is expected on this port. Change via PORT in backend/.env.">
          <span className="settings-static-value">5000</span>
        </Field>

        <Field label="Scan History Store" hint="In-memory only. Resets on server restart. Future phases may add persistence.">
          <span className="settings-static-value">In-memory (session)</span>
        </Field>

        <Field label="AI Inference" hint="Inference is performed by Groq's hosted API — no GPU required locally.">
          <span className="settings-static-value">Groq Cloud API</span>
        </Field>
      </SECTION>

    </div>
  );
}
