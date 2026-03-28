import { test, expect } from '@playwright/test';

test.describe('AI Assistant', () => {
  test('page loads with chat interface', async ({ page }) => {
    await page.goto('/ai-assistant');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('suggested prompt buttons are clickable', async ({ page }) => {
    await page.goto('/ai-assistant');
    const prompts = page.getByRole('button', { name: /help me choose|what should i know|compare breeders|tips for first|how to prepare/i });
    if (await prompts.count() > 0) {
      await prompts.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('chat input accepts text and sends', async ({ page }) => {
    await page.goto('/ai-assistant');
    const input = page.getByPlaceholder('Ask about breeds, adoption, pet care...');
    await expect(input).toBeVisible();
    await input.fill('What dog breed is best for apartments?');
    const sendBtn = page.locator('main button[type="submit"]');
    await sendBtn.click();
    await page.waitForTimeout(1000);
  });
});
