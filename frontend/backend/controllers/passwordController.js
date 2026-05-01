/**
 * passwordController.js — Password strength checker
 */
const { checkPassword } = require('../utils/passwordChecker');

function passwordHandler(req, res) {
  const { password } = req.body;
  if (!password || typeof password !== 'string')
    return res.status(400).json({ error: 'Provide a "password" field.' });
  // Do NOT log passwords — keep security-conscious
  return res.json(checkPassword(password));
}

module.exports = { passwordHandler };
