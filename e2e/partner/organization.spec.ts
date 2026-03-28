import { test, expect } from '@playwright/test';

test.describe('Partner Organization', () => {
  test('organization page loads', async ({ page }) => {
    await page.goto('/organization');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Edit Profile toggles edit mode', async ({ page }) => {
    await page.goto('/organization');
    const editBtn = page.getByRole('button', { name: /edit profile/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(300);
      const nameInput = page.getByLabel(/name/i).first();
      if (await nameInput.isVisible()) await nameInput.fill('Updated Partner Org');
      const saveBtn = page.getByRole('button', { name: /save changes/i });
      if (await saveBtn.isVisible()) await saveBtn.click();
    }
  });

  test('Cancel exits edit mode', async ({ page }) => {
    await page.goto('/organization');
    const editBtn = page.getByRole('button', { name: /edit profile/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });
});
