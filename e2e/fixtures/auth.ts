import { Page, expect } from '@playwright/test';

export async function registerConsumer(page: Page, opts?: { name?: string; email?: string; password?: string }) {
  const name = opts?.name ?? 'Test User';
  const email = opts?.email ?? `testuser+${Date.now()}@example.com`;
  const password = opts?.password ?? 'SecurePass123!';

  await page.goto('/auth/register');
  await page.getByLabel(/display name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  const checkbox = page.getByRole('checkbox');
  if (await checkbox.isVisible()) await checkbox.check();
  await page.getByRole('button', { name: /create account/i }).click();
  return { name, email, password };
}

export async function loginConsumer(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
}

export async function loginAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('admin@petcentral.com');
  await page.getByLabel(/password/i).fill('AdminPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
}

export async function loginPartner(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('partner@petcentral.com');
  await page.getByLabel(/password/i).fill('PartnerPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
}
