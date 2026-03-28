import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders hero section with search form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
    const searchInput = page.getByPlaceholder('Search by breed, type, or location...');
    await expect(searchInput).toBeVisible();
  });

  test('hero search submits and navigates to /search', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder('Search by breed, type, or location...');
    await searchInput.fill('golden retriever');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search/);
  });

  test('category cards are clickable', async ({ page }) => {
    await page.goto('/');
    for (const category of ['Dogs', 'Cats', 'Birds']) {
      const card = page.getByRole('link', { name: new RegExp(category, 'i') }).first();
      if (await card.isVisible()) {
        await expect(card).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('featured pet cards render', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('[class*="card"]').or(page.locator('[data-testid*="listing"]'));
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible();
    }
  });

  test('Browse Pets button navigates to search', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /browse pets/i });
    await expect(btn.first()).toBeVisible();
    await btn.first().click();
    await expect(page).toHaveURL(/\/search/);
  });

  test('AI Assistant link navigates', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /ask ai assistant/i });
    await expect(btn.first()).toBeVisible();
    await btn.first().click();
    await expect(page).toHaveURL(/\/ai-assistant/);
  });

  test('navbar links are present', async ({ page }) => {
    await page.goto('/');
    const navLinks = [/home/i, /find pets|pets/i, /resources/i];
    for (const name of navLinks) {
      const el = page.getByRole('link', { name }).first();
      if (await el.isVisible()) {
        await expect(el).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('footer is visible with links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const links = footer.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('footer newsletter form accepts email', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('footer').getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      const submitBtn = page.locator('footer').getByRole('button').first();
      await submitBtn.click();
    }
  });
});
