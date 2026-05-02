/**
 * Sidebar.jsx
 * Left-side navigation for all CyberShield GPT tools.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Command Center', code: 'CC-01' },
    ],
  },
  {
    title: 'Investigations',
    items: [
      { path: '/analyze', label: 'Phishing Analysis', code: 'INV-01' },
      { path: '/fake-site', label: 'Fake Website Detection', code: 'INV-02' },
      { path: '/email', label: 'Email Security Analysis', code: 'INV-03' },
    ],
  },
  {
    title: 'Utilities',
    items: [
      { path: '/password', label: 'Password Strength', code: 'UTL-01' },
      { path: '/shorten', label: 'Secure URL Shortener', code: 'UTL-02' },
      { path: '/copyright', label: 'Digital Fingerprint', code: 'UTL-03' },
      { path: '/scams', label: 'Scam Intelligence', code: 'UTL-04' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/history', label: 'Scan History', code: 'INT-01' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/settings', label: 'Settings', code: 'SYS-01' },
    ],
  },
];

export default function Sidebar({ onOpenPalette, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      {/* Mobile close button */}
      <button
        type="button"
        className="sidebar-close-btn"
        onClick={onClose}
        aria-label="Close navigation"
      >
        ✕
      </button>
      <div className="sidebar-brand">
        <div>
          <span className="brand-tag">Generative AI Cyber Threat Platform</span>
          <span className="brand-name">CyberShield GPT</span>
        </div>
      </div>

      <div className="sidebar-summary">
        <span className="sidebar-summary-label">System status</span>
        <strong>Ready for live analysis</strong>
        <p>Hybrid scoring, inspection, and AI reasoning available through one shell.</p>
      </div>

      {/* Command palette trigger */}
      <button
        type="button"
        className="palette-trigger"
        onClick={onOpenPalette}
        title="Open command palette"
      >
        <span className="palette-trigger-icon">⌕</span>
        <span className="palette-trigger-label">Quick navigate…</span>
        <kbd className="palette-trigger-kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>

      <div className="sidebar-sections">
        {NAV_SECTIONS.map(section => (
          <div key={section.title} className="sidebar-section">
            <span className="sidebar-section-title">{section.title}</span>
            <ul className="sidebar-nav">
              {section.items.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    onClick={onClose}
                  >
                    <span className="nav-code">{item.code}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── User section ──────────────────────────────────── */}
      {user ? (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.photoURL
              ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              : <span>{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
            }
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.displayName || 'User'}</span>
            <span className="sidebar-user-email">{user.email}</span>
          </div>
          <button type="button" className="sidebar-signout" onClick={handleSignOut} title="Sign out">
            ⏻
          </button>
        </div>
      ) : (
        <button type="button" className="sidebar-signin-prompt" onClick={() => navigate('/auth')}>
          <span className="sidebar-signin-icon">⊙</span>
          Sign in to sync history
        </button>
      )}
    </nav>
  );
}
