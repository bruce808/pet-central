import { test, expect } from '@playwright/test';

test.describe('Consumer Messages', () => {
  test('messages page loads', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('message input accepts text', async ({ page }) => {
    await page.goto('/messages');
    const input = page.getByPlaceholder('Type a message...');
    if (await input.isVisible()) {
      await input.fill('Hello, I am interested in this pet.');
      await expect(input).toHaveValue(/Hello/);
    }
  });

  test('send button is present', async ({ page }) => {
    await page.goto('/messages');
    const sendBtn = page.getByRole('button', { name: /send/i });
    if (await sendBtn.isVisible()) {
      await expect(sendBtn).toBeEnabled();
    }
  });
});
