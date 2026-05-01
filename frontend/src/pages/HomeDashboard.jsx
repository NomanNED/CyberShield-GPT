import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../lib/api';

/* ── Threat distribution ring (SVG donut, no library) ─────────────────── */
function ThreatRing({ stats }) {
  const { threats = 0, warns = 0, safe = 0, total = 0 } = stats;
  const R = 36;
  const C = 2 * Math.PI * R; // circumference ≈ 226.2

  const segs = [
    { value: threats, color: 'var(--danger)' },
    { value: warns,   color: 'var(--warn)'   },
    { value: safe,    color: 'var(--safe)'   },
  ];

  let cum = 0;
  const arcs = total > 0
    ? segs.map(({ value, color }, i) => {
        const len    = (value / total) * C;
        const offset = C - cum;
        cum += len;
        if (value === 0) return null;
        return (
          <circle
            key={i}
            cx="50" cy="50" r={R}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={`${len} ${C}`}
            strokeDashoffset={offset}
          />
        );
      })
    : null;

  return (
    <div className="threat-ring-wrap">
      <svg viewBox="0 0 100 100" className="threat-ring-svg">
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={R} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          {arcs}
        </g>
        {total === 0
          ? <text x="50" y="54" textAnchor="middle"
              fill="rgba(255,255,255,0.25)" fontSize="8">No data</text>
          : <>
              <text x="50" y="46" textAnchor="middle"
                fill="rgba(255,255,255,0.92)" fontSize="15" fontWeight="700">{total}</text>
              <text x="50" y="57" textAnchor="middle"
                fill="rgba(255,255,255,0.38)" fontSize="7.5">scans</text>
            </>
        }
      </svg>
      <div className="threat-ring-legend">
        <div className="ring-legend-item">
          <span className="ring-dot" style={{ background: 'var(--danger)' }} />
          <span>{threats} threat{threats !== 1 ? 's' : ''}</span>
        </div>
        <div className="ring-legend-item">
          <span className="ring-dot" style={{ background: 'var(--warn)' }} />
          <span>{warns} warning{warns !== 1 ? 's' : ''}</span>
        </div>
        <div className="ring-legend-item">
          <span className="ring-dot" style={{ background: 'var(--safe)' }} />
          <span>{safe} clean</span>
        </div>
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    to: '/analyze',
    label: 'Run phishing scan',
    description: 'Inspect URLs, login pages, or pasted content with the hybrid detection engine.',
  },
  {
    to: '/fake-site',
    label: 'Investigate brand spoofing',
    description: 'Check whether a domain is impersonating a trusted brand or service.',
  },
  {
    to: '/email',
    label: 'Triaging suspicious email',
    description: 'Analyze sender signals, phishing phrases, and embedded links.',
  },
  {
    to: '/scams',
    label: 'Review scam intelligence',
    description: 'Use the awareness board as a live demo and operator briefing surface.',
  },
];

const METRICS = [
  { label: 'Modules Online', value: '7', detail: 'Investigation, hygiene, and awareness workflows' },
  { label: 'Detection Stack', value: 'Hybrid', detail: 'Rules, scoring, inspection, and AI explanation' },
  { label: 'Primary Use', value: 'Live Demo', detail: 'Built for rapid hackathon walkthroughs and analyst storytelling' },
];

const STACK_LAYERS = [
  {
    title: 'Signal Collection',
    description: 'Domain similarity, suspicious phrases, link extraction, sender checks, and lightweight page inspection.',
  },
  {
    title: 'Decision Engine',
    description: 'Weighted scoring correlates domain, content, and behavior evidence into a risk verdict and confidence level.',
  },
  {
    title: 'Analyst Experience',
    description: 'Tabbed investigation views translate raw evidence into a concise, demo-ready narrative.',
  },
];

const DEMO_FLOW = [
  'Open the phishing module and scan a suspicious brand domain.',
  'Pivot into technical evidence to show domain similarity and login signals.',
  'Use the email analyzer to demonstrate cross-channel phishing detection.',
  'Close with the scam intelligence board to position the platform as an awareness hub.',
];

const TYPE_COLORS = {
  'Phishing Analysis':   'inv',
  'Fake Site Detection': 'fake',
  'Email Threat Triage': 'email',
};

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const EMPTY_STATS = { total: 0, threats: 0, warns: 0, safe: 0, lastScan: null };

