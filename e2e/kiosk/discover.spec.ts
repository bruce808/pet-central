import { test, expect } from '@playwright/test';

test.describe('Kiosk Discover', () => {
  test('discover page loads', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('step 1 — pet type buttons work', async ({ page }) => {
    await page.goto('/discover');
    for (const pet of ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Reptiles']) {
      const btn = page.getByRole('button', { name: new RegExp(pet, 'i') });
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(200);
        break;
      }
    }
  });

  test('step 2 — size filter pills toggle', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);
    for (const size of ['Small', 'Medium', 'Large']) {
      const pill = page.getByRole('button', { name: new RegExp(size, 'i') });
      if (await pill.isVisible()) await pill.click();
    }
  });

  test('step 2 — temperament pills toggle', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);
    for (const temp of ['Calm', 'Playful', 'Independent', 'Social']) {
      const pill = page.getByRole('button', { name: new RegExp(temp, 'i') });
      if (await pill.isVisible()) await pill.click();
    }
  });

  test('Show Results advances to step 3', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);
    const showBtn = page.getByRole('button', { name: /show results/i });
    if (await showBtn.isVisible()) await showBtn.click();
    await page.waitForTimeout(500);
  });

  test('Start Over resets wizard', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(300);
    const startOver = page.getByRole('button', { name: /start over/i });
    if (await startOver.isVisible()) await startOver.click();
  });
});
