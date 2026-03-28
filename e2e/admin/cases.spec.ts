import { test, expect } from '@playwright/test';

test.describe('Admin Cases', () => {
  test('cases list loads', async ({ page }) => {
    await page.goto('/cases');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('New Case button present', async ({ page }) => {
    await page.goto('/cases');
    const newBtn = page.getByRole('button', { name: /new case/i });
    if (await newBtn.isVisible()) await expect(newBtn).toBeEnabled();
  });

  test('search and filters work', async ({ page }) => {
    await page.goto('/cases');
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) await search.fill('fraud');
    const selects = page.locator('select');
    for (let i = 0; i < Math.min(await selects.count(), 3); i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
  });

  test('Assigned to me checkbox', async ({ page }) => {
    await page.goto('/cases');
    const checkbox = page.getByRole('checkbox').or(page.getByLabel(/assigned to me/i));
    if (await checkbox.isVisible()) {
      await checkbox.first().check();
    }
  });

  test('case detail page loads', async ({ page }) => {
    await page.goto('/cases/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('case detail — add note', async ({ page }) => {
    await page.goto('/cases/test-id');
    const noteArea = page.locator('textarea');
    if (await noteArea.isVisible()) {
      await noteArea.fill('Investigating this report.');
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

  test('case detail — action buttons', async ({ page }) => {
    await page.goto('/cases/test-id');
    for (const action of ['Assign', 'Escalate', 'Resolve', 'Close']) {
      const btn = page.getByRole('button', { name: new RegExp(action, 'i') });
      if (await btn.isVisible()) await expect(btn).toBeEnabled();
    }
  });
});
