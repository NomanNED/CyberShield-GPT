const { Router } = require('express');
const multer = require('multer');
const { shortenHandler, redirectHandler } = require('../controllers/urlShortenerController');
const router = Router();

router.post('/', shortenHandler);

module.exports = router;
module.exports.redirectHandler = redirectHandler;
