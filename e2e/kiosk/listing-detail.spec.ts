import { test, expect } from '@playwright/test';

test.describe('Kiosk Listing Detail', () => {
  test('listing detail page loads', async ({ page }) => {
    await page.goto('/listings/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
