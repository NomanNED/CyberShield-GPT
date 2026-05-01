const { Router } = require('express');
const { analyzeHandler } = require('../controllers/analyzeController');
const router = Router();

router.post('/', analyzeHandler);

module.exports = router;
