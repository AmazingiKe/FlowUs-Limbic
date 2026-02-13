import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/mocks/**'
      ]
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/']
  },
  resolve: {
    alias: {
      '@flowus-limbic/shared-types': path.resolve(__dirname, './packages/shared-types/src')
    }
  }
});
