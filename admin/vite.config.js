import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,   // allow Docker/LAN access
    proxy: {
      '/api': {
        target:       process.env.VITE_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target:       process.env.VITE_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
