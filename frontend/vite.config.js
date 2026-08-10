import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com', 'localhost', 'frontend'],
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  preview: {
    allowedHosts: ['.trycloudflare.com', 'localhost', 'frontend']
  }
});
