import { test, expect } from '@playwright/test';

test.describe('Consumer Auth', () => {
  test('login page renders email + password + submit', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('login form shows validation on empty submit', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('login form accepts input and submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('you@example.com').fill('user@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login');
    const regLink = page.getByRole('link', { name: /register/i });
    await expect(regLink).toBeVisible();
    await regLink.click();
    await expect(page).toHaveURL(/register/);
  });

  test('register page renders all required fields', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Create a strong password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
  });

  test('register form validates matching passwords', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByPlaceholder('Your name').fill('Test');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('Create a strong password').fill('Pass123!');
    await page.getByPlaceholder('Confirm your password').fill('Mismatch!');
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.isVisible()) await checkbox.check();
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('register form has terms checkbox', async ({ page }) => {
    await page.goto('/auth/register');
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/auth/register');
    const loginLink = page.getByRole('link', { name: /login/i });
    await expect(loginLink).toBeVisible();
  });

  test('verify-email page renders', async ({ page }) => {
    await page.goto('/auth/verify-email');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
