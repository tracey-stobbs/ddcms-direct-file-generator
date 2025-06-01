import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
    include: ['src/**/*.test.ts'],
    alias: {
      '@controllers': resolve(__dirname, 'src/controllers'),
      '@factories': resolve(__dirname, 'src/factories'),
      '@models': resolve(__dirname, 'src/models'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@validators': resolve(__dirname, 'src/validators'),
    },
  },
});
