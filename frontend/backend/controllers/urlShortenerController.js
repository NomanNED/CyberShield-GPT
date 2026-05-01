/**
 * urlShortenerController.js — Secure URL shortener
 */
const { shortenUrl, resolveCode } = require('../utils/urlShortener');

async function shortenHandler(req, res) {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim())
    return res.status(400).json({ error: 'Provide a non-empty "url" field.' });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await shortenUrl(url.trim(), baseUrl);
  return res.json(result);
}

/** Redirect endpoint — GET /s/:code */
function redirectHandler(req, res) {
  const { code } = req.params;
  const original = resolveCode(code);
  if (!original)
    return res.status(404).json({ error: 'Short URL not found or has expired.' });
  return res.redirect(302, original);
}

module.exports = { shortenHandler, redirectHandler };
