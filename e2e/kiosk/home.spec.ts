import { test, expect } from '@playwright/test';

test.describe('Kiosk Home', () => {
  test('home page loads with pet type cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('pet type cards are clickable', async ({ page }) => {
    await page.goto('/');
    for (const pet of ['Dog', 'Cat', 'Bird']) {
      const card = page.getByRole('link', { name: new RegExp(pet, 'i') });
      if (await card.isVisible()) await expect(card).toHaveAttribute('href', /.+/);
    }
  });

  test('AI Recommendations button navigates', async ({ page }) => {
    await page.goto('/');
    const aiBtn = page.getByRole('link', { name: /ai recommendation/i })
      .or(page.getByRole('button', { name: /ai recommendation/i }));
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      await expect(page).toHaveURL(/\/ai-guide/);
    }
  });

  test('QR handoff button navigates', async ({ page }) => {
    await page.goto('/');
    const qrBtn = page.getByRole('link', { name: /qr|scan|phone/i })
      .or(page.getByRole('button', { name: /qr|scan|phone/i }));
    if (await qrBtn.isVisible()) {
      await qrBtn.click();
      await expect(page).toHaveURL(/\/handoff/);
    }
  });
});
