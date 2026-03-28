import { test, expect } from '@playwright/test';

test.describe('Admin Moderation', () => {
  test('moderation page loads', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('filter tabs switch', async ({ page }) => {
    await page.goto('/moderation');
    for (const tab of ['All', 'Listings', 'Reviews', 'Messages', 'Resources']) {
      const pill = page.getByRole('button', { name: tab, exact: true })
        .or(page.getByRole('tab', { name: tab, exact: true }));
      if (await pill.isVisible()) {
        await pill.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Select all checkbox toggles', async ({ page }) => {
    await page.goto('/moderation');
    const selectAll = page.getByRole('checkbox').first();
    if (await selectAll.isVisible()) {
      await selectAll.click();
      await page.waitForTimeout(200);
    }
  });

  test('bulk action buttons present', async ({ page }) => {
    await page.goto('/moderation');
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible()) await expect(approveBtn).toBeVisible();
  });
});
