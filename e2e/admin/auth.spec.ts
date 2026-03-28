import { test, expect } from '@playwright/test';

test.describe('Admin Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByPlaceholder('admin@petcentral.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('admin@petcentral.com').fill('admin@petcentral.com');
    await page.getByPlaceholder('••••••••').fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
