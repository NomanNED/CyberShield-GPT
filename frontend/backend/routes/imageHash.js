const { Router } = require('express');
const multer  = require('multer');
const { imageHashHandler } = require('../controllers/imageHashController');

// Store file in memory — no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    // Only allow image MIME types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted.'));
    }
  },
});

const router = Router();

router.post('/', upload.single('image'), imageHashHandler);

module.exports = router;
