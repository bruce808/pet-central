import { test, expect } from '@playwright/test';

test.describe('Kiosk Handoff', () => {
  test('handoff page loads', async ({ page }) => {
    await page.goto('/handoff');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
