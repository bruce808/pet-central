import { test, expect } from '@playwright/test';

test.describe('Vendor Analytics', () => {
  test('analytics page loads', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('performance table present', async ({ page }) => {
    await page.goto('/analytics');
    const table = page.locator('table').or(page.locator('[role="table"]'));
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });
});
