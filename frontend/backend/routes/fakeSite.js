const { Router } = require('express');
const { fakeSiteHandler } = require('../controllers/fakeSiteController');
const router = Router();

router.post('/', fakeSiteHandler);

module.exports = router;
