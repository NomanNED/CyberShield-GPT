/**
 * History.jsx
 * Shows all scan history from the session.
 * Firebase persistence + Google sign-in will be wired in a future phase.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { getUserScans, clearUserScans } from '../lib/firestore';

const TYPE_META = {
  'Phishing Analysis':   { code: 'INV-01', cls: 'inv'   },
  'Fake Site Detection': { code: 'INV-02', cls: 'fake'  },
  'Email Threat Triage': { code: 'INV-03', cls: 'email' },
};

const VERDICT_LABEL = { threat: 'THREAT', warn: 'WARN', safe: 'SAFE' };

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

/* ── Detail modal ─────────────────────────────────────────────────────────── */
function ScanDetailModal({ scan, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!scan) return null;
  const meta = TYPE_META[scan.type] || { code: '???', cls: 'inv' };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-panel" ref={ref} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className={`type-badge type-badge-${meta.cls}`}>{scan.type}</span>
            <span className={`verdict-pill verdict-pill-${scan.verdict}`}>{VERDICT_LABEL[scan.verdict]}</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-field-grid">
            <div className="modal-field">
              <span className="modal-field-label">Target / Input</span>
              <strong className="modal-field-value modal-field-mono">{scan.input || '—'}</strong>
            </div>
            <div className="modal-field">
              <span className="modal-field-label">Risk Score</span>
              <strong className="modal-field-value">{scan.riskScore} / 100</strong>
            </div>
            <div className="modal-field">
              <span className="modal-field-label">Confidence</span>
              <strong className="modal-field-value">{scan.confidence}%</strong>
            </div>
            <div className="modal-field">
              <span className="modal-field-label">Scan ID</span>
              <strong className="modal-field-value modal-field-mono">{scan.id}</strong>
            </div>
            <div className="modal-field">
              <span className="modal-field-label">Timestamp</span>
              <strong className="modal-field-value">{new Date(scan.timestamp).toLocaleString()}</strong>
            </div>
            <div className="modal-field">
              <span className="modal-field-label">Module</span>
              <strong className="modal-field-value">{meta.code} — {scan.type}</strong>
            </div>
          </div>

          {/* Risk bar */}
          <div className="modal-risk-section">
            <div className="modal-risk-label-row">
              <span>Risk Score</span>
              <span>{scan.riskScore}/100</span>
            </div>
            <div className="score-bar-bg">
              <div
                className="score-bar-fill"
                style={{
                  width: `${scan.riskScore}%`,
                  backgroundColor: scan.riskScore >= 60 ? '#ff4444' : scan.riskScore >= 30 ? '#ffaa00' : '#00ff88',
                  transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>

          <div className="modal-firebase-note">
            <span className="modal-firebase-icon">☁</span>
            <p>Full result details will be available here once Firebase persistence is connected. This session's data resets on server restart.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-footer-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function History() {
  const { user }           = useAuth();
  const [scans,        setScans]        = useState([]);
  const [stats,        setStats]        = useState({ total: 0, threats: 0, warns: 0, safe: 0 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState(null);
  const [clearing,     setClearing]     = useState(false);

  const computeStats = (list) => ({
    total:   list.length,
    threats: list.filter(s => s.verdict === 'threat').length,
    warns:   list.filter(s => s.verdict === 'warn').length,
    safe:    list.filter(s => s.verdict === 'safe').length,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Signed in — load from Firestore
        const list = await getUserScans(user.uid, 100);
        setScans(list);
        setStats(computeStats(list));
      } else {
        // Guest — load from backend session store
        const res  = await fetch(apiUrl('/scan-history?limit=100'));
        if (!res.ok) throw new Error('Backend returned ' + res.status);
        const data = await res.json();
        setScans(data.scans  || []);
        setStats(data.stats  || { total: 0, threats: 0, warns: 0, safe: 0 });
      }
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const clearAll = async () => {
    if (!window.confirm('Clear all scan history?')) return;
    setClearing(true);
    try {
      if (user) {
        await clearUserScans(user.uid);
      } else {
        await fetch(apiUrl('/api/settings/clear-history'), { method: 'POST' });
      }
      setScans([]);
      setStats({ total: 0, threats: 0, warns: 0, safe: 0 });
    } catch { /* best-effort */ }
    setClearing(false);
  };

  const visible = scans.filter(s => {
    if (filter !== 'all' && s.verdict !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.input?.toLowerCase().includes(q) ||
        s.type?.toLowerCase().includes(q)  ||
        s.verdict?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page history-page">

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <div className="history-stats-strip">
        {[
          { label: 'Total',    value: stats.total,   cls: '' },
          { label: 'Threats',  value: stats.threats, cls: 'threat' },
          { label: 'Warnings', value: stats.warns,   cls: 'warn' },
          { label: 'Safe',     value: stats.safe,    cls: 'safe' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`history-stat ${cls ? `history-stat-${cls}` : ''}`}>
            <span className="history-stat-value">{loading ? '—' : value}</span>
            <span className="history-stat-label">{label}</span>
          </div>
        ))}
        <div className="history-stat-spacer" />
        <button
          type="button"
          className="history-clear-btn"
          onClick={clearAll}
          disabled={clearing || scans.length === 0}
        >
          {clearing ? 'Clearing…' : 'Clear Session'}
        </button>
      </div>

      {/* ── Firebase teaser ─────────────────────────────────────── */}
      <div className="history-firebase-banner">
        <span className="history-firebase-icon">☁</span>
        <div>
          <strong>Cloud sync coming soon</strong>
          <p>Persistent history, Google sign-in, and cross-device scan logs will be available once Firebase is connected.</p>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="history-toolbar">
        {/* Filter tabs */}
        <div className="feed-filter-tabs">
          {[
            { key: 'all',    label: 'All',     count: stats.total   },
            { key: 'threat', label: 'Threats', count: stats.threats },
            { key: 'warn',   label: 'Warnings',count: stats.warns   },
            { key: 'safe',   label: 'Safe',    count: stats.safe    },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              className={`feed-filter-tab feed-filter-tab-${key} ${filter === key ? 'feed-filter-tab-active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
              <span className="feed-filter-count">{loading ? '…' : count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="history-search-wrap">
          <span className="history-search-icon">⌕</span>
          <input
            type="text"
            className="history-search-input"
            placeholder="Search by target, type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="history-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="scan-feed-panel">
        {loading && (
          <div className="scan-feed-skeleton">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton skeleton-table-row" />)}
          </div>
        )}

        {!loading && error && (
          <div className="history-error-state">
            <span className="history-error-icon">⚠</span>
            <strong>Backend offline</strong>
            <p>{error}</p>
            <button type="button" className="history-retry-btn" onClick={load}>Retry</button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="history-empty-state">
            <span className="history-empty-icon">◎</span>
            <strong>{scans.length === 0 ? 'No scans yet' : 'No matching results'}</strong>
            <p>
              {scans.length === 0
                ? 'Run an analysis from any investigation module — results will appear here automatically.'
                : 'Try adjusting your filter or search query.'}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <table className="scan-feed-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Target / Input</th>
                <th>Verdict</th>
                <th>Risk</th>
                <th>Confidence</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(scan => {
                const meta = TYPE_META[scan.type] || { code: '???', cls: 'inv' };
                return (
                  <tr
                    key={scan.id}
                    className={`scan-row scan-row-${scan.verdict} scan-row-clickable`}
                    onClick={() => setSelected(scan)}
                  >
                    <td>
                      <span className={`type-badge type-badge-${meta.cls}`}>{scan.type}</span>
                    </td>
                    <td className="scan-input-cell">
                      <span title={scan.input}>{scan.input}</span>
                    </td>
                    <td>
                      <span className={`verdict-pill verdict-pill-${scan.verdict}`}>
                        {VERDICT_LABEL[scan.verdict]}
                      </span>
                    </td>
                    <td>
                      <div className="mini-risk-bar">
                        <div className={`mini-risk-fill mini-risk-fill-${scan.verdict}`}
                          style={{ width: `${scan.riskScore}%` }} />
                        <span>{scan.riskScore}</span>
                      </div>
                    </td>
                    <td className="scan-confidence-cell">{scan.confidence}%</td>
                    <td className="scan-time-cell">{timeAgo(scan.timestamp)}</td>
                    <td>
                      <button
                        type="button"
                        className="scan-detail-btn"
                        onClick={e => { e.stopPropagation(); setSelected(scan); }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <ScanDetailModal scan={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
