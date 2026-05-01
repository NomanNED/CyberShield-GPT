# 🛡️ CyberGuard

A multi-tool cybersecurity analysis platform. Seven independent tools running under one roof — all rule-based, no external APIs, no database.

## Project Structure

```
hackathon/
├── backend/
│   ├── server.js               ← Express entry point
│   ├── routes/                 ← One router per feature
│   │   ├── analyze.js
│   │   ├── fakeSite.js
│   │   ├── email.js
│   │   ├── password.js
│   │   ├── urlShortener.js
│   │   ├── imageHash.js
│   │   └── scams.js
│   ├── controllers/            ← Request/response handling
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
        ├── App.jsx             ← Router shell
        ├── components/         ← Sidebar, ResultCard, RiskBar
        └── pages/              ← One component per tool
```

---

## Quick Start

### 1 — Start the Backend

```bash
cd backend
npm install
npm start
```

Server starts at **http://localhost:5000**

### 2 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

UI starts at **http://localhost:3000**

---

## Tools

| Tool | Route | Endpoint |
|------|-------|----------|
| Phishing Analyzer | `/` | `POST /analyze` |
| Fake Website Detector | `/fake-site` | `POST /detect-fake-site` |
| Email Security Analyzer | `/email` | `POST /analyze-email` |
| Password Strength Checker | `/password` | `POST /check-password` |
| Secure URL Shortener | `/shorten` | `POST /shorten-url` |
| Copyright Protection | `/copyright` | `POST /image-hash` |
| Scam Dashboard | `/scams` | `GET /scams` |

---

## API Reference

### `POST /analyze`
```json
{ "text": "URGENT verify your password at http://paypa1.com" }
→ { "risk_score": 70, "is_phishing": true, "reasons": [...] }
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
{ "url": "https://github.com/cyberguard/docs" }
→ { "shortened": true, "short_url": "http://localhost:5000/s/AbCd12", "analysis": {...} }
```

### `POST /image-hash`
Multipart form upload, field name: `image`
```json
→ { "hash": "<sha256>", "algorithm": "SHA-256", "size_bytes": 42310, "filename": "photo.jpg", ... }
```

### `GET /scams`
```json
→ { "total": 10, "grouped": { "Banking": [...], "Job": [...], ... }, "scams": [...] }
```

