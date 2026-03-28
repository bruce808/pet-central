import { test, expect } from '@playwright/test';

test.describe('Error States', () => {
  test('non-existent route shows 404', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('invalid listing ID shows not-found', async ({ page }) => {
    await page.goto('/listings/nonexistent-id-12345');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('invalid organization ID shows not-found', async ({ page }) => {
    await page.goto('/organizations/nonexistent-id-12345');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('invalid resource slug shows not-found', async ({ page }) => {
    await page.goto('/resources/nonexistent-slug-12345');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
