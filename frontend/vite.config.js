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
      // In dev, /api/* is stripped and forwarded to the local backend on :5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
