import { test, expect } from '@playwright/test';

test.describe('Partner Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByPlaceholder('you@partner-org.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('you@partner-org.com').fill('partner@petcentral.com');
    await page.getByPlaceholder('Enter your password').fill('PartnerPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
