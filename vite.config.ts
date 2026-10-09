import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isHttps = process.env.APP_URL?.startsWith('https:') || !!process.env.K_SERVICE;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: true as const,
      ws: {
        protocol: isHttps ? 'wss' : undefined,
        clientPort: isHttps ? 443 : undefined,
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
