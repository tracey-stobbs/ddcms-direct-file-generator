/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    typecheck: {
      enabled: false // Disable typecheck to avoid import issues during testing
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.d.ts',
        'tests/',
        'coverage/',
        'vite.config.ts',
        'vitest.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      // Allow importing .ts files as .js for ES modules in tests
      '@': '/src'
    }
  },
  esbuild: {
    target: 'node18'
  }
});
