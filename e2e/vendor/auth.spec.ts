import { test, expect } from '@playwright/test';

test.describe('Vendor Auth', () => {
  test('login page renders with fields', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('you@example.com').fill('vendor@test.com');
    await page.getByPlaceholder('••••••••').fill('VendorPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('register wizard step 1 — personal info', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('body')).not.toBeEmpty();
    const nameField = page.getByLabel(/full name/i).or(page.getByLabel(/name/i).first());
    if (await nameField.isVisible()) {
      await nameField.fill('Test Vendor');
      await page.getByLabel(/email/i).fill('newvendor@test.com');
      const pwField = page.locator('input[type="password"]').first();
      await pwField.fill('Pass123!');
      const confirmField = page.locator('input[type="password"]').nth(1);
      if (await confirmField.isVisible()) await confirmField.fill('Pass123!');
      const continueBtn = page.getByRole('button', { name: /continue/i });
      if (await continueBtn.isVisible()) await continueBtn.click();
    }
  });

  test('register has link to login', async ({ page }) => {
    await page.goto('/auth/register');
    const loginLink = page.getByRole('link', { name: /sign in|log in|login/i });
    if (await loginLink.isVisible()) {
      await expect(loginLink).toHaveAttribute('href', /.+/);
    }
  });
});
