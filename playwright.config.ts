import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Consciousness Class E2E.
 *
 * Strategy:
 * - Tests live in ./e2e (NOT mixed with src/ Vitest unit/integration tests).
 * - The dev server is auto-started by Playwright on port 9003 (matches
 *   `npm run dev`). If it's already running it reuses the instance.
 * - Single browser project (Chromium) until we have a real CI runner —
 *   adding Firefox/WebKit triples runtime without extra signal at this stage.
 * - Retries=0 locally, =1 on CI to absorb flakes from network setup.
 *
 * To run:
 *   npm run test:e2e           # headless
 *   npm run test:e2e:ui        # Playwright UI mode (debug)
 *   npm run test:e2e:headed    # see the browser
 *
 * First time (one-shot): `npx playwright install chromium`
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:9003',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:9003',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
