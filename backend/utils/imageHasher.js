/**
 * imageHasher.js
 * Generates a SHA-256 digital fingerprint for an uploaded file buffer.
 * No disk I/O — works entirely in memory.
 */

const crypto = require('crypto');

/**
 * @param {Buffer} buffer  Raw file buffer (from multer or similar)
 * @param {string} originalName  Original filename for display purposes
 * @returns {{ hash: string, algorithm: string, size_bytes: number, filename: string, created_at: string }}
 */
function hashImage(buffer, originalName) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return {
    hash,
    algorithm:   'SHA-256',
    size_bytes:  buffer.length,
    filename:    originalName || 'unknown',
    created_at:  new Date().toISOString(),
  };
}

module.exports = { hashImage };
