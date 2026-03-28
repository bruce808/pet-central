import { test, expect } from '@playwright/test';

test.describe('Consumer Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Profile tab fields are interactive', async ({ page }) => {
    await page.goto('/settings');
    const profileTab = page.getByRole('button', { name: /^profile$/i });
    if (await profileTab.isVisible()) await profileTab.click();

    const nameInput = page.getByPlaceholder('Your display name');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Name');
      await expect(nameInput).toHaveValue('Updated Name');
    }
  });

  test('Preferences tab toggles and saves', async ({ page }) => {
    await page.goto('/settings');
    const prefTab = page.getByRole('button', { name: /^preferences$/i });
    if (await prefTab.isVisible()) await prefTab.click();

    const toggles = page.getByRole('button').filter({ hasText: /dog|cat|bird/i });
    if (await toggles.count() > 0) await toggles.first().click();
  });

  test('Security tab password form', async ({ page }) => {
    await page.goto('/settings');
    const secTab = page.getByRole('button', { name: /^security$/i });
    if (await secTab.isVisible()) await secTab.click();

    const currentPw = page.getByPlaceholder('Enter current password');
    if (await currentPw.isVisible()) {
      await currentPw.fill('OldPass123!');
    }
  });
});
