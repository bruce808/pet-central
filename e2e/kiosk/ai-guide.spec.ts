import { test, expect } from '@playwright/test';

test.describe('Kiosk AI Guide', () => {
  test('AI guide page loads', async ({ page }) => {
    await page.goto('/ai-guide');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
