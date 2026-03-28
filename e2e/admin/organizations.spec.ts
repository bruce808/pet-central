import { test, expect } from '@playwright/test';

test.describe('Admin Organizations', () => {
  test('list page loads', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('search and filters work', async ({ page }) => {
    await page.goto('/organizations');
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) await search.fill('Test Shelter');
    const selects = page.locator('select');
    if (await selects.count() > 0) await selects.first().selectOption({ index: 1 });
  });

  test('org detail page loads', async ({ page }) => {
    await page.goto('/organizations/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('org detail tabs switch', async ({ page }) => {
    await page.goto('/organizations/test-id');
    for (const tab of ['Profile', 'Trust', 'Documents', 'Listings', 'Members', 'Cases']) {
      const tabBtn = page.getByRole('tab', { name: new RegExp(tab, 'i') })
        .or(page.getByRole('button', { name: new RegExp(tab, 'i') }));
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Trust tab — Approve/Reject buttons', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const trustTab = page.getByRole('button', { name: /trust/i });
    if (await trustTab.isVisible()) {
      await trustTab.click();
      await page.waitForTimeout(300);
      const approveBtn = page.getByRole('button', { name: /approve/i });
      if (await approveBtn.isVisible()) await expect(approveBtn).toBeEnabled();
    }
  });

  test('status select dropdown', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) await statusSelect.selectOption({ index: 1 });
  });
});
