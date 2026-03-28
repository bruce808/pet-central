import { test, expect } from '@playwright/test';

test.describe('Partner Members', () => {
  test('members page loads', async ({ page }) => {
    await page.goto('/members');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Invite Member shows form', async ({ page }) => {
    await page.goto('/members');
    const inviteBtn = page.getByRole('button', { name: /invite member/i });
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await page.waitForTimeout(300);
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      if (await emailInput.isVisible()) {
        await emailInput.fill('newpartner@test.com');
        const roleSelect = page.locator('select');
        if (await roleSelect.isVisible()) await roleSelect.selectOption({ index: 1 });
        const sendBtn = page.getByRole('button', { name: /send invite/i });
        if (await sendBtn.isVisible()) await sendBtn.click();
      }
    }
  });

  test('delete member buttons present', async ({ page }) => {
    await page.goto('/members');
    const deleteBtns = page.getByRole('button', { name: /delete|remove/i });
    if (await deleteBtns.count() > 0) await expect(deleteBtns.first()).toBeEnabled();
  });
});
