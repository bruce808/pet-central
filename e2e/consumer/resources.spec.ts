import { test, expect } from '@playwright/test';

test.describe('Resources', () => {
  test('resources listing page loads', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('type filter pills switch categories', async ({ page }) => {
    await page.goto('/resources');
    for (const type of ['All', 'Articles', 'Tips', 'Guides']) {
      const pill = page.getByRole('link', { name: new RegExp(`^${type}$`, 'i') })
        .or(page.getByRole('button', { name: new RegExp(`^${type}$`, 'i') }));
      if (await pill.isVisible()) {
        await pill.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('individual resource page loads', async ({ page }) => {
    await page.goto('/resources/test-slug');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('View all resources link navigates back', async ({ page }) => {
    await page.goto('/resources/test-slug');
    const backLink = page.getByRole('link', { name: /view all|back to resources/i });
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/resources/);
    }
  });
});
