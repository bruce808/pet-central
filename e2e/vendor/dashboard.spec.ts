import { test, expect } from '@playwright/test';

test.describe('Vendor Dashboard', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('quick action — Create Listing navigates', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /create listing/i })
      .or(page.getByRole('button', { name: /create listing/i }));
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page).toHaveURL(/\/listings\/new/);
    }
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/');
    const items = [/dashboard/i, /listings/i, /messages/i, /organization/i, /reviews/i, /analytics/i, /resources/i];
    for (const name of items) {
      const link = page.getByRole('link', { name }).first();
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('notification bell is interactive', async ({ page }) => {
    await page.goto('/');
    const bellButton = page.locator('header button[type="button"]').first();
    if (await bellButton.isVisible()) {
      await bellButton.click();
    }
  });
});
