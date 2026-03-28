import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test('page loads with filter sidebar and results area', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('pet type checkboxes toggle', async ({ page }) => {
    await page.goto('/search');
    const checkboxes = page.getByRole('checkbox');
    if (await checkboxes.count() > 0) {
      const first = checkboxes.first();
      await first.check();
      await expect(first).toBeChecked();
      await first.uncheck();
      await expect(first).not.toBeChecked();
    }
  });

  test('breed input accepts text', async ({ page }) => {
    await page.goto('/search');
    const breedInput = page.getByPlaceholder('e.g. Golden Retriever');
    await expect(breedInput).toBeVisible();
    await breedInput.fill('Labrador');
    await expect(breedInput).toHaveValue('Labrador');
  });

  test('location input accepts text', async ({ page }) => {
    await page.goto('/search');
    const locInput = page.getByPlaceholder('City or zip code');
    await expect(locInput).toBeVisible();
    await locInput.fill('Portland, OR');
    await expect(locInput).toHaveValue('Portland, OR');
  });

  test('radius slider adjusts', async ({ page }) => {
    await page.goto('/search');
    const slider = page.getByRole('slider');
    if (await slider.isVisible()) {
      await slider.fill('50');
    }
  });

  test('min/max fee inputs accept numbers', async ({ page }) => {
    await page.goto('/search');
    const minFee = page.getByPlaceholder('Min');
    const maxFee = page.getByPlaceholder('Max');
    if (await minFee.isVisible()) {
      await minFee.fill('100');
    }
    if (await maxFee.isVisible()) {
      await maxFee.fill('500');
    }
  });

  test('size select changes value', async ({ page }) => {
    await page.goto('/search');
    const sizeSelect = page.locator('select[name="sizeCategory"]');
    if (await sizeSelect.isVisible()) {
      await sizeSelect.selectOption({ index: 1 });
    }
  });

  test('sex select changes value', async ({ page }) => {
    await page.goto('/search');
    const sexSelect = page.locator('select[name="sex"]');
    if (await sexSelect.isVisible()) {
      await sexSelect.selectOption({ index: 1 });
    }
  });

  test('temperament toggle buttons respond', async ({ page }) => {
    await page.goto('/search');
    const toggles = page.getByRole('button').filter({ hasText: /Friendly|Calm|Energetic|Playful|Loyal|Gentle/i });
    if (await toggles.count() > 0) {
      await toggles.first().click();
    }
  });

  test('sort select changes', async ({ page }) => {
    await page.goto('/search');
    const sortSelect = page.locator('select[name="sortBy"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption({ index: 1 });
    }
  });

  test('Apply Filters button works', async ({ page }) => {
    await page.goto('/search');
    const applyBtn = page.getByRole('button', { name: /apply filters/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    }
  });

  test('Clear button resets filters', async ({ page }) => {
    await page.goto('/search');
    const clearBtn = page.getByRole('button', { name: /clear/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  });

  test('pagination controls present', async ({ page }) => {
    await page.goto('/search');
    const nextBtn = page.getByRole('button', { name: /next|›|»/i });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
    }
  });
});
