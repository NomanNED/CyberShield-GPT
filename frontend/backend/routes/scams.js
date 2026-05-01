const { Router } = require('express');
const { scamsHandler } = require('../controllers/scamsController');
const router = Router();

router.get('/', scamsHandler);

module.exports = router;
