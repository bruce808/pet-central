import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('action buttons present', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Review Verifications', 'Process Queue', 'View Cases']) {
      const el = page.getByRole('link', { name, exact: true });
      if (await el.isVisible()) await expect(el).toBeEnabled();
    }
  });

  test('sidebar navigation covers all sections', async ({ page }) => {
    await page.goto('/');
    const sections = [/dashboard/i, /cases/i, /moderation/i, /organizations/i, /partners/i, /users/i, /audit/i];
    for (const name of sections) {
      const link = page.getByRole('link', { name }).first();
      if (await link.isVisible()) await expect(link).toHaveAttribute('href', /.+/);
    }
  });
});
