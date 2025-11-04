import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [react()],
  resolve: {
    alias: {
      crypto: path.resolve(__dirname, 'src/polyfills/crypto.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
