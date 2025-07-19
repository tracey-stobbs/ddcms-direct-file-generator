/// <reference types="vite/client" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    lib: {
      entry: './src/app.ts',
      name: 'DDCMSDirectFileCreator',
      fileName: 'app',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'express',
        'luxon',
        '@faker-js/faker',
        'zod',
        'fs',
        'path',
        'crypto'
      ]
    },
    sourcemap: true,
    minify: false
  },
  server: {
    port: 3001
  }
});
