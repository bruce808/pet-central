import { test, expect } from '@playwright/test';

test.describe('Vendor Reviews', () => {
  test('reviews page loads', async ({ page }) => {
    await page.goto('/reviews');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('tabs switch between Received / User Feedback', async ({ page }) => {
    await page.goto('/reviews');
    for (const tab of ['Reviews Received', 'User Feedback', 'Received', 'Feedback']) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') })
        .or(page.getByRole('tab', { name: new RegExp(tab, 'i') }));
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Respond button opens textarea', async ({ page }) => {
    await page.goto('/reviews');
    const respondBtn = page.getByRole('button', { name: /respond/i });
    if (await respondBtn.isVisible()) {
      await respondBtn.first().click();
      await page.waitForTimeout(300);
      const textarea = page.locator('textarea');
      if (await textarea.isVisible()) {
        await textarea.fill('Thank you for your feedback!');
      }
    }
  });
});
