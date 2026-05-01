import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',   // bind to all interfaces (fixes IPv4/IPv6 mismatch on Windows)
    // Proxy API calls to the backend during development so the browser
    // never touches cross-origin requests.
    proxy: {
      '/analyze':          { target: 'http://localhost:5000', changeOrigin: true },
      '/detect-fake-site': { target: 'http://localhost:5000', changeOrigin: true },
      '/analyze-email':    { target: 'http://localhost:5000', changeOrigin: true },
      '/check-password':   { target: 'http://localhost:5000', changeOrigin: true },
      '/shorten-url':      { target: 'http://localhost:5000', changeOrigin: true },
      '/image-hash':       { target: 'http://localhost:5000', changeOrigin: true },
      '/scams':            { target: 'http://localhost:5000', changeOrigin: true },
      '/health':           { target: 'http://localhost:5000', changeOrigin: true },
      '/scan-history':    { target: 'http://localhost:5000', changeOrigin: true },
      '/api/settings':    { target: 'http://localhost:5000', rewrite: (path) => path.replace(/^\/api/, ''), changeOrigin: true },
    },
  },
});
