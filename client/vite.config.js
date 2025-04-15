// client/vite.config.js

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // Or react from '@vitejs/plugin-react' if using React
import path from 'path';

export default defineConfig({
  plugins: [vue()], // Replace with [react()] if React
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
