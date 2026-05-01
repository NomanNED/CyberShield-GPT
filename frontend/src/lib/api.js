/**
 * api.js
 * Tiny helper so every fetch() call uses the correct base URL.
 *
 * Development: VITE_BACKEND_URL is not set → '' → relative URLs hit Vite proxy → localhost:5000
 * Production:  VITE_BACKEND_URL = https://your-backend.railway.app → prefixed to every call
 */
const BASE = import.meta.env.VITE_BACKEND_URL ?? '';

export const apiUrl = (path) => `${BASE}${path}`;
