import { Page, expect } from '@playwright/test';

export async function expectPageLoads(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('body')).not.toBeEmpty();
}

export async function expectNoBlankScreen(page: Page) {
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.trim().length).toBeGreaterThan(0);
}
