/**
 * PasswordChecker.jsx
 * Rates password strength and shows actionable improvement tips.
 */
import { useState } from 'react';
import ResultCard from '../components/ResultCard';

const STRENGTH_COLORS = { Weak: '#ff4444', Medium: '#ffaa00', Strong: '#00ff88' };
const STRENGTH_VERDICTS = { Weak: 'danger', Medium: 'warn', Strong: 'safe' };

export default function PasswordChecker() {
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const check = async () => {
    if (!password) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res  = await fetch('/check-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  return (
    <div className="page">
      <h2>Password Strength Review</h2>
      <p className="page-desc">
        Enter a password to evaluate its strength. Passwords are never stored or logged.
      </p>

      <div className="password-field">
        <input
          type={show ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter a password to test…"
        />
        <button className="toggle-btn" onClick={() => setShow(s => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      <button onClick={check} disabled={loading || !password}>
        {loading ? 'Checking…' : 'Check Strength'}
      </button>

      {error && <div className="error-box">{error}</div>}

      {result && (
        <ResultCard verdict={STRENGTH_VERDICTS[result.strength]}
                    label={`Strength: ${result.strength} (score ${result.score}/100)`}>

          {/* Visual strength meter */}
          <div className="score-bar-bg">
            <div className="score-bar-fill"
                 style={{ width: `${result.score}%`, backgroundColor: STRENGTH_COLORS[result.strength] }} />
          </div>

          {/* Criterion checklist */}
          <h4>Criteria</h4>
          <ul className="checks-list">
            {Object.entries(result.checks).map(([key, passed]) => (
              <li key={key} className={passed ? 'check-pass' : 'check-fail'}>
                {passed ? 'Pass' : 'Fail'} - {formatCheckLabel(key)}
              </li>
            ))}
          </ul>

          {result.suggestions.length > 0 && (
            <>
              <h4>Suggestions</h4>
              <ul>{result.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
        </ResultCard>
      )}
    </div>
  );
}

function formatCheckLabel(key) {
  const labels = {
    length12:    'At least 12 characters',
    length8:     'At least 8 characters',
    uppercase:   'Contains uppercase letters',
    lowercase:   'Contains lowercase letters',
    numbers:     'Contains numbers',
    symbols:     'Contains symbols',
    noCommon:    'Not a common password',
    noRepeating: 'No repeating characters (3+)',
  };
  return labels[key] || key;
}