export default function HomeDashboard() {
  const [liveStats,    setLiveStats]    = useState(EMPTY_STATS);
  const [scans,        setScans]        = useState([]);
  const [feedError,    setFeedError]    = useState(false);
  const [feedLoading,  setFeedLoading]  = useState(true);
  const [feedFilter,   setFeedFilter]   = useState('all');

  const fetchFeed = useCallback(async () => {
    try {
      const res  = await fetch(apiUrl('/scan-history?limit=10'));
      if (!res.ok) throw new Error('not ok');
      const data = await res.json();
      setLiveStats(data.stats || EMPTY_STATS);
      setScans(data.scans  || []);
      setFeedError(false);
    } catch {
      setFeedError(true);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const timer = setInterval(fetchFeed, 10_000);
    return () => clearInterval(timer);
  }, [fetchFeed]);

  return (
    <div className="page dashboard-page">

      {/* ── Live stats bar ─────────────────────────────────────── */}
      <section className="live-stats-bar">
        <div className="live-stats-left">
          <div className="live-indicator">
            <span className="live-dot" />
            <span>Live session</span>
          </div>
          <div className="live-stat-cards">
            {feedLoading ? (
              <>
                <div className="skeleton skeleton-stat" />
                <div className="skeleton skeleton-stat" />
                <div className="skeleton skeleton-stat" />
                <div className="skeleton skeleton-stat" />
              </>
            ) : (
              <>
                <div className="live-stat-card">
                  <span className="live-stat-value">{liveStats.total}</span>
                  <span className="live-stat-label">Total Scans</span>
                </div>
                <div className="live-stat-card live-stat-threat">
                  <span className="live-stat-value">{liveStats.threats}</span>
                  <span className="live-stat-label">Threats</span>
                </div>
                <div className="live-stat-card live-stat-warn">
                  <span className="live-stat-value">{liveStats.warns}</span>
                  <span className="live-stat-label">Warnings</span>
                </div>
                <div className="live-stat-card live-stat-safe">
                  <span className="live-stat-value">{liveStats.safe}</span>
                  <span className="live-stat-label">Clean</span>
                </div>
                {liveStats.lastScan && (
                  <div className="live-stat-card live-stat-time">
                    <span className="live-stat-value">{timeAgo(liveStats.lastScan)}</span>
                    <span className="live-stat-label">Last Scan</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <ThreatRing stats={liveStats} />
      </section>

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="section-kicker">CyberShield GPT Command Center</span>
          <h2>Operator-grade threat analysis for a stronger hackathon demo.</h2>
          <p>
            This workspace turns the platform into a guided investigation surface instead of a set of isolated utilities.
            Use it to move from detection, to evidence, to explanation without losing the story.
          </p>
          <div className="dashboard-hero-actions">
            <Link className="primary-action" to="/analyze">Launch primary scan</Link>
            <Link className="secondary-action" to="/email">Open email triage</Link>
          </div>
        </div>

        <div className="dashboard-status-panel">
          <div className="dashboard-status-header">
            <span>Operational posture</span>
            <strong>Active</strong>
          </div>
          <div className="status-grid">
            {METRICS.map(metric => (
              <div key={metric.label} className="status-card">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <span className="section-kicker">Rapid Access</span>
          <h3>Start from the workflow you want to demonstrate.</h3>
        </div>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map(action => (
            <Link key={action.to} className="quick-action-card" to={action.to}>
              <span className="quick-action-label">{action.label}</span>
              <p>{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section dashboard-section-split">
        <div className="dashboard-panel">
          <div className="section-heading compact">
            <span className="section-kicker">Detection Architecture</span>
            <h3>What makes the platform feel intelligent.</h3>
          </div>
          <div className="stack-list">
            {STACK_LAYERS.map(layer => (
              <article key={layer.title} className="stack-card">
                <strong>{layer.title}</strong>
                <p>{layer.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="section-heading compact">
            <span className="section-kicker">Demo Narrative</span>
            <h3>Suggested flow for judges and mentors.</h3>
          </div>
          <ol className="demo-flow-list">
            {DEMO_FLOW.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Live scan feed ─────────────────────────────────────── */}
      <section className="dashboard-section">
        <div className="section-heading">
          <span className="section-kicker">Activity Feed</span>
          <h3>Real-time scan log — updates automatically every 10 seconds.</h3>
        </div>

        {/* Filter tabs */}
        <div className="feed-filter-tabs">
          {[
            { key: 'all',    label: 'All',      count: liveStats.total   },
            { key: 'threat', label: 'Threats',  count: liveStats.threats },
            { key: 'warn',   label: 'Warnings', count: liveStats.warns   },
            { key: 'safe',   label: 'Safe',     count: liveStats.safe    },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              className={`feed-filter-tab feed-filter-tab-${key} ${feedFilter === key ? 'feed-filter-tab-active' : ''}`}
              onClick={() => setFeedFilter(key)}
            >
              {label}
              <span className="feed-filter-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="scan-feed-panel">
          {feedLoading && (
            <div className="scan-feed-skeleton">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton skeleton-table-row" />
              ))}
            </div>
          )}
          {!feedLoading && feedError && (
            <div className="scan-feed-offline">
              Backend offline — start the API server to see live activity.
            </div>
          )}
          {!feedLoading && !feedError && scans.length === 0 && (
            <div className="scan-feed-empty">
              No scans yet. Run an analysis from any investigation module to populate this feed.
            </div>
          )}
          {!feedLoading && scans.length > 0 && (() => {
            const visible = feedFilter === 'all' ? scans : scans.filter(s => s.verdict === feedFilter);
            return visible.length === 0
              ? <div className="scan-feed-empty">No {feedFilter} scans in this session.</div>
              : (
                <table className="scan-feed-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Input</th>
                      <th>Verdict</th>
                      <th>Risk</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(scan => (
                      <tr key={scan.id} className={`scan-row scan-row-${scan.verdict}`}>
                        <td>
                          <span className={`type-badge type-badge-${TYPE_COLORS[scan.type] || 'inv'}`}>
                            {scan.type}
                          </span>
                        </td>
                        <td className="scan-input-cell">
                          <span title={scan.input}>{scan.input}</span>
                        </td>
                        <td>
                          <span className={`verdict-pill verdict-pill-${scan.verdict}`}>
                            {scan.verdict === 'threat' ? 'THREAT' : scan.verdict === 'warn' ? 'WARN' : 'SAFE'}
                          </span>
                        </td>
                        <td>
                          <div className="mini-risk-bar">
                            <div
                              className={`mini-risk-fill mini-risk-fill-${scan.verdict}`}
                              style={{ width: `${scan.riskScore}%` }}
                            />
                            <span>{scan.riskScore}</span>
                          </div>
                        </td>
                        <td className="scan-time-cell">{timeAgo(scan.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
          })()}
        </div>
      </section>

    </div>
  );
}