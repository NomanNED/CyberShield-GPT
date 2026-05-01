/**
 * imageHashController.js — Image fingerprinting via SHA-256
 */
const { hashImage } = require('../utils/imageHasher');

function imageHashHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Send a file under the "image" field.' });
  }

  // multer stores the file buffer in req.file.buffer
  const result = hashImage(req.file.buffer, req.file.originalname);
  return res.json({
    message: 'Digital fingerprint created successfully',
    ...result,
  });
}

module.exports = { imageHashHandler };
