import { test, expect } from '@playwright/test';

test.describe('Vendor Messages', () => {
  test('messages page loads', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('message input and send button', async ({ page }) => {
    await page.goto('/messages');
    const input = page.getByPlaceholder(/message|type/i).or(page.getByRole('textbox'));
    if (await input.isVisible()) {
      await input.fill('Thanks for your interest!');
      const sendBtn = page.getByRole('button', { name: /send/i });
      if (await sendBtn.isVisible()) await sendBtn.click();
    }
  });
});
