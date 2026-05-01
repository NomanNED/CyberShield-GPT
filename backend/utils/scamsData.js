/**
 * scamsData.js
 * Static dataset of common scam types served by GET /scams.
 * No database needed — extend this array to add more entries.
 */

const scams = [
  // ── Banking Scams ──────────────────────────────────────────────────────────
  {
    id:       1,
    category: 'Banking',
    title:    'Fake Bank Alert SMS',
    description:
      'Victims receive an SMS claiming their bank account has been compromised. A link leads to a spoofed banking login page that steals credentials.',
    warning_signs: [
      'Unexpected SMS from "your bank"',
      'Link uses HTTP or a non-bank domain',
      'Requests PIN or full password',
    ],
    severity: 'High',
  },
  {
    id:       2,
    category: 'Banking',
    title:    'Overpayment Cheque Scam',
    description:
      'Scammer sends a cheque for more than owed and asks the victim to wire back the difference. The original cheque is fraudulent.',
    warning_signs: [
      'Unsolicited cheque for unexpected amount',
      'Request to return excess funds quickly',
      'Pressure to act before cheque clears',
    ],
    severity: 'High',
  },
  // ── Job Scams ─────────────────────────────────────────────────────────────
  {
    id:       3,
    category: 'Job',
    title:    'Work-From-Home Money Mule',
    description:
      'Fake job offers ask victims to receive money transfers and forward them to another account, making them unknowing participants in money laundering.',
    warning_signs: [
      'Job involves processing payments or transfers',
      'Hired without interview',
      'High pay for simple tasks',
    ],
    severity: 'Critical',
  },
  {
    id:       4,
    category: 'Job',
    title:    'Fake Job Offer Fee',
    description:
      'After a victim applies for a job, they are asked to pay a "processing" or "training" fee upfront. The job does not exist.',
    warning_signs: [
      'Upfront payment required to start',
      'Vague company details',
      'Unrealistically high salary promised',
    ],
    severity: 'Medium',
  },
  // ── Email Phishing ────────────────────────────────────────────────────────
  {
    id:       5,
    category: 'Email Phishing',
    title:    'Account Verification Phishing',
    description:
      'Email impersonates Google, Microsoft, or a bank and claims the account will be closed unless the user "verifies" their credentials via a spoofed link.',
    warning_signs: [
      'Urgent language: "Act now or lose access"',
      'Link does not match official domain',
      'Generic greeting like "Dear User"',
    ],
    severity: 'High',
  },
  {
    id:       6,
    category: 'Email Phishing',
    title:    'CEO / Business Email Compromise',
    description:
      'Attacker spoofs a company executive\'s email and asks an employee to urgently transfer funds or share sensitive data.',
    warning_signs: [
      'Email from a slightly different domain (e.g. company-inc.com vs company.com)',
      'Unusual financial or data request',
      'Marked urgent / confidential',
    ],
    severity: 'Critical',
  },
  // ── Social Media Scams ────────────────────────────────────────────────────
  {
    id:       7,
    category: 'Social Media',
    title:    'Fake Giveaway / Prize Scam',
    description:
      'Posts claim the victim has won a prize, asking them to click a link, pay a "shipping fee", or provide personal details to claim the reward.',
    warning_signs: [
      'Unsolicited prize notification',
      'Request for personal info or payment',
      'Impersonates a celebrity or brand',
    ],
    severity: 'Medium',
  },
  {
    id:       8,
    category: 'Social Media',
    title:    'Romance Scam',
    description:
      'Fraudster builds a fake romantic relationship online, then asks for money under the guise of an emergency (medical, travel, etc.).',
    warning_signs: [
      'Never meets in person or video calls',
      'Escalates affection quickly',
      'Requests money or gift cards',
    ],
    severity: 'High',
  },
  // ── Tech Support ─────────────────────────────────────────────────────────
  {
    id:       9,
    category: 'Tech Support',
    title:    'Fake Virus Alert Pop-up',
    description:
      'A browser pop-up claims the computer is infected and provides a phone number for "Microsoft" or "Apple" support who then charge for fake repairs.',
    warning_signs: [
      'Pop-up cannot be closed',
      'Warning uses official logos',
      'Phone number request',
    ],
    severity: 'Medium',
  },
  {
    id:       10,
    category: 'Tech Support',
    title:    'Remote Access Scam',
    description:
      'Caller claims to be from a tech company and asks the victim to install remote-access software, then steals banking credentials or demands payment.',
    warning_signs: [
      'Unsolicited call about your computer',
      'Request to install software (AnyDesk, TeamViewer)',
      'Requests to open banking site while sharing screen',
    ],
    severity: 'Critical',
  },
];

module.exports = { scams };
