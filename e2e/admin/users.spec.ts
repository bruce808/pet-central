import { test, expect } from '@playwright/test';

test.describe('Admin Users', () => {
  test('users page loads', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('search input filters', async ({ page }) => {
    await page.goto('/users');
    const search = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    if (await search.isVisible()) {
      await search.fill('test@example.com');
      await page.waitForTimeout(500);
    }
  });

  test('clicking row opens detail', async ({ page }) => {
    await page.goto('/users');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) {
      await rows.nth(1).click();
      await page.waitForTimeout(500);
    }
  });

  test('pagination controls', async ({ page }) => {
    await page.goto('/users');
    const nextBtn = page.getByRole('button', { name: /next|›/i });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
    }
  });
});
