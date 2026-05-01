import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import ResultCard from './ResultCard';
import RiskBar from './RiskBar';

/* ── Report helpers ──────────────────────────────────────────────────────── */
function buildReportData(result, verdictLabel, aiReport) {
  const target = result.metadata?.domain || result.metadata?.sender || 'N/A';
  const date   = new Date().toLocaleString();
  return { target, date, verdictLabel, result, aiReport };
}

function buildPlainText({ target, date, verdictLabel, result, aiReport }) {
  const lines = [
    'CyberShield GPT Scan Report',
    '='.repeat(42),
    `Target  : ${target}`,
    `Verdict : ${verdictLabel}`,
    `Risk    : ${result.risk_score}/100  (${result.risk_level})`,
    `Date    : ${date}`,
    '',
  ];
  if (aiReport?.summary) {
    lines.push('AI Summary', '-'.repeat(20), aiReport.summary, '');
  }
  if (aiReport?.reasoning?.length) {
    lines.push('Reasoning Chain', '-'.repeat(20));
    aiReport.reasoning.forEach((s, i) => {
      lines.push(`${i + 1}. [${s.signal}] ${s.finding}`);
      if (s.implication) lines.push(`   => ${s.implication}`);
    });
    lines.push('');
  }
  if (result.reasons?.length) {
    lines.push('Evidence', '-'.repeat(20));
    result.reasons.forEach(r => lines.push(`  - ${r}`));
    lines.push('');
  }
  return lines.join('\n');
}

function buildMarkdown({ target, date, verdictLabel, result, aiReport }) {
  const lines = [
    `# CyberShield GPT Scan Report`,
    ``,
    `| Field   | Value |`,
    `|---------|-------|`,
    `| Target  | \`${target}\` |`,
    `| Verdict | **${verdictLabel}** |`,
    `| Risk    | ${result.risk_score}/100 (${result.risk_level}) |`,
    `| Date    | ${date} |`,
    ``,
  ];
  if (aiReport?.summary) {
    lines.push(`## AI Summary`, ``, aiReport.summary, ``);
  }
  if (aiReport?.reasoning?.length) {
    lines.push(`## Reasoning Chain`, '');
    aiReport.reasoning.forEach((s, i) => {
      lines.push(`### ${i + 1}. ${s.signal}`, `**Finding:** ${s.finding}`);
      if (s.implication) lines.push(`**Implication:** ${s.implication}`);
      lines.push('');
    });
  }
  if (result.reasons?.length) {
    lines.push(`## Evidence`, '');
    result.reasons.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }
  return lines.join('\n');
}

