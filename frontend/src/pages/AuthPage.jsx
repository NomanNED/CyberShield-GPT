/**
 * AuthPage.jsx
 * Sign In / Create Account page.
 * Supports: Google Sign-In (one click) + email/password (sign-in or sign-up).
 * After successful auth → redirected to /dashboard.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode,     setMode]     = useState('signin');   // 'signin' | 'signup'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  /* ── Google Sign-In ──────────────────────────────────────────────────── */
  const handleGoogle = async () => {
    setLoading(true); setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (e) {
      setError(friendlyError(e.code));
    } finally { setLoading(false); }
  };

  /* ── Email form submit ───────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      }
      navigate('/dashboard');
    } catch (e) {
      setError(friendlyError(e.code));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid-bg"   aria-hidden="true" />
      <div className="auth-glow"      aria-hidden="true" />
      <div className="auth-scanlines" aria-hidden="true" />

      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo-link">
          <span className="auth-logo">CyberShield GPT</span>
          <span className="auth-logo-tag">GenAI Threat Platform</span>
        </Link>

        {/* Mode tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${mode === 'signin' ? ' auth-tab-active' : ''}`}
            onClick={() => { setMode('signin'); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab${mode === 'signup' ? ' auth-tab-active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {/* Google button */}
        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Email form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">Display Name</label>
              <input
                id="auth-name"
                type="text"
                className="auth-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                className="auth-input"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              <span aria-hidden="true">✕</span> {error}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? <><span className="scan-btn-spinner" aria-hidden="true" /> Please wait…</>
              : mode === 'signin' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        <p className="auth-footer-note">
          <Link to="/" className="auth-back-link">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Map Firebase error codes to friendly messages ───────────────────────── */
function friendlyError(code) {
  const map = {
    'auth/invalid-email':             'Please enter a valid email address.',
    'auth/user-not-found':            'No account found with this email.',
    'auth/wrong-password':            'Incorrect password. Please try again.',
    'auth/invalid-credential':        'Invalid email or password.',
    'auth/email-already-in-use':      'An account with this email already exists.',
    'auth/weak-password':             'Password is too weak (min 6 characters).',
    'auth/too-many-requests':         'Too many failed attempts. Please try again later.',
    'auth/popup-closed-by-user':      'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed':    'Network error. Check your connection.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
