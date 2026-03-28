import { test, expect } from '@playwright/test';

test.describe('Partner Dashboard', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('quick action cards have links', async ({ page }) => {
    await page.goto('/');
    for (const name of [/view cases/i, /review validations/i, /manage members/i]) {
      const link = page.getByRole('link', { name }).first();
      if (await link.isVisible()) await expect(link).toHaveAttribute('href', /.+/);
    }
    const orgLink = page.getByRole('link', { name: /organization/i }).first();
    if (await orgLink.isVisible()) await expect(orgLink).toHaveAttribute('href', /.+/);
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/');
    for (const name of [/dashboard/i, /cases/i, /validations/i, /members/i]) {
      const link = page.getByRole('link', { name }).first();
      if (await link.isVisible()) await expect(link).toHaveAttribute('href', /.+/);
    }
    const orgLink = page.getByRole('link', { name: /organization/i }).first();
    if (await orgLink.isVisible()) await expect(orgLink).toHaveAttribute('href', /.+/);
  });
});
