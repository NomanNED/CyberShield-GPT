/**
 * api.js
 * Tiny helper so every fetch() call uses the correct base URL.
 *
 * Development: VITE_BACKEND_URL not set → '' → Vite proxies /api/* to localhost:5000
 * Production (Vercel): VITE_BACKEND_URL=/api → calls go to /api/* on same domain
 */
const BASE = import.meta.env.VITE_BACKEND_URL ?? '';

export const apiUrl = (path) => `${BASE}${path}`;
