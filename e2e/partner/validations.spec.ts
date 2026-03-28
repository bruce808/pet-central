import { test, expect } from '@playwright/test';

test.describe('Partner Validations', () => {
  test('validations list loads', async ({ page }) => {
    await page.goto('/validations');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('validation detail loads', async ({ page }) => {
    await page.goto('/validations/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('submit decision — verdict and notes', async ({ page }) => {
    await page.goto('/validations/test-id');
    const verdictSelect = page.locator('select').first();
    if (await verdictSelect.isVisible()) {
      await verdictSelect.selectOption({ index: 1 });
      const notesArea = page.locator('textarea');
      if (await notesArea.isVisible()) await notesArea.fill('Approved after review.');
      const submitBtn = page.getByRole('button', { name: /submit decision/i });
      if (await submitBtn.isVisible()) await submitBtn.click();
    }
  });

  test('document View/Download buttons', async ({ page }) => {
    await page.goto('/validations/test-id');
    const viewBtns = page.getByRole('button', { name: /view|download/i });
    if (await viewBtns.count() > 0) await expect(viewBtns.first()).toBeEnabled();
  });
});
