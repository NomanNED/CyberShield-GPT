# CyberShield GPT

**Generative AI Powered Cyber Threat Detection & Automated Response System**

A full-stack cybersecurity analysis platform combining rule-based heuristics with Groq AI inference. Eight independent investigation tools run under one roof, backed by a multi-layer detection engine and surfaced through a hacking-themed SPA.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, plain CSS |
| Backend | Node.js, Express 4 |
| AI Engine | Groq API (LLaMA 3 70B) via `aiService.js` |
| Web Scraping | Puppeteer 24 (`scraperService.js`) |
| File Uploads | Multer |
| Auth / DB | None (in-memory scan history; Firebase planned) |

---

## Project Structure

```
hackathon/
├── backend/
│   ├── server.js               ← Express entry point (port 5000)
│   ├── .env                    ← GROQ_API_KEY (git-ignored)
│   ├── scanHistory.js          ← In-memory scan log store
│   ├── settingsStore.js        ← Persisted app settings
│   ├── routes/                 ← One router per feature
│   │   ├── analyze.js
│   │   ├── fakeSite.js
│   │   ├── email.js
│   │   ├── password.js
│   │   ├── urlShortener.js
│   │   ├── imageHash.js
│   │   ├── scams.js
│   │   └── settings.js
│   ├── controllers/            ← Request/response handling
│   │   ├── analyzeController.js
│   │   ├── fakeSiteController.js
│   │   ├── emailController.js
│   │   ├── passwordController.js
│   │   ├── urlShortenerController.js
│   │   ├── imageHashController.js
│   │   └── scamsController.js
│   ├── engine/                 ← Multi-layer detection engine
│   │   ├── detectionEngine.js  ← Orchestrates all layers
│   │   ├── domainLayer.js      ← Typosquatting, TLD, brand checks
│   │   ├── contentLayer.js     ← Urgency phrases, suspicious keywords
│   │   ├── behaviorLayer.js    ← Login forms, redirects, mismatches
│   │   └── scoringEngine.js    ← Weighted score aggregation
│   ├── services/
│   │   ├── aiService.js        ← Groq API calls + fallback reports
│   │   └── scraperService.js   ← Puppeteer live-page scraping
│   └── utils/                  ← Pure business logic (fully testable)
│       ├── phishingAnalyzer.js
│       ├── fakeSiteDetector.js
│       ├── emailAnalyzer.js
│       ├── passwordChecker.js
│       ├── urlShortener.js
│       ├── imageHasher.js
│       └── scamsData.js
└── frontend/
    └── src/
        ├── App.jsx             ← Router shell + landing/app layout split
        ├── App.css             ← All styles (single file, ~3 000 lines)
        ├── components/
        │   ├── Sidebar.jsx     ← Collapsible nav with section groups
        │   ├── CommandPalette.jsx ← Ctrl+K fuzzy launcher
        │   ├── AnalysisResult.jsx ← Tabbed result viewer + export
        │   ├── ResultCard.jsx  ← Risk score card
        │   └── RiskBar.jsx     ← Animated score bar
        └── pages/
            ├── LandingPage.jsx     ← Public homepage (route /)
            ├── HomeDashboard.jsx   ← App command center (/dashboard)
            ├── PhishingAnalyzer.jsx
            ├── FakeWebsiteDetector.jsx
            ├── EmailAnalyzer.jsx
            ├── PasswordChecker.jsx
            ├── UrlShortener.jsx
            ├── CopyrightTool.jsx
            ├── ScamDashboard.jsx
            ├── History.jsx         ← Scan history log
            └── Settings.jsx        ← API key + preferences
```

---

## Quick Start

### 1 — Configure Environment

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

### 2 — Start the Backend

```bash
cd backend
npm install
npm start
```

Server starts at **http://localhost:5000**

### 3 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

UI starts at **http://localhost:3000**

---

## Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPage` | Public homepage — no sidebar |
| `/dashboard` | `HomeDashboard` | Command center overview |
| `/analyze` | `PhishingAnalyzer` | Phishing text/URL analysis |
| `/fake-site` | `FakeWebsiteDetector` | Fake website detection |
| `/email` | `EmailAnalyzer` | Email header & body analysis |
| `/password` | `PasswordChecker` | Password strength review |
| `/shorten` | `UrlShortener` | Secure URL shortener |
| `/copyright` | `CopyrightTool` | Image hash / copyright check |
| `/scams` | `ScamDashboard` | Scam pattern library |
| `/history` | `History` | Scan history log |
| `/settings` | `Settings` | API key & app preferences |

