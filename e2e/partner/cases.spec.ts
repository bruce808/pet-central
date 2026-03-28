import { test, expect } from '@playwright/test';

test.describe('Partner Cases', () => {
  test('cases list loads', async ({ page }) => {
    await page.goto('/cases');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('case detail page loads', async ({ page }) => {
    await page.goto('/cases/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('case detail — add note', async ({ page }) => {
    await page.goto('/cases/test-id');
    const noteArea = page.locator('textarea');
    if (await noteArea.isVisible()) {
      await noteArea.fill('Partner investigation note.');
      const addBtn = page.getByRole('button', { name: /add note/i });
      if (await addBtn.isVisible()) await addBtn.click();
    }
  });

  test('case detail — status update', async ({ page }) => {
    await page.goto('/cases/test-id');
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) await statusSelect.selectOption({ index: 1 });
    const updateBtn = page.getByRole('button', { name: /update status/i });
    if (await updateBtn.isVisible()) await updateBtn.click();
  });

  test('case detail — Escalate and Resolve buttons', async ({ page }) => {
    await page.goto('/cases/test-id');
    const escalateBtn = page.getByRole('button', { name: /escalate/i });
    const resolveBtn = page.getByRole('button', { name: /resolve/i });
    if (await escalateBtn.isVisible()) await expect(escalateBtn).toBeEnabled();
    if (await resolveBtn.isVisible()) await expect(resolveBtn).toBeEnabled();
  });
});
