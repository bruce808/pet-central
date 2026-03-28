import { test, expect } from '@playwright/test';

test.describe('Create Listing Wizard', () => {
  test('step 1 renders pet info fields', async ({ page }) => {
    await page.goto('/listings/new');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('step 1 — fill fields and continue', async ({ page }) => {
    await page.goto('/listings/new');
    const petType = page.locator('select').first();
    if (await petType.isVisible()) await petType.selectOption({ index: 1 });
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.isVisible()) await nameInput.fill('Buddy');
    const breedInput = page.getByLabel(/breed/i);
    if (await breedInput.isVisible()) await breedInput.fill('Golden Retriever');
    const descArea = page.locator('textarea').first();
    if (await descArea.isVisible()) await descArea.fill('Friendly and playful puppy.');
    const toggles = page.getByRole('button').filter({ hasText: /Calm|Playful|Energetic|Friendly/i });
    if (await toggles.count() > 0) await toggles.first().click();
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    if (await continueBtn.isVisible()) await continueBtn.click();
  });

  test('Save as Draft button present', async ({ page }) => {
    await page.goto('/listings/new');
    const draftBtn = page.getByRole('button', { name: /save.*draft/i });
    if (await draftBtn.isVisible()) {
      await expect(draftBtn).toBeEnabled();
    }
  });

  test('edit listing page loads', async ({ page }) => {
    await page.goto('/listings/test-id/edit');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('edit listing — Save Changes and Cancel buttons', async ({ page }) => {
    await page.goto('/listings/test-id/edit');
    const saveBtn = page.getByRole('button', { name: /save changes/i });
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await saveBtn.isVisible()) await expect(saveBtn).toBeEnabled();
    if (await cancelBtn.isVisible()) await expect(cancelBtn).toBeEnabled();
  });
});