---

## Tools

| # | Tool | Route | Backend Endpoint |
|---|------|-------|-----------------|
| 1 | Phishing Analyzer | `/analyze` | `POST /analyze` |
| 2 | Fake Website Detector | `/fake-site` | `POST /detect-fake-site` |
| 3 | Email Security Analyzer | `/email` | `POST /analyze-email` |
| 4 | Password Strength Checker | `/password` | `POST /check-password` |
| 5 | Secure URL Shortener | `/shorten` | `POST /shorten-url` |
| 6 | Copyright Protection | `/copyright` | `POST /image-hash` |
| 7 | Scam Dashboard | `/scams` | `GET /scams` |
| 8 | Scan History | `/history` | `GET /scan-history` |

---

## Detection Engine

The phishing and fake-site analyzers run a four-layer pipeline before optionally calling Groq AI:

1. **Domain Layer** — typosquatting distance, suspicious TLDs, brand keyword detection, subdomain abuse
2. **Content Layer** — urgency phrases, threat keywords, suspicious link patterns, exclamation density
3. **Behavior Layer** — login form presence, URL/title mismatch, redirect chains (via Puppeteer)
4. **Scoring Engine** — weighted aggregation → `risk_score` 0–100, `threat_level` LOW / MEDIUM / HIGH / CRITICAL

Groq AI (LLaMA 3 70B) then receives the rule findings and generates a structured chain-of-thought report. If the API is unavailable, `aiService.js` builds a rule-based fallback report automatically so the AI tab always shows meaningful content.

---

## API Reference

### `POST /analyze`
```json
{ "text": "URGENT verify your password at http://paypa1.com" }
→ { "risk_score": 70, "is_phishing": true, "threat_level": "HIGH", "reasons": [...], "ai_report": {...} }
```

### `POST /detect-fake-site`
```json
{ "url": "http://faceb00k-login.xyz" }
→ { "is_fake": true, "risk_score": 55, "spoofOf": "facebook.com", "domain": "faceb00k-login.xyz", "reasons": [...] }
```

### `POST /analyze-email`
```json
{ "text": "<full email body>" }
→ { "risk_score": 81, "threat_level": "HIGH", "reasons": [...], "suspicious_phrases": [...], "links_found": [...] }
```

### `POST /check-password`
```json
{ "password": "Test@1234secure!" }
→ { "strength": "Strong", "score": 85, "suggestions": [], "checks": {...} }
```

### `POST /shorten-url`
```json
{ "url": "https://example.com/very/long/path" }
→ { "shortened": true, "short_url": "http://localhost:5000/s/AbCd12", "analysis": {...} }
```

### `POST /image-hash`
Multipart form upload, field name: `image`
```json
→ { "hash": "<sha256>", "algorithm": "SHA-256", "size_bytes": 42310, "filename": "photo.jpg" }
```

### `GET /scams`
```json
→ { "total": 10, "grouped": { "Banking": [...], "Job": [...] }, "scams": [...] }
```

### `GET /scan-history`
```json
→ [ { "id": "uuid", "tool": "phishing", "timestamp": "...", "risk_score": 70, "verdict": true } ]
```

### `GET /settings` / `POST /settings`
```json
// GET → { "groqApiKey": "...", "theme": "dark", ... }
// POST { "groqApiKey": "new_key" } → { "success": true }
```

---

## Frontend Features

- **Landing Page** — hacking-themed public homepage with animated terminal mockup, scroll-reveal feature rows, about section, hover-reveal navbar, and footer
- **Command Palette** — `Ctrl+K` fuzzy launcher for instant navigation across all tools
- **Analysis Result Viewer** — tabbed panel (Overview / AI Report / Raw JSON) with clipboard copy, Markdown export, and HTML report export
- **Scan History** — timestamped log of every analysis run in the session
- **Settings Page** — configure Groq API key and application preferences
- **Responsive Sidebar** — collapsible with section groups: Overview, Investigations, Utilities, Intelligence, System

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq Cloud API key for LLaMA 3 inference |

---

## Repository

**GitHub:** https://github.com/NomanNED/CyberShield-GPT

