/**
 * api/index.js
 * Vercel serverless entry-point — re-exports the Express app from /backend.
 * Vercel will wrap this with its serverless adapter automatically.
 */
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const analyzeRouter     = require('../backend/routes/analyze');
const fakeSiteRouter    = require('../backend/routes/fakeSite');
const emailRouter       = require('../backend/routes/email');
const passwordRouter    = require('../backend/routes/password');
const urlShortenerRoute = require('../backend/routes/urlShortener');
const imageHashRouter   = require('../backend/routes/imageHash');
const scamsRouter       = require('../backend/routes/scams');
const settingsRouter    = require('../backend/routes/settings');
const { redirectHandler } = require('../backend/routes/urlShortener');
const { getHistory, getStats } = require('../backend/scanHistory');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/analyze',          analyzeRouter);
app.use('/api/detect-fake-site', fakeSiteRouter);
app.use('/api/analyze-email',    emailRouter);
app.use('/api/check-password',   passwordRouter);
app.use('/api/shorten-url',      urlShortenerRoute);
app.use('/api/image-hash',       imageHashRouter);
app.use('/api/scams',            scamsRouter);
app.use('/api/settings',         settingsRouter);

app.get('/api/s/:code', redirectHandler);

app.get('/api/scan-history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  res.json({ stats: getStats(), scans: getHistory(limit) });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CyberGuard API', version: '2.0' });
});

app.use((err, _req, res, _next) => {
  console.error('[CyberGuard Error]', err.message);
  res.status(err.status || 400).json({ error: err.message || 'Unexpected server error' });
});

module.exports = app;
