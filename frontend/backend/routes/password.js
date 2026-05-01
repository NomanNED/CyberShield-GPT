const { Router } = require('express');
const { passwordHandler } = require('../controllers/passwordController');
const router = Router();

router.post('/', passwordHandler);

module.exports = router;
