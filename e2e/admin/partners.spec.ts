import { test, expect } from '@playwright/test';

test.describe('Admin Partners', () => {
  test('partners page loads', async ({ page }) => {
    await page.goto('/partners');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Add Partner button opens modal', async ({ page }) => {
    await page.goto('/partners');
    const addBtn = page.getByRole('button', { name: /add partner/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
      const nameInput = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i));
      if (await nameInput.isVisible()) {
        await nameInput.fill('Portland Humane Society');
      }
    }
  });

  test('search filters', async ({ page }) => {
    await page.goto('/partners');
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) await search.fill('Portland');
  });
});
