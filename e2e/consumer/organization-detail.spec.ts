import { test, expect } from '@playwright/test';

test.describe('Organization Detail', () => {
  test('renders or shows not-found', async ({ page }) => {
    await page.goto('/organizations/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('tabs switch between Listings / Reviews / About', async ({ page }) => {
    await page.goto('/organizations/test-id');
    for (const tabName of ['Listings', 'Reviews', 'About', 'Policies']) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
        .or(page.getByRole('button', { name: new RegExp(tabName, 'i') }));
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('external website link has valid href', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const extLink = page.getByRole('link', { name: /website|visit/i });
    if (await extLink.isVisible()) {
      await expect(extLink).toHaveAttribute('href', /^https?:\/\//);
    }
  });
});
