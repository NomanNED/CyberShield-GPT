require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const analyzeRouter     = require('./routes/analyze');
const fakeSiteRouter    = require('./routes/fakeSite');
const emailRouter       = require('./routes/email');
const passwordRouter    = require('./routes/password');
const urlShortenerRoute = require('./routes/urlShortener');
const imageHashRouter   = require('./routes/imageHash');
const scamsRouter       = require('./routes/scams');
const settingsRouter    = require('./routes/settings');
const { redirectHandler } = require('./routes/urlShortener');
const { getHistory, getStats } = require('./scanHistory');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/analyze',          analyzeRouter);
app.use('/detect-fake-site', fakeSiteRouter);
app.use('/analyze-email',    emailRouter);
app.use('/check-password',   passwordRouter);
app.use('/shorten-url',      urlShortenerRoute);
app.use('/image-hash',       imageHashRouter);
app.use('/scams',            scamsRouter);
app.use('/settings',         settingsRouter);

// Short-URL redirect — GET /s/:code
app.get('/s/:code', redirectHandler);

// API home route so opening backend URL in a browser is informative
app.get('/', (_req, res) => {
  res.json({
    service: 'CyberGuard API',
    status: 'running',
    version: '2.0',
    endpoints: [
      'POST /analyze',
      'POST /detect-fake-site',
      'POST /analyze-email',
      'POST /check-password',
      'POST /shorten-url',
      'POST /image-hash',
      'GET /scams',
      'GET /health',
      'GET /s/:code',
    ],
  });
});

// Scan history feed — GET /scan-history?limit=N
app.get('/scan-history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  res.json({
    stats: getStats(),
    scans: getHistory(limit),
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CyberGuard API', version: '2.0' });
});

// ── Global error handler ────────────────────────────────────────────────────
// Catches multer file-type errors and any other unhandled errors
app.use((err, _req, res, _next) => {
  console.error('[CyberGuard Error]', err.message);
  const status = err.status || 400;
  res.status(status).json({ error: err.message || 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`CyberGuard backend running on http://localhost:${PORT}`);
});
