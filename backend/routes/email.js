const { Router } = require('express');
const { emailHandler } = require('../controllers/emailController');
const router = Router();

router.post('/', emailHandler);

module.exports = router;
