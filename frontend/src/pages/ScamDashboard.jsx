/**
 * ScamDashboard.jsx
 * Displays the scam awareness dataset fetched from GET /scams.
 */
import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

const SEVERITY_COLOR = { Critical: '#ff4444', High: '#ff8800', Medium: '#ffcc00', Low: '#00ff88' };
const ALL_CATEGORIES = 'All';

export default function ScamDashboard() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState(ALL_CATEGORIES);

  useEffect(() => {
    fetch(apiUrl('/scams'))
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="page"><p>Loading scam data…</p></div>;
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>;

  const categories  = [ALL_CATEGORIES, ...Object.keys(data.grouped)];
  const visibleScams = activeTab === ALL_CATEGORIES
    ? data.scams
    : data.grouped[activeTab] || [];

  return (
    <div className="page">
      <h2>Scam Intelligence Dashboard</h2>
      <p className="page-desc">
        Browse {data.total} documented scam types. Stay informed to stay safe.
      </p>

      {/* Category tabs */}
      <div className="tabs">
        {categories.map(cat => (
          <button key={cat}
                  className={`tab-btn ${activeTab === cat ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Scam cards */}
      <div className="scam-grid">
        {visibleScams.map(scam => (
          <div key={scam.id} className="scam-card">
            <div className="scam-card-header">
              <span className="scam-category">{scam.category}</span>
              <span className="scam-severity"
                    style={{ color: SEVERITY_COLOR[scam.severity] }}>
                ● {scam.severity}
              </span>
            </div>
            <h3>{scam.title}</h3>
            <p>{scam.description}</p>
            <div className="scam-warnings">
              <strong>Warning Signs</strong>
              <ul>
                {scam.warning_signs.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
