import { test, expect } from '@playwright/test';

test.describe('Consumer Favorites', () => {
  test('favorites page loads', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('empty state shows Browse Pets button', async ({ page }) => {
    await page.goto('/favorites');
    const browseBtn = page.getByRole('link', { name: /browse pets/i })
      .or(page.getByRole('button', { name: /browse pets/i }));
    if (await browseBtn.isVisible()) {
      await browseBtn.click();
      await expect(page).toHaveURL(/\/search/);
    }
  });
});
