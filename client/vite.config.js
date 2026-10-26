import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.LAMBA_API || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  // Absolute paths: the web server, the Electron app (http://127.0.0.1) and the
  // Android app (https://localhost) all serve the app from the site root.
  base: '/',
  server: {
    port: 5173,
    // The local (in-app) API imports the catalog and seed data from ../server/src.
    fs: { allow: ['..'] },
    proxy: {
      '/api': API,
      '/samples': API
    }
  }
});
