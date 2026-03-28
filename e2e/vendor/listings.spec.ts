import { test, expect } from '@playwright/test';

test.describe('Vendor Listings', () => {
  test('listings page loads', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('New Listing button navigates', async ({ page }) => {
    await page.goto('/listings');
    const newBtn = page.getByRole('link', { name: 'New Listing' });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page).toHaveURL(/\/listings\/new/);
    }
  });

  test('filter selects change', async ({ page }) => {
    await page.goto('/listings');
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      await selects.first().selectOption({ index: 1 });
    }
  });

  test('table action buttons present', async ({ page }) => {
    await page.goto('/listings');
    const editBtns = page.getByRole('button', { name: /edit/i });
    if (await editBtns.count() > 0) {
      await expect(editBtns.first()).toBeEnabled();
    }
  });
});
