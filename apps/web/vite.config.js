import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLE=1 keeps the one-file demo available; BASE is overridden by Pages in CI.
// The single-file plugin inlines dynamic imports, which Rollup cannot combine with manualChunks.
const single = !!process.env.SINGLE;

export default defineConfig({
  base: process.env.BASE || './',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: single ? {} : {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
