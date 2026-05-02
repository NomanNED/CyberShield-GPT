/**
 * LandingPage.jsx
 * Public-facing homepage. No sidebar. Has its own nav, hero, features, about, footer.
 * "Get Started" navigates to /dashboard as a guest.
 * Sign In is a placeholder — Firebase auth wired in a future phase.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Data ──────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    code: 'INV-01',
    color: 'accent',
    icon: '⚑',
    title: 'Phishing URL Analysis',
    desc: 'Paste any URL or message body and receive a correlated threat verdict in seconds. Domain inspection, content signals, and Groq AI reasoning are combined into one structured investigation view.',
    bullets: [
      'Domain similarity & typosquat scoring',
      'Brand impersonation pattern matching',
      'AI-powered behavioral reasoning chain',
      'Correlated multi-signal evidence timeline',
    ],
  },
  {
    code: 'INV-02',
    color: 'warn',
    icon: '⚿',
    title: 'Fake Website Detection',
    desc: 'Identify typosquatted and spoofed websites before users are deceived. Surface brand–domain distance scores, registration anomalies, and impersonation patterns in one structured report.',
    bullets: [
      'Typosquat similarity engine',
      'Brand spoof pattern matching',
      'Domain age & registration analysis',
      'Visual similarity scoring',
    ],
  },
  {
    code: 'INV-03',
    color: 'safe',
    icon: '✉',
    title: 'Email Security Triage',
    desc: 'Review full email content including headers, embedded links, and social-engineering language patterns. Suspicious phrases are highlighted inline for rapid investigation.',
    bullets: [
      'Inline suspicious-phrase highlighting',
      'Embedded link extraction & review',
      'Sender posture & header evaluation',
      'Threat-level classification (HIGH / MEDIUM / LOW)',
    ],
  },
  {
    code: 'UTL-01–04',
    color: 'info',
    icon: '⚙',
    title: 'Security Utilities',
    desc: 'A full toolkit layer covering password hygiene scoring, secure link sharing, SHA-256 digital asset fingerprinting, and scam-pattern intelligence — all under one roof.',
    bullets: [
      'Password entropy & strength review',
      'Safe URL shortener with risk gating',
      'SHA-256 digital asset fingerprinting',
      'Scam pattern intelligence board',
    ],
  },
];

/* ── Intersection Observer hook ────────────────────────────────────────────── */
function useVisible(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Feature row ───────────────────────────────────────────────────────────── */
function FeatureRow({ feature, index }) {
  const [ref, visible] = useVisible(0.08);
  const isRight = index % 2 !== 0;
  return (
    <div
      ref={ref}
      className={`feature-row ${isRight ? 'feature-row-right' : 'feature-row-left'} ${visible ? 'feature-row-visible' : ''}`}
    >
      <div className="feature-row-number">0{index + 1}</div>
      <div className="feature-row-body">
        <div className="feature-row-header">
          <span className={`feature-row-icon feature-row-icon-${feature.color}`} aria-hidden="true">
            {feature.icon}
          </span>
          <div>
            <span className="feature-row-code">{feature.code}</span>
            <h3 className="feature-row-title">{feature.title}</h3>
          </div>
        </div>
        <p className="feature-row-desc">{feature.desc}</p>
        <ul className="feature-row-bullets">
          {feature.bullets.map(b => (
            <li key={b}><span aria-hidden="true">›</span>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── About section ─────────────────────────────────────────────────────────── */
const ABOUT_CARDS = [
  { icon: '⚡', title: 'Hybrid Detection', desc: 'Rule-based scoring combined with live Groq AI reasoning — full explainability at every step, no black box.' },
  { icon: '◎', title: 'Session Intelligence', desc: 'Every scan is logged to a live history store with search, filtering, and per-scan drilldown modals.' },
  { icon: '☁', title: 'Cloud-Ready Architecture', desc: 'Firebase persistence and Google sign-in are already designed in — cloud connection ships in the next phase.' },
  { icon: '⬡', title: 'Command-Center UX', desc: 'Purpose-built dark interface: Ctrl+K navigation, analytics ring charts, export/copy tooling, live scan feed.' },
];

function AboutSection() {
  const [ref, visible] = useVisible(0.08);
  return (
    <div ref={ref} className={`about-inner${visible ? ' about-visible' : ''}`}>
      <span className="section-label">About</span>
      <h2 className="section-heading">Built for the next generation of defenders</h2>
      <p className="section-sub">One platform. Generative AI-powered detection. Automated response. Built for the next generation of defenders.</p>
      <div className="about-grid">
        {ABOUT_CARDS.map((c, i) => (
          <div key={c.title} className="about-card" style={{ '--delay': `${i * 0.09}s` }}>
            <span className="about-card-icon" aria-hidden="true">{c.icon}</span>
            <h4>{c.title}</h4>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate     = useNavigate();
  const [navHidden,  setNavHidden]  = useState(false);
  const [navScrolled,setNavScrolled]= useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const lastScrollY  = useRef(0);

  /* Hide nav on scroll-down, reveal on scroll-up */
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setNavScrolled(y > 50);
      setNavHidden(y > lastScrollY.current && y > 120);
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing">

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="mobile-nav-overlay" role="dialog" aria-modal="true">
          <button
            type="button"
            className="mobile-nav-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            &#10005;
          </button>
          <nav className="mobile-nav-links">
            <a href="#features" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#about"    className="mobile-nav-link" onClick={() => setMenuOpen(false)}>About</a>
            <button
              type="button"
              className="mobile-nav-signin"
              onClick={() => { setMenuOpen(false); navigate('/auth'); }}
            >
              Sign In
            </button>
          </nav>
        </div>
      )}

      {/* Invisible hover strip at top — reveals nav when it's hidden */}
      <div
        className="nav-hover-strip"
        onMouseEnter={() => setNavHidden(false)}
        aria-hidden="true"
      />

      {/* ── Top Navigation ─────────────────────────────────────────── */}
      <header
        className={`landing-nav${navScrolled ? ' landing-nav-scrolled' : ''}${navHidden ? ' landing-nav-hidden' : ''}`}
        onMouseEnter={() => setNavHidden(false)}
      >
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <span className="landing-nav-logo">CyberShield GPT</span>
            <span className="landing-nav-tag">GenAI Cyber Threat Platform</span>
          </div>
          <nav className="landing-nav-links" aria-label="Main navigation">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#about"    className="landing-nav-link">About</a>
            <button
              type="button"
              className="landing-signin-btn"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </button>
          </nav>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="landing-hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            &#9776;
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="landing-hero" aria-label="Hero">
        <div className="hero-grid-bg"   aria-hidden="true" />
        <div className="hero-glow-1"    aria-hidden="true" />
        <div className="hero-glow-2"    aria-hidden="true" />
        <div className="hero-scanlines" aria-hidden="true" />

        <div className="hero-inner">
          {/* Left: text */}
          <div className="hero-text">
            <span className="hero-eyebrow">
              <span className="hero-eyebrow-dot" aria-hidden="true" />
              Threat Intelligence Platform
            </span>
            <h1 className="hero-headline">
              Detect.<br />
              Analyze.<br />
              <span className="hero-headline-accent">Protect.</span>
            </h1>
            <p className="hero-sub">
              CyberShield GPT is a generative AI powered cyber threat detection & automated response suite for security teams and educators.
              Phishing detection, fake-site analysis, email triage, and AI&nbsp;reasoning
              — unified in one command center.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="hero-cta"
                onClick={() => navigate('/dashboard')}
              >
                Get Started
                <span className="hero-cta-arrow" aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="hero-signin-link"
                onClick={() => navigate('/auth')}
              >
                Already have an account? <span>Sign in</span>
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><strong>4</strong><span>investigation modules</span></div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat"><strong>AI</strong><span>Groq-powered reasoning</span></div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat"><strong>Live</strong><span>real-time scan history</span></div>
            </div>
          </div>

          {/* Right: terminal mockup */}
          <div className="hero-terminal" aria-hidden="true">
            <div className="terminal-bar">
              <span className="t-dot t-dot-red"    />
              <span className="t-dot t-dot-yellow" />
              <span className="t-dot t-dot-green"  />
              <span className="terminal-title">cybershield-gpt ~ analysis</span>
            </div>
            <div className="terminal-body">
              <p className="t-line">
                <span className="t-prompt">›</span>{' '}
                scan <span className="t-value">http://amaz0n-verify.com</span>
              </p>
              <p className="t-line t-anim-1"><span className="t-dim">[✓] Fetching domain metadata…</span></p>
              <p className="t-line t-anim-2"><span className="t-dim">[✓] Scoring behavioral signals…</span></p>
              <p className="t-line t-anim-3"><span className="t-dim">[✓] AI reasoning complete</span></p>
              <p className="t-line t-anim-4">
                <span className="t-verdict">⚑ THREAT — Risk score 94 / 100</span>
              </p>
              <p className="t-line t-anim-5">
                <span className="t-prompt">›</span> <span className="t-cursor">█</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="landing-features" id="features" aria-label="Features">
        <div className="section-header-block">
          <span className="section-label">Investigation Modules</span>
          <h2 className="section-heading">Everything your security team needs</h2>
          <p className="section-sub">Four purpose-built modules in a single command center.</p>
        </div>
        <div className="features-list">
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.code} feature={f} index={i} />
          ))}
        </div>
        <div className="features-cta-row">
          <button
            type="button"
            className="hero-cta hero-cta-sm"
            onClick={() => navigate('/dashboard')}
          >
            Open Command Center <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────── */}
      <section className="landing-about" id="about" aria-label="About">
        <AboutSection />
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="landing-footer" aria-label="Footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">CyberShield GPT</span>
            <p>Generative AI powered cyber threat detection &amp; automated response system — built for security teams, educators, and live analysis workflows.</p>
            <span className="footer-badge">Powered by Groq AI</span>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Platform</span>
            <button type="button" className="footer-link" onClick={() => navigate('/dashboard')}>Command Center</button>
            <button type="button" className="footer-link" onClick={() => navigate('/analyze')}>Phishing Analysis</button>
            <button type="button" className="footer-link" onClick={() => navigate('/fake-site')}>Fake Site Detection</button>
            <button type="button" className="footer-link" onClick={() => navigate('/history')}>Scan History</button>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Info</span>
            <a href="#features" className="footer-link">Features</a>
            <a href="#about"    className="footer-link">About</a>
            <button type="button" className="footer-link" onClick={() => navigate('/settings')}>Settings</button>
            <button type="button" className="footer-link footer-link-dim" disabled>Privacy Policy</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CyberShield GPT. All rights reserved.</span>
          <span className="footer-bottom-right">
            <span className="footer-status-dot" aria-hidden="true" />
            All systems operational
          </span>
        </div>
      </footer>
    </div>
  );
}
