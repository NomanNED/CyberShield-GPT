/**
 * routes/settings.js — GET and POST /settings
 */
const { Router } = require('express');
const store = require('../settingsStore');
const { clearHistory } = require('../scanHistory');

const router = Router();

// GET /settings — return current settings (key is masked)
router.get('/', (_req, res) => {
  res.json(store.getPublic());
});

// POST /settings — update one or more settings
router.post('/', (req, res) => {
  const patch = req.body;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return res.status(400).json({ error: 'Send a JSON object of settings to update.' });
  }

  // Validate groqApiKey if provided
  if ('groqApiKey' in patch) {
    if (typeof patch.groqApiKey !== 'string') {
      return res.status(400).json({ error: 'groqApiKey must be a string.' });
    }
    if (patch.groqApiKey.length > 200) {
      return res.status(400).json({ error: 'groqApiKey too long.' });
    }
  }

  const updated = store.update(patch);
  const { groqApiKey: _hidden, ...rest } = updated;

  res.json({
    ok: true,
    settings: store.getPublic(),
  });
});

// POST /settings/clear-cache — wipe scan history
router.post('/clear-history', (_req, res) => {
  clearHistory();
  res.json({ ok: true, message: 'Scan history cleared.' });
});

module.exports = router;
