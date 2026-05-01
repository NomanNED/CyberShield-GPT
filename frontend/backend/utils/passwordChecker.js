/**
 * passwordChecker.js
 * Rates password strength and provides actionable suggestions.
 */

/**
 * @param {string} password
 * @returns {{ strength: string, score: number, suggestions: string[], checks: object }}
 */
function checkPassword(password) {
  const suggestions = [];
  let   score       = 0;

  const checks = {
    length12:    password.length >= 12,
    length8:     password.length >= 8,
    uppercase:   /[A-Z]/.test(password),
    lowercase:   /[a-z]/.test(password),
    numbers:     /[0-9]/.test(password),
    symbols:     /[^A-Za-z0-9]/.test(password),
    noCommon:    !isCommonPassword(password),
    noRepeating: !/(.)\1{2,}/.test(password), // no 3+ repeated chars
  };

  // Score each criterion
  if (checks.length12)    score += 25; else if (checks.length8) score += 10;
  if (checks.uppercase)   score += 15;
  if (checks.lowercase)   score += 10;
  if (checks.numbers)     score += 15;
  if (checks.symbols)     score += 20;
  if (checks.noCommon)    score += 10;
  if (checks.noRepeating) score += 5;

  score = Math.min(score, 100);

  // Generate suggestions for failing checks
  if (!checks.length8)     suggestions.push('Use at least 8 characters');
  if (!checks.length12)    suggestions.push('Use at least 12 characters for a stronger password');
  if (!checks.uppercase)   suggestions.push('Add uppercase letters (A–Z)');
  if (!checks.lowercase)   suggestions.push('Add lowercase letters (a–z)');
  if (!checks.numbers)     suggestions.push('Add numbers (0–9)');
  if (!checks.symbols)     suggestions.push('Add symbols (!, @, #, $, …)');
  if (!checks.noCommon)    suggestions.push('Avoid common passwords like "password123"');
  if (!checks.noRepeating) suggestions.push('Avoid repeating characters (e.g. "aaa")');

  const strength =
    score >= 75 ? 'Strong'
    : score >= 45 ? 'Medium'
    : 'Weak';

  return { strength, score, suggestions, checks };
}

// Minimal list of commonly used weak passwords
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678',
  '123456789', 'qwerty', 'abc123', 'letmein', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'hello',
  'iloveyou', 'admin', 'passw0rd', '1q2w3e', 'sunshine',
]);

function isCommonPassword(password) {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

module.exports = { checkPassword };
