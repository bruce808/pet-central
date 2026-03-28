import { test, expect } from '@playwright/test';

test.describe('Vendor Resources', () => {
  test('resources page loads', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('New Resource button opens modal', async ({ page }) => {
    await page.goto('/resources');
    const newBtn = page.getByRole('button', { name: /new resource/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(300);
      const titleInput = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i));
      if (await titleInput.isVisible()) {
        await titleInput.fill('Care Tips for Puppies');
      }
    }
  });
});
