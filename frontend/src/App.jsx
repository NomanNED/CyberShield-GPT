import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import HomeDashboard from './pages/HomeDashboard';
import PhishingAnalyzer   from './pages/PhishingAnalyzer';
import FakeWebsiteDetector from './pages/FakeWebsiteDetector';
import EmailAnalyzer      from './pages/EmailAnalyzer';
import PasswordChecker    from './pages/PasswordChecker';
import UrlShortener       from './pages/UrlShortener';
import CopyrightTool      from './pages/CopyrightTool';
import ScamDashboard      from './pages/ScamDashboard';
import Settings           from './pages/Settings';
import History            from './pages/History';
import LandingPage        from './pages/LandingPage';
import './App.css';

/**
 * CyberShield GPT – Root application shell.
 * Renders the sidebar + the currently active tool page.
 */
export default function App() {
  const location   = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const routeMeta = {
    '/dashboard': {
      eyebrow: 'Mission Overview',
      title: 'CyberShield GPT Command Center',
      subtitle: 'A stronger shell for live demos, investigations, and threat storytelling.',
    },
    '/analyze': {
      eyebrow: 'Primary Workflow',
      title: 'Phishing Analysis',
      subtitle: 'Correlate domain, content, behavior, and AI signals into a single verdict.',
    },
    '/fake-site': {
      eyebrow: 'Brand Protection',
      title: 'Fake Website Detection',
      subtitle: 'Surface typosquatting, impersonation patterns, and domain similarity risk.',
    },
    '/email': {
      eyebrow: 'Inbox Triage',
      title: 'Email Security Analysis',
      subtitle: 'Review sender posture, suspicious language, and embedded links in one view.',
    },
    '/password': {
      eyebrow: 'Hygiene Tooling',
      title: 'Password Strength Review',
      subtitle: 'Assess weak credentials and explain how to harden them quickly.',
    },
    '/shorten': {
      eyebrow: 'Safe Sharing',
      title: 'Secure URL Shortener',
      subtitle: 'Block risky destinations before creating a short link for distribution.',
    },
    '/copyright': {
      eyebrow: 'Asset Integrity',
      title: 'Digital Fingerprint Utility',
      subtitle: 'Generate a stable SHA-256 proof for images and creative assets.',
    },
    '/scams': {
      eyebrow: 'Awareness Layer',
      title: 'Scam Intelligence Dashboard',
      subtitle: 'Present scam patterns, warning signs, and public education material.',
    },
    '/settings': {
      eyebrow: 'Configuration',
      title: 'Settings',
      subtitle: 'Configure the AI engine, API key, detection cache, and system options.',
    },
    '/history': {
      eyebrow: 'Intelligence',
      title: 'Scan History',
      subtitle: 'Browse, search, and filter all scans run in this session.',
    },
  };

  const isLanding   = location.pathname === '/';
  const currentMeta = routeMeta[location.pathname] || routeMeta['/dashboard'];

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {isLanding ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      ) : (
        <div className="app-shell">
          <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
          <main className="content">
            <header className="content-topbar">
              <div>
                <span className="content-eyebrow">{currentMeta.eyebrow}</span>
                <h1>{currentMeta.title}</h1>
                <p>{currentMeta.subtitle}</p>
              </div>
              <div className="content-status-pill">
                <span className="status-indicator" aria-hidden="true" />
                Hybrid engine active
              </div>
            </header>
            <div className="content-body">
              <Routes>
                <Route path="/dashboard"  element={<HomeDashboard />}       />
                <Route path="/analyze"    element={<PhishingAnalyzer />}    />
                <Route path="/fake-site"  element={<FakeWebsiteDetector />} />
                <Route path="/email"      element={<EmailAnalyzer />}       />
                <Route path="/password"   element={<PasswordChecker />}     />
                <Route path="/shorten"    element={<UrlShortener />}        />
                <Route path="/copyright"  element={<CopyrightTool />}       />
                <Route path="/scams"      element={<ScamDashboard />}       />
                <Route path="/settings"   element={<Settings />}            />
                <Route path="/history"    element={<History />}             />
              </Routes>
            </div>
          </main>
        </div>
      )}
    </>
  );
}
