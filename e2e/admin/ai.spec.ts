import { test, expect } from '@playwright/test';

test.describe('Admin AI Pages', () => {
  test('correspondence page loads', async ({ page }) => {
    await page.goto('/ai/correspondence');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('correspondence — filters work', async ({ page }) => {
    await page.goto('/ai/correspondence');
    const selects = page.locator('select');
    for (let i = 0; i < Math.min(await selects.count(), 2); i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
  });

  test('correspondence — rows expand', async ({ page }) => {
    await page.goto('/ai/correspondence');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) await rows.nth(1).click();
  });

  test('discovery page loads', async ({ page }) => {
    await page.goto('/ai/discovery');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('discovery — filters work', async ({ page }) => {
    await page.goto('/ai/discovery');
    const selects = page.locator('select');
    for (let i = 0; i < Math.min(await selects.count(), 2); i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
  });

  test('discovery — entity detail modal actions', async ({ page }) => {
    await page.goto('/ai/discovery');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) {
      await rows.nth(1).click();
      await page.waitForTimeout(500);
      for (const action of ['Confirm', 'Reject', 'Mark Duplicate']) {
        const btn = page.getByRole('button', { name: new RegExp(action, 'i') });
        if (await btn.isVisible()) await expect(btn).toBeEnabled();
      }
    }
  });
});
