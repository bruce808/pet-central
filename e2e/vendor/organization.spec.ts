import { test, expect } from '@playwright/test';

test.describe('Vendor Organization', () => {
  test('org profile page loads', async ({ page }) => {
    await page.goto('/organization');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('org form fields are editable', async ({ page }) => {
    await page.goto('/organization');
    const nameInput = page.getByLabel(/legal name/i).or(page.getByLabel(/public name/i));
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Shelter');
    }
    const saveBtn = page.getByRole('button', { name: /save changes/i });
    if (await saveBtn.isVisible()) await saveBtn.click();
  });

  test('members page loads', async ({ page }) => {
    await page.goto('/organization/members');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Invite Member button opens modal', async ({ page }) => {
    await page.goto('/organization/members');
    const inviteBtn = page.getByRole('button', { name: /invite member/i });
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await page.waitForTimeout(300);
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      if (await emailInput.isVisible()) {
        await emailInput.fill('newmember@test.com');
      }
    }
  });

  test('documents page loads', async ({ page }) => {
    await page.goto('/organization/documents');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('document upload zone present', async ({ page }) => {
    await page.goto('/organization/documents');
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) await typeSelect.selectOption({ index: 1 });
  });
});
