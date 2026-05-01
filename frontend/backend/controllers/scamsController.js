/**
 * scamsController.js — Scam awareness dataset
 */
const { scams } = require('../utils/scamsData');

function scamsHandler(req, res) {
  const { category } = req.query;

  if (category) {
    const filtered = scams.filter(
      s => s.category.toLowerCase() === category.toLowerCase()
    );
    return res.json({ total: filtered.length, scams: filtered });
  }

  // Group by category for convenience
  const grouped = scams.reduce((acc, scam) => {
    if (!acc[scam.category]) acc[scam.category] = [];
    acc[scam.category].push(scam);
    return acc;
  }, {});

  return res.json({ total: scams.length, grouped, scams });
}

module.exports = { scamsHandler };
