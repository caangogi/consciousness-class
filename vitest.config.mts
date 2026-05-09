import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'e2e/**',
      '**/*.e2e.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/backend/**/*.ts',
        'src/lib/**/*.ts',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/dto/**',
        '**/*.d.ts',
      ],
      thresholds: {
        // Soft global threshold; per-module rigor is enforced by review.
        // TDD-strict directories must hit 90%+ in their own module coverage.
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
