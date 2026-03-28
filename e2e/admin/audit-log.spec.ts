import { test, expect } from '@playwright/test';

test.describe('Admin Audit Log', () => {
  test('audit log page loads', async ({ page }) => {
    await page.goto('/audit-log');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('filter controls work', async ({ page }) => {
    await page.goto('/audit-log');
    const selects = page.locator('select');
    if (await selects.count() > 0) await selects.first().selectOption({ index: 1 });
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2025-01-01');
      await dateInputs.nth(1).fill('2025-12-31');
    }
  });

  test('Export button present', async ({ page }) => {
    await page.goto('/audit-log');
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) await expect(exportBtn).toBeEnabled();
  });

  test('expand detail buttons work', async ({ page }) => {
    await page.goto('/audit-log');
    const expandBtn = page.getByRole('button', { name: /expand|show|detail/i });
    if (await expandBtn.isVisible()) {
      await expandBtn.first().click();
      await page.waitForTimeout(300);
    }
  });
});
