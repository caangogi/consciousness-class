/**
 * F1.7 · Smoke E2E.
 *
 * Goal: prove that Playwright is wired correctly AND that the production
 * critical paths render without 5xx. NOT a behavioral test — those will
 * land per-feature in fases 5/6 once we have seedable test data for
 * Firebase + Stripe test mode.
 *
 * Today's contract:
 *   - Public home page loads and renders the "Consciousness Class" brand
 *   - Public storefront /products responds (catalog page works)
 *   - /courses redirects to /products (legacy URL preserved per next.config)
 *
 * If any of these fails, something is fundamentally broken in the
 * Next.js App Router setup, the catalog API path, or the redirect rules.
 */
import { test, expect } from '@playwright/test';

test.describe('@smoke', () => {
  test('home page loads and shows the brand', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status(), 'home page must respond 2xx').toBeLessThan(400);

    // Brand is in the document somewhere — header, hero, footer, title.
    // We don't pin it to a specific selector to avoid coupling the test to
    // a UI tweak; the brand string is the contract.
    await expect(page).toHaveTitle(/Consciousness Class/i);
  });

  test('storefront /products responds', async ({ page }) => {
    const response = await page.goto('/products');
    expect(response?.status(), '/products must respond 2xx').toBeLessThan(400);
  });

  test('legacy /courses 301-redirects to /products', async ({ page }) => {
    await page.goto('/courses');
    // Wait for the redirect to settle.
    await page.waitForURL(/\/products(\/|$|\?)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/products(\/|$|\?)/);
  });
});
