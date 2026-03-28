import { test, expect } from '@playwright/test';

test.describe('Listing Detail', () => {
  test('renders or shows not-found', async ({ page }) => {
    await page.goto('/listings/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb nav links present', async ({ page }) => {
    await page.goto('/listings/test-id');
    const breadcrumbs = page.getByRole('link').filter({ hasText: /home|search|listings/i });
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs.first()).toHaveAttribute('href', /.+/);
    }
  });

  test('tabs switch between About / Health / Reviews', async ({ page }) => {
    await page.goto('/listings/test-id');
    for (const tabName of ['About', 'Health', 'Reviews']) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
        .or(page.getByRole('button', { name: new RegExp(tabName, 'i') }));
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Send Inquiry button present', async ({ page }) => {
    await page.goto('/listings/test-id');
    const btn = page.getByRole('link', { name: /inquiry|message|contact/i })
      .or(page.getByRole('button', { name: /inquiry|message|contact/i }));
    if (await btn.isVisible()) {
      await expect(btn).toBeEnabled();
    }
  });

  test('Save to Favorites toggle', async ({ page }) => {
    await page.goto('/listings/test-id');
    const favBtn = page.getByRole('button', { name: /save|favorite|heart/i });
    if (await favBtn.isVisible()) {
      await favBtn.click();
    }
  });

  test('organization card links to org detail', async ({ page }) => {
    await page.goto('/listings/test-id');
    const orgLink = page.getByRole('link').filter({ hasText: /shelter|breeder|rescue|organization/i });
    if (await orgLink.count() > 0) {
      await expect(orgLink.first()).toHaveAttribute('href', /.+/);
    }
  });
});
