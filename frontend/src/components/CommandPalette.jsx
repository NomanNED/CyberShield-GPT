/**
 * CommandPalette.jsx
 * Ctrl+K / Cmd+K floating command palette with fuzzy search and keyboard nav.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const ALL_COMMANDS = [
  /* ── Pages ─────────────────────────────────────────────────── */
  { id: 'go-home',      group: 'Pages', label: 'Command Center',          sub: 'Dashboard & live activity feed',  path: '/dashboard', icon: '⬡' },
  { id: 'go-analyze',   group: 'Pages', label: 'Phishing Analysis',       sub: 'Scan URLs for phishing risk',     path: '/analyze',   icon: '⚑' },
  { id: 'go-fake',      group: 'Pages', label: 'Fake Website Detection',  sub: 'Brand spoofing & typosquatting',  path: '/fake-site', icon: '⚿' },
  { id: 'go-email',     group: 'Pages', label: 'Email Security Analysis', sub: 'Sender & phishing phrase triage', path: '/email',     icon: '✉' },
  { id: 'go-password',  group: 'Pages', label: 'Password Strength',       sub: 'Credential hygiene checker',      path: '/password',  icon: '⚿' },
  { id: 'go-shorten',   group: 'Pages', label: 'Secure URL Shortener',    sub: 'Safe short links',                path: '/shorten',   icon: '↗' },
  { id: 'go-copyright', group: 'Pages', label: 'Digital Fingerprint',     sub: 'SHA-256 asset proof',             path: '/copyright', icon: '⊕' },
  { id: 'go-scams',     group: 'Pages', label: 'Scam Intelligence',       sub: 'Awareness board & patterns',      path: '/scams',     icon: '◎' },
  { id: 'go-settings',  group: 'Pages', label: 'Settings',                sub: 'AI engine, API key, cache',       path: '/settings',  icon: '⚙' },
  { id: 'go-history',   group: 'Pages', label: 'Scan History',             sub: 'Session scan log & activity',     path: '/history',   icon: '⊞' },
  /* ── Quick Actions ──────────────────────────────────────────── */
  { id: 'act-scan',     group: 'Quick Actions', label: 'Start a phishing scan',     sub: 'Open Phishing Analysis',        path: '/analyze',   icon: '▶' },
  { id: 'act-email',    group: 'Quick Actions', label: 'Triage a suspicious email', sub: 'Open Email Security Analysis',  path: '/email',     icon: '▶' },
  { id: 'act-brand',    group: 'Quick Actions', label: 'Check brand spoofing',      sub: 'Open Fake Website Detection',   path: '/fake-site', icon: '▶' },
  { id: 'act-scams',    group: 'Quick Actions', label: 'Review scam intelligence',  sub: 'Open Scam Intelligence Board',  path: '/scams',     icon: '▶' },
];

function fuzzy(query, text) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette({ open, onClose }) {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const listRef   = useRef(null);
  const [query,   setQuery]   = useState('');
  const [cursor,  setCursor]  = useState(0);

  /* Reset state every time it opens */
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return ALL_COMMANDS.filter(c =>
      fuzzy(q, c.label) || fuzzy(q, c.sub) || fuzzy(q, c.group)
    );
  }, [query]);

  /* Clamp cursor when list shrinks */
  useEffect(() => {
    setCursor(c => Math.min(c, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  /* Scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const commit = useCallback((cmd) => {
    onClose();
    navigate(cmd.path);
  }, [navigate, onClose]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[cursor]) commit(filtered[cursor]);
    }
  }, [filtered, cursor, commit, onClose]);

  if (!open) return null;

  /* Group items for rendering */
  const groups = [];
  const seen   = new Set();
  filtered.forEach(cmd => {
    if (!seen.has(cmd.group)) { groups.push(cmd.group); seen.add(cmd.group); }
  });

  let globalIndex = 0;

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette-modal" onMouseDown={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="palette-search-row">
          <span className="palette-search-icon">⌕</span>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search pages, tools, actions…"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="palette-clear-btn" type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>✕</button>
          )}
        </div>

        {/* Results */}
        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">No results for "{query}"</div>
          )}
          {groups.map(group => (
            <div key={group} className="palette-group">
              <div className="palette-group-label">{group}</div>
              {filtered.filter(c => c.group === group).map(cmd => {
                const idx      = globalIndex++;
                const isActive = idx === cursor;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    data-active={isActive}
                    className={`palette-item ${isActive ? 'palette-item-active' : ''}`}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => commit(cmd)}
                  >
                    <span className="palette-item-icon">{cmd.icon}</span>
                    <span className="palette-item-text">
                      <span className="palette-item-label">{cmd.label}</span>
                      <span className="palette-item-sub">{cmd.sub}</span>
                    </span>
                    {isActive && <span className="palette-item-enter">↵ enter</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵ Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