function buildCSV({ target, date, verdictLabel, result }) {
  const rows = [
    ['Field', 'Value'],
    ['Target', target],
    ['Verdict', verdictLabel],
    ['Risk Score', result.risk_score],
    ['Risk Level', result.risk_level],
    ['Date', date],
    [],
    ['#', 'Evidence Item'],
    ...(result.reasons || []).map((r, i) => [i + 1, r]),
  ];
  return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function buildPrintHTML({ target, date, verdictLabel, result, aiReport }) {
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const reasons = (result.reasons || []).map(r => `<li>${esc(r)}</li>`).join('');
  const reasoning = (aiReport?.reasoning || []).map((s, i) =>
    `<div style="margin-bottom:10px"><b>${i+1}. [${esc(s.signal)}]</b> ${esc(s.finding)}<br/><em>${esc(s.implication)}</em></div>`
  ).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>CyberShield GPT Report</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111}h1{color:#1a1a2e}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px 12px}th{background:#f0f0f0}ul{padding-left:20px}@media print{body{margin:20px}}</style>
</head><body>
<h1>CyberShield GPT Scan Report</h1>
<table><tr><th>Target</th><td>${esc(target)}</td></tr>
<tr><th>Verdict</th><td><b>${esc(verdictLabel)}</b></td></tr>
<tr><th>Risk Score</th><td>${result.risk_score}/100 (${esc(result.risk_level)})</td></tr>
<tr><th>Date</th><td>${esc(date)}</td></tr></table>
${aiReport?.summary ? `<h2>AI Summary</h2><p>${esc(aiReport.summary)}</p>` : ''}
${reasoning ? `<h2>Reasoning Chain</h2>${reasoning}` : ''}
${reasons ? `<h2>Evidence</h2><ul>${reasons}</ul>` : ''}
</body></html>`;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyToClipboard(text, onDone) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => fallback(text, onDone));
  } else {
    fallback(text, onDone);
  }
}
function fallback(text, onDone) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); onDone(); } catch {}
  document.body.removeChild(ta);
}

const SIGNAL_COLORS = {
  'Domain Intelligence': 'signal-domain',
  'Content Analysis':    'signal-content',
  'Behavioral Signals':  'signal-behavior',
  'Rule Engine':         'signal-rule',
};
function signalClass(signal) {
  return SIGNAL_COLORS[signal] || 'signal-default';
}

function toTitleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function groupFindings(reasons) {
  const groups = {
    domain: [],
    content: [],
    behavior: [],
    system: [],
  };

  for (const reason of reasons || []) {
    const lower = reason.toLowerCase();

    if (/(domain|top-level domain|homoglyph|subdomain|http|https|trusted brand|brand name)/.test(lower)) {
      groups.domain.push(reason);
    } else if (/(urgency|sensitive terms|phrase|sender|contains \d+ link|contains 1 link|exclamation|provider address)/.test(lower)) {
      groups.content.push(reason);
    } else if (/(mismatch|login or verification|urgent messaging|login form|page title)/.test(lower)) {
      groups.behavior.push(reason);
    } else {
      groups.system.push(reason);
    }
  }

  return [
    { key: 'domain', title: 'Domain Evidence', items: groups.domain },
    { key: 'content', title: 'Content Evidence', items: groups.content },
    { key: 'behavior', title: 'Behavior Evidence', items: groups.behavior },
    { key: 'system', title: 'Additional Findings', items: groups.system },
  ].filter(group => group.items.length > 0);
}

function breakdownEntries(breakdown) {
  if (!breakdown) return [];

  return Object.entries(breakdown).map(([key, value]) => ({
    key,
    label: toTitleCase(key),
    value,
  }));
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'None';
  return String(value);
}

function buildTechnicalRows(result, technicalRows) {
  const baseRows = technicalRows || [];
  const metadata = result.metadata || {};
  const scrape = metadata.scrape || {};

  const scrapeStatus = scrape.skipped
    ? `Skipped: ${scrape.reason || 'No data'}`
    : 'Completed';

  return [
    ...baseRows,
    { label: 'Observed Domain',        value: metadata.domain },
    { label: 'Base Domain',            value: metadata.base_domain },
    { label: 'Closest Trusted Domain', value: metadata.closest_trusted_domain },
    { label: 'Similarity',             value: metadata.similarity !== undefined ? `${Math.round((metadata.similarity || 0) * 100)}%` : null },
    { label: 'Sender',                 value: metadata.sender },
    { label: 'Links Found',            value: metadata.links_found },
    { label: 'Suspicious Phrases',     value: metadata.suspicious_phrases },
    // Page scrape section
    { label: 'Scrape Status',          value: scrapeStatus },
    { label: 'Page Title',             value: scrape.title },
    { label: 'Meta Description',       value: scrape.metaDescription },
    { label: 'Forms Detected',         value: scrape.formCount },
    { label: 'Input Fields',           value: scrape.inputCount },
    { label: 'Password Fields',        value: scrape.passwordFieldCount },
    { label: 'Hidden Inputs',          value: scrape.hiddenInputCount },
    { label: 'Login Form Detected',    value: scrape.hasLoginForm },
    { label: 'External Scripts',       value: scrape.scriptCount },
    { label: 'External Links',         value: scrape.externalLinkCount },
    {
      label: 'External Domains',
      value: Array.isArray(scrape.externalDomains) && scrape.externalDomains.length > 0
        ? scrape.externalDomains.join(', ')
        : null,
    },
  ].filter(row => row.value !== null && row.value !== undefined && row.value !== '');
}

export default function AnalysisResult({
  result,
  title,
  safeLabel = 'Likely Safe',
  dangerLabel = 'Suspicious / Phishing Risk',
  verdictOverride,
  overview,
  summaryRows = [],
  evidenceSections = [],
  technicalRows = [],
}) {
  if (!result) return null;

  const verdict = verdictOverride || (result.is_phishing ? 'danger' : result.risk_level === 'medium' ? 'warn' : 'safe');
  const verdictLabel = result.is_phishing ? dangerLabel : safeLabel;
  const evidenceGroups = useMemo(() => groupFindings(result.reasons || []), [result.reasons]);
  const metrics = [
    { label: 'Risk Level', value: toTitleCase(result.risk_level) },
    { label: 'Confidence', value: (result.ai_report?.confidence != null ? `${result.ai_report.confidence}%` : toTitleCase(result.confidence)) },
    { label: 'Evidence', value: String(result.reasons?.length || 0) },
  ];
  const breakdown = useMemo(() => breakdownEntries(result.breakdown), [result.breakdown]);
  const computedTechnicalRows = useMemo(
    () => buildTechnicalRows(result, technicalRows),
    [result, technicalRows]
  );
  const aiReport = result.ai_report || null;
  const [activeTab,    setActiveTab]    = useState('summary');
  const [copied,       setCopied]       = useState(false);
  const [exportOpen,   setExportOpen]   = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    function onOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const reportPayload = useMemo(
    () => buildReportData(result, verdictLabel, aiReport),
    [result, verdictLabel, aiReport]
  );

  const copyReport = useCallback(() => {
    copyToClipboard(buildPlainText(reportPayload), () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [reportPayload]);

  const EXPORT_FORMATS = [
    { key: 'pdf',      label: 'PDF (print dialog)',  icon: '⎙' },
    { key: 'doc',      label: 'Word Document (.doc)', icon: '📄' },
    { key: 'markdown', label: 'Markdown (.md)',       icon: '📝' },
    { key: 'json',     label: 'JSON (.json)',         icon: '{ }' },
    { key: 'csv',      label: 'CSV (.csv)',           icon: '⊞' },
  ];

  const exportReport = useCallback((fmt) => {
    setExportOpen(false);
    const slug = (reportPayload.target || 'report').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    if (fmt === 'pdf') {
      const html = buildPrintHTML(reportPayload);
      const win  = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
      return;
    }
    if (fmt === 'doc') {
      downloadBlob(buildPrintHTML(reportPayload), `${slug}.doc`, 'application/msword');
      return;
    }
    if (fmt === 'markdown') {
      downloadBlob(buildMarkdown(reportPayload), `${slug}.md`, 'text/markdown');
      return;
    }
    if (fmt === 'json') {
      downloadBlob(JSON.stringify(result, null, 2), `${slug}.json`, 'application/json');
      return;
    }
    if (fmt === 'csv') {
      downloadBlob(buildCSV(reportPayload), `${slug}.csv`, 'text/csv');
    }
  }, [reportPayload, result]);

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'evidence', label: `Evidence (${result.reasons?.length || 0})` },
    { key: 'ai', label: 'AI Explanation' },
    { key: 'technical', label: 'Technical Details' },
  ];

  return (
    <ResultCard verdict={verdict} label={verdictLabel} title={title}>
      <div className="analysis-summary-grid">
        <div className="analysis-summary-main">
          <RiskBar score={result.risk_score} level={result.risk_level} />
        </div>
        <div className="analysis-metrics-grid">
          {metrics.map(metric => (
            <div key={metric.label} className="analysis-metric-card">
              <span className="analysis-metric-label">{metric.label}</span>
              <strong className="analysis-metric-value">{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="investigation-tabs-row" role="tablist" aria-label="Investigation sections">
        <div className="investigation-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`investigation-tab ${activeTab === tab.key ? 'investigation-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`copy-report-btn ${copied ? 'copy-report-btn-done' : ''}`}
          onClick={copyReport}
          title="Copy report to clipboard"
        >
          {copied ? 'Copied!' : 'Copy Report'}
        </button>
      </div>

      {activeTab === 'summary' && (
        <div className="investigation-panel">
          {overview && <div className="analysis-overview-box">{overview}</div>}

          {summaryRows.length > 0 && (
            <div className="analysis-summary-rows">
              {summaryRows.map(row => (
                <div key={row.label} className="analysis-summary-row">
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          )}

          {breakdown.length > 0 && (
            <>
              <h4>Detection Breakdown</h4>
              <div className="breakdown-grid">
                {breakdown.map(item => (
                  <div key={item.key} className="breakdown-card">
                    <span className="breakdown-label">{item.label}</span>
                    <strong className="breakdown-value">{item.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="investigation-panel">
          {evidenceGroups.map(group => (
            <div key={group.key}>
              <h4>{group.title}</h4>
              <ul>
                {group.items.map((item, index) => <li key={`${group.key}-${index}`}>{item}</li>)}
              </ul>
            </div>
          ))}

          {evidenceSections.map(section => (
            <div key={section.title}>
              <h4>{section.title}</h4>
              {section.content}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="investigation-panel">
          {/* Action bar — always visible in AI tab */}
          <div className="ai-action-bar">
            <div className="ai-action-bar-left">
              <span className="ai-action-label">Report Actions</span>
            </div>
            <div className="ai-action-bar-right">
              {/* Copy */}
              <button
                type="button"
                className={`ai-action-btn ${copied ? 'ai-action-btn-done' : ''}`}
                onClick={copyReport}
              >
                {copied ? '✓ Copied!' : 'Copy Report'}
              </button>
              {/* Export dropdown */}
              <div className="ai-export-wrap" ref={exportRef}>
                <button
                  type="button"
                  className="ai-action-btn ai-action-btn-export"
                  onClick={() => setExportOpen(o => !o)}
                >
                  Export Report <span className="ai-export-chevron">{exportOpen ? '▲' : '▼'}</span>
                </button>
                {exportOpen && (
                  <div className="ai-export-dropdown">
                    {EXPORT_FORMATS.map(f => (
                      <button
                        key={f.key}
                        type="button"
                        className="ai-export-option"
                        onClick={() => exportReport(f.key)}
                      >
                        <span className="ai-export-icon">{f.icon}</span>
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {aiReport ? (
            <div className="ai-report">
              {/* Header */}
              <div className={`ai-report-header ai-report-header-${aiReport.verdict}`}>
                <div className="ai-report-header-left">
                  <span className="ai-source-tag">
                    {aiReport.source === 'ai' ? 'Groq LLM' : aiReport.source === 'rules' ? 'Rule Engine' : 'Rule Engine (fallback)'}
                  </span>
                  <span className={`ai-verdict-badge ai-verdict-badge-${aiReport.verdict}`}>
                    {aiReport.verdict?.toUpperCase()}
                  </span>
                </div>
                <div className="ai-confidence-area">
                  <span>Confidence</span>
                  <div className="ai-confidence-track">
                    <div
                      className="ai-confidence-fill"
                      style={{ width: `${aiReport.confidence || 0}%` }}
                    />
                  </div>
                  <span className="ai-confidence-pct">{aiReport.confidence || 0}%</span>
                </div>
              </div>

              {/* Summary */}
              {aiReport.summary && (
                <div className="ai-summary-box">{aiReport.summary}</div>
              )}

              {/* Reasoning chain */}
              {aiReport.reasoning?.length > 0 && (
                <div className="ai-reasoning-chain">
                  <h4>Investigative Reasoning</h4>
                  {aiReport.reasoning.map((step, i) => (
                    <div key={i} className="ai-reasoning-step">
                      <div className="ai-step-number">{step.step || i + 1}</div>
                      <div className="ai-step-body">
                        <span className={`ai-step-signal ${signalClass(step.signal)}`}>{step.signal}</span>
                        <p className="ai-step-finding">{step.finding}</p>
                        <p className="ai-step-implication">{step.implication}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error note when AI fell back */}
              {aiReport.error && (
                <div className="ai-fallback-note">AI engine offline: {aiReport.error}. Showing rule-based analysis.</div>
              )}
            </div>
          ) : (
            <div className="ai-explanation-box">{result.ai_explanation || 'No AI explanation available for this scan.'}</div>
          )}
        </div>
      )}

      {activeTab === 'technical' && (
        <div className="investigation-panel">
          <h4>Technical Details</h4>
          <div className="technical-grid">
            {computedTechnicalRows.map(row => (
              <div key={row.label} className="technical-row">
                <span className="technical-label">{row.label}</span>
                <strong className="technical-value">{formatValue(row.value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </ResultCard>
  );
}