import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ThemeEngine',
      fileName: () => 'theme-engine.iife.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
