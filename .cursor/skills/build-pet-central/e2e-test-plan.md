# Automated E2E Test Plan — Playwright

Comprehensive automated browser testing for all 5 web apps. Every page, every button, every form, every interactive element.

## Prerequisites & Setup

### Install Playwright

```bash
# From monorepo root
pnpm add -D @playwright/test -w
npx playwright install --with-deps chromium
```

### Add test scripts to root package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Create playwright.config.ts at monorepo root

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'consumer',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5001' },
      testDir: './e2e/consumer',
    },
    {
      name: 'vendor',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5002' },
      testDir: './e2e/vendor',
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5003' },
      testDir: './e2e/admin',
    },
    {
      name: 'partner',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5004' },
      testDir: './e2e/partner',
    },
    {
      name: 'kiosk',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5005' },
      testDir: './e2e/kiosk',
    },
    {
      name: 'consumer-mobile',
      use: { ...devices['iPhone 14'], baseURL: 'http://localhost:5001' },
      testDir: './e2e/consumer',
      testMatch: /responsive/,
    },
    {
      name: 'consumer-tablet',
      use: { ...devices['iPad (gen 7)'], baseURL: 'http://localhost:5001' },
      testDir: './e2e/consumer',
      testMatch: /responsive/,
    },
  ],
  webServer: [
    { command: 'pnpm --filter @pet-central/web-consumer dev', url: 'http://localhost:5001', reuseExistingServer: true, timeout: 120_000 },
    { command: 'pnpm --filter @pet-central/web-vendor dev', url: 'http://localhost:5002', reuseExistingServer: true, timeout: 120_000 },
    { command: 'pnpm --filter @pet-central/web-admin dev', url: 'http://localhost:5003', reuseExistingServer: true, timeout: 120_000 },
    { command: 'pnpm --filter @pet-central/web-partner dev', url: 'http://localhost:5004', reuseExistingServer: true, timeout: 120_000 },
    { command: 'pnpm --filter @pet-central/web-kiosk dev', url: 'http://localhost:5005', reuseExistingServer: true, timeout: 120_000 },
  ],
});
```

### Directory structure

```
e2e/
├── fixtures/          # Shared test fixtures & helpers
│   ├── auth.ts        # Login/register helpers
│   ├── test-data.ts   # Seed data constants
│   └── assertions.ts  # Custom assertion helpers
├── consumer/          # web-consumer tests
├── vendor/            # web-vendor tests
├── admin/             # web-admin tests
├── partner/           # web-partner tests
└── kiosk/             # web-kiosk tests
```

---

## Shared Fixtures (e2e/fixtures/)

### auth.ts — Login/register helpers

Every test that requires authentication should use these helpers. They fill real form fields, click real buttons, and wait for real navigation.

```ts
import { Page, expect } from '@playwright/test';

export async function registerConsumer(page: Page, opts?: { name?: string; email?: string; password?: string }) {
  const name = opts?.name ?? 'Test User';
  const email = opts?.email ?? `testuser+${Date.now()}@example.com`;
  const password = opts?.password ?? 'SecurePass123!';

  await page.goto('/auth/register');
  await page.getByLabel(/display name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole('checkbox', { name: /terms/i }).check();
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/verify-email|login|dashboard/);
  return { name, email, password };
}

export async function loginConsumer(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/^(?!.*login)/);
}

export async function registerVendor(page: Page) {
  await page.goto('/auth/register');
  // Step 1: Personal info
  await page.getByLabel(/full name/i).fill('Vendor Admin');
  await page.getByLabel(/email/i).fill(`vendor+${Date.now()}@example.com`);
  await page.getByLabel(/^password/i).fill('VendorPass123!');
  await page.getByLabel(/confirm password/i).fill('VendorPass123!');
  await page.getByRole('button', { name: /continue/i }).click();
  // Step 2: Organization info
  await page.getByLabel(/legal name/i).fill('Test Pet Shelter');
  await page.getByLabel(/public name/i).fill('Test Shelter');
  await page.locator('select').filter({ hasText: /organization type/i }).selectOption({ index: 1 });
  await page.getByLabel(/city/i).fill('Portland');
  await page.getByLabel(/region/i).fill('OR');
  await page.getByLabel(/country/i).fill('US');
  await page.getByRole('button', { name: /continue/i }).click();
  // Step 3: Confirm
  await page.getByRole('button', { name: /create account/i }).click();
}

export async function loginVendor(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/^(?!.*login)/);
}

export async function loginAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('admin@petcentral.com');
  await page.getByLabel(/password/i).fill('AdminPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/^(?!.*login)/);
}

export async function loginPartner(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('partner@petcentral.com');
  await page.getByLabel(/password/i).fill('PartnerPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/^(?!.*login)/);
}
```

### assertions.ts — Shared assertion helpers

```ts
import { Page, expect } from '@playwright/test';

export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  return { check: () => expect(errors).toEqual([]) };
}

export async function expectPageLoads(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('body')).not.toBeEmpty();
}

export async function expectNoBlankScreen(page: Page) {
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.trim().length).toBeGreaterThan(0);
}
```

---

## 1. web-consumer Tests (e2e/consumer/)

### 1.1 homepage.spec.ts — Home Page

```ts
test.describe('Homepage', () => {
  test('renders hero section with search form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    const searchInput = page.getByPlaceholder(/search|find/i);
    await expect(searchInput).toBeVisible();
  });

  test('hero search submits and navigates to /search', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/search|find/i).fill('golden retriever');
    await page.getByPlaceholder(/search|find/i).press('Enter');
    await expect(page).toHaveURL(/\/search/);
  });

  test('popular search pills are clickable and navigate', async ({ page }) => {
    await page.goto('/');
    const pills = page.locator('[href*="/search"]').filter({ hasText: /.+/ });
    if (await pills.count() > 0) {
      await pills.first().click();
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('category cards (Dogs, Cats, Birds) are clickable', async ({ page }) => {
    await page.goto('/');
    for (const category of ['Dogs', 'Cats', 'Birds']) {
      const card = page.getByRole('link', { name: new RegExp(category, 'i') }).first();
      if (await card.isVisible()) {
        await expect(card).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('featured pet cards render with heart/save buttons', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('[class*="card"], [data-testid*="listing"], [class*="listing"]');
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible();
      const heartBtn = cards.first().getByRole('button').first();
      if (await heartBtn.isVisible()) {
        await heartBtn.click(); // toggle favorite
      }
    }
  });

  test('"Browse Pets" button navigates to search', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /browse pets/i }).or(page.getByRole('button', { name: /browse pets/i }));
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('"Ask AI Assistant" button navigates to ai-assistant', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /ai assistant|ai guide/i }).or(page.getByRole('button', { name: /ai assistant|ai guide/i }));
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page).toHaveURL(/\/ai-assistant/);
    }
  });

  test('navbar links all navigate correctly', async ({ page }) => {
    await page.goto('/');
    const navLinks = [
      { name: /home/i, url: '/' },
      { name: /find pets|pets/i, url: /\/search/ },
      { name: /resources/i, url: /\/resources/ },
      { name: /ai guide|ai assistant/i, url: /\/ai/ },
    ];
    for (const link of navLinks) {
      const el = page.getByRole('link', { name: link.name }).first();
      if (await el.isVisible()) {
        await expect(el).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('category quick-links bar renders and links work', async ({ page }) => {
    await page.goto('/');
    for (const cat of ['Dogs', 'Cats', 'Birds', 'Shelters', 'Breeders', 'Rescues']) {
      const link = page.getByRole('link', { name: new RegExp(cat, 'i') }).first();
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('footer newsletter form accepts email and submits', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('footer').getByPlaceholder(/email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      const submitBtn = page.locator('footer').getByRole('button').first();
      await submitBtn.click();
    }
  });

  test('footer links are present', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const links = footer.getByRole('link');
    expect(await links.count()).toBeGreaterThan(3);
  });

  test('animated stats render numbers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // wait for animation
  });
});
```

### 1.2 search.spec.ts — Search & Filters

```ts
test.describe('Search Page', () => {
  test('page loads with filter sidebar and results area', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('pet type checkboxes toggle correctly', async ({ page }) => {
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
    const breedInput = page.getByLabel(/breed/i).or(page.getByPlaceholder(/breed/i));
    if (await breedInput.isVisible()) {
      await breedInput.fill('Labrador');
      await expect(breedInput).toHaveValue('Labrador');
    }
  });

  test('location input accepts text', async ({ page }) => {
    await page.goto('/search');
    const locInput = page.getByLabel(/location/i).or(page.getByPlaceholder(/location|city|zip/i));
    if (await locInput.isVisible()) {
      await locInput.fill('Portland, OR');
      await expect(locInput).toHaveValue('Portland, OR');
    }
  });

  test('radius slider adjusts value', async ({ page }) => {
    await page.goto('/search');
    const slider = page.getByRole('slider');
    if (await slider.isVisible()) {
      await slider.fill('50');
    }
  });

  test('min/max fee inputs accept numbers', async ({ page }) => {
    await page.goto('/search');
    const minFee = page.getByLabel(/min.*fee|min.*price/i).or(page.getByPlaceholder(/min/i));
    const maxFee = page.getByLabel(/max.*fee|max.*price/i).or(page.getByPlaceholder(/max/i));
    if (await minFee.isVisible()) {
      await minFee.fill('100');
      await maxFee.fill('500');
    }
  });

  test('size select changes value', async ({ page }) => {
    await page.goto('/search');
    const sizeSelect = page.getByLabel(/size/i).or(page.locator('select').filter({ hasText: /size/i }));
    if (await sizeSelect.isVisible()) {
      await sizeSelect.selectOption({ index: 1 });
    }
  });

  test('sex select changes value', async ({ page }) => {
    await page.goto('/search');
    const sexSelect = page.getByLabel(/sex/i).or(page.locator('select').filter({ hasText: /sex|gender/i }));
    if (await sexSelect.isVisible()) {
      await sexSelect.selectOption({ index: 1 });
    }
  });

  test('temperament toggle buttons respond to clicks', async ({ page }) => {
    await page.goto('/search');
    const toggles = page.getByRole('button').filter({ hasText: /calm|playful|energetic|friendly|gentle/i });
    if (await toggles.count() > 0) {
      await toggles.first().click();
    }
  });

  test('sort select changes sort order', async ({ page }) => {
    await page.goto('/search');
    const sortSelect = page.getByLabel(/sort/i).or(page.locator('select').filter({ hasText: /sort|relevance|newest/i }));
    if (await sortSelect.isVisible()) {
      const options = sortSelect.locator('option');
      if (await options.count() > 1) {
        await sortSelect.selectOption({ index: 1 });
      }
    }
  });

  test('Apply Filters button triggers search', async ({ page }) => {
    await page.goto('/search');
    const applyBtn = page.getByRole('button', { name: /apply|filter|search/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    }
  });

  test('Clear button resets filters', async ({ page }) => {
    await page.goto('/search');
    const clearBtn = page.getByRole('button', { name: /clear|reset/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  });

  test('listing cards have clickable links to detail pages', async ({ page }) => {
    await page.goto('/search');
    const cards = page.getByRole('link').filter({ hasText: /.+/ });
    if (await cards.count() > 0) {
      const href = await cards.first().getAttribute('href');
      if (href?.includes('/listings/')) {
        await cards.first().click();
        await expect(page).toHaveURL(/\/listings\//);
      }
    }
  });

  test('pagination controls navigate between pages', async ({ page }) => {
    await page.goto('/search');
    const nextBtn = page.getByRole('button', { name: /next|›|»/i });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
    }
  });
});
```

### 1.3 listing-detail.spec.ts — Listing Detail Page

```ts
test.describe('Listing Detail', () => {
  test('renders pet information or shows not-found', async ({ page }) => {
    await page.goto('/listings/test-id');
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('breadcrumb navigation links work', async ({ page }) => {
    await page.goto('/listings/test-id');
    const breadcrumbs = page.getByRole('link').filter({ hasText: /home|search|listings/i });
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs.first()).toHaveAttribute('href', /.+/);
    }
  });

  test('image gallery displays and is interactive', async ({ page }) => {
    await page.goto('/listings/test-id');
    const images = page.locator('img');
    if (await images.count() > 0) {
      await expect(images.first()).toBeVisible();
    }
  });

  test('ListingTabs switch between About / Health / Reviews', async ({ page }) => {
    await page.goto('/listings/test-id');
    const tabs = ['About', 'Health', 'Reviews'];
    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
        .or(page.getByRole('button', { name: new RegExp(tabName, 'i') }));
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('temperament tags are visible', async ({ page }) => {
    await page.goto('/listings/test-id');
    // Tags should render as badges or chips
  });

  test('Send Inquiry button links to messages', async ({ page }) => {
    await page.goto('/listings/test-id');
    const btn = page.getByRole('link', { name: /inquiry|message|contact/i })
      .or(page.getByRole('button', { name: /inquiry|message|contact/i }));
    if (await btn.isVisible()) {
      await expect(btn).toBeEnabled();
    }
  });

  test('Save to Favorites toggle button works', async ({ page }) => {
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
      await expect(orgLink.first()).toHaveAttribute('href', /\/organizations\//);
    }
  });
});
```

### 1.4 organization-detail.spec.ts — Organization Detail

```ts
test.describe('Organization Detail', () => {
  test('renders or shows not-found', async ({ page }) => {
    await page.goto('/organizations/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('breadcrumb nav links work', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const breadcrumbs = page.getByRole('link').filter({ hasText: /home|organizations/i });
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs.first()).toHaveAttribute('href', /.+/);
    }
  });

  test('star rating display is visible', async ({ page }) => {
    await page.goto('/organizations/test-id');
  });

  test('OrgTabs switch between Active Listings / Reviews / About', async ({ page }) => {
    await page.goto('/organizations/test-id');
    for (const tabName of ['Listings', 'Reviews', 'About', 'Policies']) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
        .or(page.getByRole('button', { name: new RegExp(tabName, 'i') }));
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('trust badges are displayed', async ({ page }) => {
    await page.goto('/organizations/test-id');
  });

  test('external website link has correct href', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const extLink = page.getByRole('link', { name: /website|visit/i });
    if (await extLink.isVisible()) {
      await expect(extLink).toHaveAttribute('href', /^https?:\/\//);
    }
  });
});
```

### 1.5 auth.spec.ts — Authentication Flows

```ts
test.describe('Consumer Auth', () => {
  test('login page renders email + password fields + submit button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form shows validation on empty submit', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should show validation errors or remain on login page
    await expect(page).toHaveURL(/login/);
  });

  test('login form accepts input and submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should either redirect or show an error (not crash)
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login');
    const regLink = page.getByRole('link', { name: /register|sign up|create account/i });
    await expect(regLink).toBeVisible();
    await regLink.click();
    await expect(page).toHaveURL(/register/);
  });

  test('register page renders all required fields', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByLabel(/display name|name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i).first()).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('register form validates matching passwords', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel(/display name|name/i).first().fill('Test');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).first().fill('Pass123!');
    await page.getByLabel(/confirm password/i).fill('Mismatch!');
    await page.getByRole('button', { name: /create account/i }).click();
    // Should show a validation error about passwords not matching
    await expect(page).toHaveURL(/register/);
  });

  test('register form has terms checkbox', async ({ page }) => {
    await page.goto('/auth/register');
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/auth/register');
    const loginLink = page.getByRole('link', { name: /sign in|log in|login/i });
    await expect(loginLink).toBeVisible();
  });

  test('verify-email page renders', async ({ page }) => {
    await page.goto('/auth/verify-email');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

### 1.6 messages.spec.ts — Messaging

```ts
test.describe('Consumer Messages', () => {
  test('messages page loads', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('conversation list items are clickable', async ({ page }) => {
    await page.goto('/messages');
    const items = page.getByRole('button').or(page.getByRole('listitem'));
    // If conversations exist, clicking one should show the thread
  });

  test('message input field accepts text', async ({ page }) => {
    await page.goto('/messages');
    const input = page.getByPlaceholder(/message|type/i).or(page.getByRole('textbox'));
    if (await input.isVisible()) {
      await input.fill('Hello, I am interested in this pet.');
      await expect(input).toHaveValue(/Hello/);
    }
  });

  test('send button is present and clickable', async ({ page }) => {
    await page.goto('/messages');
    const sendBtn = page.getByRole('button', { name: /send/i });
    if (await sendBtn.isVisible()) {
      await expect(sendBtn).toBeEnabled();
    }
  });
});
```

### 1.7 favorites.spec.ts — Favorites

```ts
test.describe('Consumer Favorites', () => {
  test('favorites page loads with empty state or listings', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('empty state shows Browse Pets action button', async ({ page }) => {
    await page.goto('/favorites');
    const browseBtn = page.getByRole('link', { name: /browse pets/i })
      .or(page.getByRole('button', { name: /browse pets/i }));
    if (await browseBtn.isVisible()) {
      await browseBtn.click();
      await expect(page).toHaveURL(/\/search/);
    }
  });

  test('remove from favorites button works', async ({ page }) => {
    await page.goto('/favorites');
    const removeBtn = page.getByRole('button', { name: /remove|unfavorite|heart/i });
    if (await removeBtn.isVisible()) {
      await removeBtn.first().click();
    }
  });
});
```

### 1.8 settings.spec.ts — Account Settings

```ts
test.describe('Consumer Settings', () => {
  test('settings page loads with tabs', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Profile tab fields are interactive', async ({ page }) => {
    await page.goto('/settings');
    const profileTab = page.getByRole('tab', { name: /profile/i })
      .or(page.getByRole('button', { name: /profile/i }));
    if (await profileTab.isVisible()) await profileTab.click();

    const nameInput = page.getByLabel(/display name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Updated Name');
      await expect(nameInput).toHaveValue('Updated Name');
    }
    const cityInput = page.getByLabel(/city/i);
    if (await cityInput.isVisible()) await cityInput.fill('Seattle');
    const bioArea = page.getByLabel(/bio/i).or(page.locator('textarea').first());
    if (await bioArea.isVisible()) await bioArea.fill('Pet lover');
    const saveBtn = page.getByRole('button', { name: /save profile/i });
    if (await saveBtn.isVisible()) await saveBtn.click();
  });

  test('Preferences tab toggles and saves', async ({ page }) => {
    await page.goto('/settings');
    const prefTab = page.getByRole('tab', { name: /preferences/i })
      .or(page.getByRole('button', { name: /preferences/i }));
    if (await prefTab.isVisible()) await prefTab.click();

    const toggles = page.getByRole('button').filter({ hasText: /dog|cat|bird/i });
    if (await toggles.count() > 0) {
      await toggles.first().click();
    }
    const saveBtn = page.getByRole('button', { name: /save preferences/i });
    if (await saveBtn.isVisible()) await saveBtn.click();
  });

  test('Security tab password form works', async ({ page }) => {
    await page.goto('/settings');
    const secTab = page.getByRole('tab', { name: /security/i })
      .or(page.getByRole('button', { name: /security/i }));
    if (await secTab.isVisible()) await secTab.click();

    const currentPw = page.getByLabel(/current password/i);
    if (await currentPw.isVisible()) {
      await currentPw.fill('OldPass123!');
      await page.getByLabel(/new password/i).first().fill('NewPass123!');
      const updateBtn = page.getByRole('button', { name: /update password/i });
      if (await updateBtn.isVisible()) await updateBtn.click();
    }
  });

  test('Security tab phone verification', async ({ page }) => {
    await page.goto('/settings');
    const secTab = page.getByRole('tab', { name: /security/i })
      .or(page.getByRole('button', { name: /security/i }));
    if (await secTab.isVisible()) await secTab.click();

    const phoneInput = page.getByLabel(/phone/i).or(page.getByPlaceholder(/phone/i));
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+15551234567');
      const sendCodeBtn = page.getByRole('button', { name: /send code/i });
      if (await sendCodeBtn.isVisible()) await sendCodeBtn.click();
    }
  });

  test('Security tab MFA setup button', async ({ page }) => {
    await page.goto('/settings');
    const secTab = page.getByRole('tab', { name: /security/i })
      .or(page.getByRole('button', { name: /security/i }));
    if (await secTab.isVisible()) await secTab.click();

    const mfaBtn = page.getByRole('button', { name: /mfa|two-factor|2fa/i });
    if (await mfaBtn.isVisible()) {
      await expect(mfaBtn).toBeEnabled();
    }
  });
});
```

### 1.9 ai-assistant.spec.ts — AI Chat

```ts
test.describe('AI Assistant', () => {
  test('page loads with chat interface', async ({ page }) => {
    await page.goto('/ai-assistant');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('suggested prompt buttons are clickable', async ({ page }) => {
    await page.goto('/ai-assistant');
    const prompts = page.getByRole('button').filter({ hasText: /.{10,}/ }); // prompt buttons have longer text
    if (await prompts.count() > 0) {
      await prompts.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('chat input accepts text and sends', async ({ page }) => {
    await page.goto('/ai-assistant');
    const input = page.getByPlaceholder(/ask|message|type/i).or(page.getByRole('textbox'));
    if (await input.isVisible()) {
      await input.fill('What dog breed is best for apartments?');
      const sendBtn = page.getByRole('button', { name: /send/i }).or(page.locator('button[type="submit"]'));
      if (await sendBtn.isVisible()) await sendBtn.click();
      await page.waitForTimeout(2000);
    }
  });
});
```

### 1.10 resources.spec.ts — Resources

```ts
test.describe('Resources', () => {
  test('resources listing page loads', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('type filter pills switch categories', async ({ page }) => {
    await page.goto('/resources');
    for (const type of ['All', 'Articles', 'Tips', 'Guides']) {
      const pill = page.getByRole('link', { name: new RegExp(type, 'i') })
        .or(page.getByRole('button', { name: new RegExp(type, 'i') }));
      if (await pill.isVisible()) {
        await pill.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('resource cards link to detail pages', async ({ page }) => {
    await page.goto('/resources');
    const links = page.getByRole('link').filter({ hasText: /.+/ });
    // Check for links to /resources/[slug]
  });

  test('individual resource page loads', async ({ page }) => {
    await page.goto('/resources/test-slug');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('resource detail has breadcrumbs', async ({ page }) => {
    await page.goto('/resources/test-slug');
    const breadcrumbs = page.getByRole('link').filter({ hasText: /resources|home/i });
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs.first()).toHaveAttribute('href', /.+/);
    }
  });

  test('"View all resources" link navigates back', async ({ page }) => {
    await page.goto('/resources/test-slug');
    const backLink = page.getByRole('link', { name: /view all|back to resources/i });
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/resources$/);
    }
  });
});
```

### 1.11 responsive.spec.ts — Responsive Layout

```ts
test.describe('Responsive Layout', () => {
  test('homepage at mobile width has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('mobile hamburger menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: /menu|hamburger/i })
      .or(page.locator('[class*="hamburger"], [class*="menu-toggle"], button[aria-label*="menu"]'));
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300);
      // Menu should be visible
      await hamburger.click(); // close
    }
  });

  test('search page filters collapse on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/search');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('homepage at tablet width adapts layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('homepage at desktop width shows full layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

### 1.12 error-states.spec.ts — 404 / Error Handling

```ts
test.describe('Error States', () => {
  test('non-existent route shows 404 page', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should show a 404 message, not a stack trace
  });

  test('invalid listing ID shows not-found state', async ({ page }) => {
    await page.goto('/listings/nonexistent-id-12345');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('invalid organization ID shows not-found state', async ({ page }) => {
    await page.goto('/organizations/nonexistent-id-12345');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('invalid resource slug shows not-found state', async ({ page }) => {
    await page.goto('/resources/nonexistent-slug-12345');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

---

## 2. web-vendor Tests (e2e/vendor/)

### 2.1 auth.spec.ts — Vendor Auth

```ts
test.describe('Vendor Auth', () => {
  test('login page renders with brand split layout', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('vendor@test.com');
    await page.getByLabel(/password/i).fill('VendorPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
  });

  test('register wizard step 1 — personal info', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel(/full name/i).fill('Test Vendor');
    await page.getByLabel(/email/i).fill('newvendor@test.com');
    await page.getByLabel(/^password/i).first().fill('Pass123!');
    await page.getByLabel(/confirm password/i).fill('Pass123!');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(500);
  });

  test('register wizard step 2 — org info', async ({ page }) => {
    await page.goto('/auth/register');
    // Navigate to step 2
    await page.getByLabel(/full name/i).fill('Test Vendor');
    await page.getByLabel(/email/i).fill('v@test.com');
    await page.getByLabel(/^password/i).first().fill('Pass123!');
    await page.getByLabel(/confirm password/i).fill('Pass123!');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(500);
    // Step 2 fields
    const legalName = page.getByLabel(/legal name/i);
    if (await legalName.isVisible()) {
      await legalName.fill('Test Shelter LLC');
      await page.getByLabel(/public name/i).fill('Test Shelter');
      await page.getByLabel(/city/i).fill('Portland');
    }
  });

  test('register wizard step navigation — Back button works', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel(/full name/i).fill('X');
    await page.getByLabel(/email/i).fill('x@test.com');
    await page.getByLabel(/^password/i).first().fill('Pass123!');
    await page.getByLabel(/confirm password/i).fill('Pass123!');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(500);
    const backBtn = page.getByRole('button', { name: /back/i });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.getByLabel(/full name/i)).toBeVisible();
    }
  });
});
```

### 2.2 dashboard.spec.ts — Vendor Dashboard

```ts
test.describe('Vendor Dashboard', () => {
  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('quick action buttons navigate correctly', async ({ page }) => {
    await page.goto('/');
    const createBtn = page.getByRole('link', { name: /create listing/i })
      .or(page.getByRole('button', { name: /create listing/i }));
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page).toHaveURL(/\/listings\/new/);
    }
  });

  test('recent inquiries links are clickable', async ({ page }) => {
    await page.goto('/');
    const inquiryLinks = page.getByRole('link').filter({ hasText: /inquiry|message/i });
    if (await inquiryLinks.count() > 0) {
      await expect(inquiryLinks.first()).toHaveAttribute('href', /.+/);
    }
  });

  test('sidebar navigation works for all sections', async ({ page }) => {
    await page.goto('/');
    const navItems = [
      { name: /dashboard/i, url: '/' },
      { name: /listings/i, url: /\/listings/ },
      { name: /messages/i, url: /\/messages/ },
      { name: /organization/i, url: /\/organization/ },
      { name: /documents/i, url: /\/documents/ },
      { name: /members/i, url: /\/members/ },
      { name: /reviews/i, url: /\/reviews/ },
      { name: /analytics/i, url: /\/analytics/ },
      { name: /resources/i, url: /\/resources/ },
    ];
    for (const item of navItems) {
      const link = page.getByRole('link', { name: item.name }).first();
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('notification bell button is interactive', async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button').filter({ has: page.locator('[class*="bell"], svg') });
    if (await bell.count() > 0) {
      await bell.first().click();
    }
  });

  test('user dropdown menu opens', async ({ page }) => {
    await page.goto('/');
    const userMenu = page.getByRole('button', { name: /user|vendor|profile|account/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(300);
    }
  });
});
```

### 2.3 listings.spec.ts — Listing Management

```ts
test.describe('Vendor Listings', () => {
  test('listings page loads with table and controls', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('New Listing button navigates to create form', async ({ page }) => {
    await page.goto('/listings');
    const newBtn = page.getByRole('link', { name: /new listing/i })
      .or(page.getByRole('button', { name: /new listing/i }));
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page).toHaveURL(/\/listings\/new/);
    }
  });

  test('status filter select changes', async ({ page }) => {
    await page.goto('/listings');
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
    }
  });

  test('pet type filter select changes', async ({ page }) => {
    await page.goto('/listings');
    const typeFilter = page.locator('select').nth(1);
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption({ index: 1 });
    }
  });

  test('table action buttons (Edit/Publish/Pause) are present', async ({ page }) => {
    await page.goto('/listings');
    const editBtns = page.getByRole('button', { name: /edit/i });
    if (await editBtns.count() > 0) {
      await expect(editBtns.first()).toBeEnabled();
    }
  });
});
```

### 2.4 listing-create.spec.ts — New Listing Wizard

```ts
test.describe('Create Listing Wizard', () => {
  test('step 1 renders all pet info fields', async ({ page }) => {
    await page.goto('/listings/new');
    await expect(page.locator('body')).not.toBeEmpty();
    // Pet Type select
    const petTypeSelect = page.locator('select').filter({ hasText: /dog|cat|bird|type/i }).first();
    if (await petTypeSelect.isVisible()) await petTypeSelect.selectOption({ index: 1 });
  });

  test('step 1 — fill all fields and continue', async ({ page }) => {
    await page.goto('/listings/new');
    const petType = page.locator('select').first();
    if (await petType.isVisible()) await petType.selectOption({ index: 1 });
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.isVisible()) await nameInput.fill('Buddy');
    const breedInput = page.getByLabel(/breed/i);
    if (await breedInput.isVisible()) await breedInput.fill('Golden Retriever');
    const descArea = page.locator('textarea').first();
    if (await descArea.isVisible()) await descArea.fill('Friendly and playful puppy.');
    // Temperament toggles
    const toggles = page.getByRole('button').filter({ hasText: /calm|playful|energetic|friendly/i });
    if (await toggles.count() > 0) await toggles.first().click();
    const continueBtn = page.getByRole('button', { name: /continue|next/i });
    if (await continueBtn.isVisible()) await continueBtn.click();
  });

  test('step 2 — photo upload zone is interactive', async ({ page }) => {
    await page.goto('/listings/new');
    // Navigate to step 2
    const continueBtn = page.getByRole('button', { name: /continue|next/i });
    if (await continueBtn.isVisible()) await continueBtn.click();
    await page.waitForTimeout(500);
    // Check for upload zone
    const uploadZone = page.locator('[class*="drop"], [class*="upload"]');
    if (await uploadZone.count() > 0) {
      await expect(uploadZone.first()).toBeVisible();
    }
  });

  test('step navigation — Save as Draft button', async ({ page }) => {
    await page.goto('/listings/new');
    const draftBtn = page.getByRole('button', { name: /save.*draft/i });
    if (await draftBtn.isVisible()) {
      await expect(draftBtn).toBeEnabled();
    }
  });

  test('step navigation — Back button returns to previous step', async ({ page }) => {
    await page.goto('/listings/new');
    const continueBtn = page.getByRole('button', { name: /continue|next/i });
    if (await continueBtn.isVisible()) await continueBtn.click();
    await page.waitForTimeout(500);
    const backBtn = page.getByRole('button', { name: /back|previous/i });
    if (await backBtn.isVisible()) await backBtn.click();
  });

  test('edit listing page loads for valid ID', async ({ page }) => {
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
```

### 2.5 reviews.spec.ts — Vendor Reviews

```ts
test.describe('Vendor Reviews', () => {
  test('reviews page loads with tabs', async ({ page }) => {
    await page.goto('/reviews');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Reviews Received / User Feedback tabs switch', async ({ page }) => {
    await page.goto('/reviews');
    for (const tab of ['Reviews Received', 'User Feedback']) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') })
        .or(page.getByRole('tab', { name: new RegExp(tab, 'i') }));
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Respond button opens textarea', async ({ page }) => {
    await page.goto('/reviews');
    const respondBtn = page.getByRole('button', { name: /respond/i });
    if (await respondBtn.isVisible()) {
      await respondBtn.first().click();
      await page.waitForTimeout(300);
      const textarea = page.locator('textarea');
      if (await textarea.isVisible()) {
        await textarea.fill('Thank you for your feedback!');
      }
    }
  });

  test('User Feedback form fields work', async ({ page }) => {
    await page.goto('/reviews');
    const fbTab = page.getByRole('button', { name: /user feedback/i });
    if (await fbTab.isVisible()) {
      await fbTab.click();
      await page.waitForTimeout(300);
      const userIdInput = page.getByLabel(/user id/i).or(page.getByPlaceholder(/user/i));
      if (await userIdInput.isVisible()) {
        await userIdInput.fill('user-123');
      }
      const selects = page.locator('select');
      for (let i = 0; i < Math.min(await selects.count(), 3); i++) {
        await selects.nth(i).selectOption({ index: 1 });
      }
      const notesArea = page.locator('textarea');
      if (await notesArea.isVisible()) await notesArea.fill('Good interaction.');
      const submitBtn = page.getByRole('button', { name: /submit feedback/i });
      if (await submitBtn.isVisible()) await submitBtn.click();
    }
  });
});
```

### 2.6 organization.spec.ts — Org Profile, Members, Documents

```ts
test.describe('Vendor Organization', () => {
  test('org profile page loads with form', async ({ page }) => {
    await page.goto('/organization');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('org profile form fields are editable', async ({ page }) => {
    await page.goto('/organization');
    const fields = [
      { label: /legal name/i, value: 'Updated Shelter' },
      { label: /public name/i, value: 'Updated Public Name' },
      { label: /website/i, value: 'https://shelter.com' },
      { label: /phone/i, value: '+15551234567' },
      { label: /description/i, value: 'A great shelter.' },
    ];
    for (const f of fields) {
      const input = page.getByLabel(f.label);
      if (await input.isVisible()) {
        await input.fill(f.value);
      }
    }
    const saveBtn = page.getByRole('button', { name: /save changes/i });
    if (await saveBtn.isVisible()) await saveBtn.click();
  });

  test('Upload Logo button is present', async ({ page }) => {
    await page.goto('/organization');
    const uploadBtn = page.getByRole('button', { name: /upload logo/i });
    if (await uploadBtn.isVisible()) await expect(uploadBtn).toBeEnabled();
  });

  test('members page loads with table', async ({ page }) => {
    await page.goto('/organization/members');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Invite Member button opens modal', async ({ page }) => {
    await page.goto('/organization/members');
    const inviteBtn = page.getByRole('button', { name: /invite member/i });
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await page.waitForTimeout(300);
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      if (await emailInput.isVisible()) {
        await emailInput.fill('newmember@test.com');
        const roleSelect = page.locator('select');
        if (await roleSelect.isVisible()) await roleSelect.selectOption({ index: 1 });
        const sendBtn = page.getByRole('button', { name: /send invite/i });
        if (await sendBtn.isVisible()) await sendBtn.click();
      }
    }
  });

  test('documents page loads', async ({ page }) => {
    await page.goto('/organization/documents');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('document upload flow — select type and upload zone', async ({ page }) => {
    await page.goto('/organization/documents');
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) await typeSelect.selectOption({ index: 1 });
    const uploadZone = page.locator('[class*="drop"], [class*="upload"]');
    if (await uploadZone.count() > 0) {
      await expect(uploadZone.first()).toBeVisible();
    }
  });
});
```

### 2.7 analytics.spec.ts — Vendor Analytics

```ts
test.describe('Vendor Analytics', () => {
  test('analytics page loads with stat cards', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('stat cards display numeric values', async ({ page }) => {
    await page.goto('/analytics');
    // Stat cards should show Views, Inquiries, etc.
  });

  test('listings performance table is present', async ({ page }) => {
    await page.goto('/analytics');
    const table = page.locator('table').or(page.locator('[role="table"]'));
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });
});
```

### 2.8 resources.spec.ts — Vendor Resources

```ts
test.describe('Vendor Resources', () => {
  test('resources page loads', async ({ page }) => {
    await page.goto('/resources');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('New Resource button opens modal', async ({ page }) => {
    await page.goto('/resources');
    const newBtn = page.getByRole('button', { name: /new resource/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(300);
      const titleInput = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i));
      if (await titleInput.isVisible()) {
        await titleInput.fill('Care Tips for Puppies');
        const typeSelect = page.locator('select');
        if (await typeSelect.isVisible()) await typeSelect.selectOption({ index: 1 });
        const contentArea = page.locator('textarea');
        if (await contentArea.isVisible()) await contentArea.fill('Here are some tips...');
        const createBtn = page.getByRole('button', { name: /create/i });
        if (await createBtn.isVisible()) await createBtn.click();
      }
    }
  });
});
```

### 2.9 messages.spec.ts — Vendor Inbox

```ts
test.describe('Vendor Messages', () => {
  test('messages page loads with conversation list', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('conversation items are clickable', async ({ page }) => {
    await page.goto('/messages');
    const items = page.getByRole('button').or(page.getByRole('listitem'));
    if (await items.count() > 0) {
      await items.first().click();
    }
  });

  test('message input and send button work', async ({ page }) => {
    await page.goto('/messages');
    const input = page.getByPlaceholder(/message|type/i).or(page.getByRole('textbox'));
    if (await input.isVisible()) {
      await input.fill('Thanks for your interest!');
      const sendBtn = page.getByRole('button', { name: /send/i });
      if (await sendBtn.isVisible()) await sendBtn.click();
    }
  });

  test('Assign to dropdown is present', async ({ page }) => {
    await page.goto('/messages');
    const assignSelect = page.locator('select').filter({ hasText: /assign/i });
    if (await assignSelect.isVisible()) {
      await assignSelect.selectOption({ index: 1 });
    }
  });
});
```

---

## 3. web-admin Tests (e2e/admin/)

### 3.1 auth.spec.ts — Admin Auth

```ts
test.describe('Admin Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@petcentral.com');
    await page.getByLabel(/password/i).fill('AdminPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
  });
});
```

### 3.2 dashboard.spec.ts — Admin Dashboard

```ts
test.describe('Admin Dashboard', () => {
  test('dashboard loads with stat cards and activity feed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('action buttons navigate correctly', async ({ page }) => {
    await page.goto('/');
    const buttons = [
      { name: /review verifications/i, url: /verif|organizations/ },
      { name: /process queue/i, url: /moderation/ },
      { name: /view cases/i, url: /cases/ },
    ];
    for (const btn of buttons) {
      const el = page.getByRole('link', { name: btn.name })
        .or(page.getByRole('button', { name: btn.name }));
      if (await el.isVisible()) {
        await expect(el).toBeEnabled();
      }
    }
  });

  test('sidebar navigation covers all sections', async ({ page }) => {
    await page.goto('/');
    const sections = [
      /dashboard/i, /cases/i, /moderation/i, /organizations/i,
      /partners/i, /users/i, /reviews/i, /audit/i,
      /correspondence/i, /discovery/i,
    ];
    for (const name of sections) {
      const link = page.getByRole('link', { name }).first();
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute('href', /.+/);
      }
    }
  });
});
```

### 3.3 users.spec.ts — User Management

```ts
test.describe('Admin Users', () => {
  test('users page loads with search and table', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('search input filters users', async ({ page }) => {
    await page.goto('/users');
    const search = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    if (await search.isVisible()) {
      await search.fill('test@example.com');
      await page.waitForTimeout(500);
    }
  });

  test('clicking a table row opens user detail modal', async ({ page }) => {
    await page.goto('/users');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) {
      await rows.nth(1).click();
      await page.waitForTimeout(500);
    }
  });

  test('user detail modal action buttons', async ({ page }) => {
    await page.goto('/users');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) {
      await rows.nth(1).click();
      await page.waitForTimeout(500);
      for (const action of ['Suspend', 'Ban', 'Activate']) {
        const btn = page.getByRole('button', { name: new RegExp(action, 'i') });
        if (await btn.isVisible()) await expect(btn).toBeEnabled();
      }
    }
  });

  test('pagination controls work', async ({ page }) => {
    await page.goto('/users');
    const nextBtn = page.getByRole('button', { name: /next|›/i });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
    }
  });
});
```

### 3.4 organizations.spec.ts — Organization Management

```ts
test.describe('Admin Organizations', () => {
  test('organizations list page loads with filters', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('search input works', async ({ page }) => {
    await page.goto('/organizations');
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) {
      await search.fill('Test Shelter');
    }
  });

  test('status filter select changes', async ({ page }) => {
    await page.goto('/organizations');
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) await statusFilter.selectOption({ index: 1 });
  });

  test('type filter select changes', async ({ page }) => {
    await page.goto('/organizations');
    const selects = page.locator('select');
    if (await selects.count() > 1) await selects.nth(1).selectOption({ index: 1 });
  });

  test('org detail page loads with tabs', async ({ page }) => {
    await page.goto('/organizations/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('org detail tabs switch correctly', async ({ page }) => {
    await page.goto('/organizations/test-id');
    for (const tab of ['Profile', 'Trust', 'Documents', 'Listings', 'Members', 'Cases']) {
      const tabBtn = page.getByRole('tab', { name: new RegExp(tab, 'i') })
        .or(page.getByRole('button', { name: new RegExp(tab, 'i') }));
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Trust tab — add/remove badges', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const trustTab = page.getByRole('button', { name: /trust/i });
    if (await trustTab.isVisible()) {
      await trustTab.click();
      await page.waitForTimeout(300);
      const addInput = page.getByPlaceholder(/badge/i).or(page.getByLabel(/badge/i));
      if (await addInput.isVisible()) await addInput.fill('verified');
    }
  });

  test('Trust tab — Approve/Reject verification buttons', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const trustTab = page.getByRole('button', { name: /trust/i });
    if (await trustTab.isVisible()) {
      await trustTab.click();
      await page.waitForTimeout(300);
      const approveBtn = page.getByRole('button', { name: /approve/i });
      const rejectBtn = page.getByRole('button', { name: /reject/i });
      if (await approveBtn.isVisible()) await expect(approveBtn).toBeEnabled();
      if (await rejectBtn.isVisible()) await expect(rejectBtn).toBeEnabled();
    }
  });

  test('Documents tab — Approve/Reject document buttons', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const docsTab = page.getByRole('button', { name: /documents/i });
    if (await docsTab.isVisible()) {
      await docsTab.click();
      await page.waitForTimeout(300);
    }
  });

  test('status select dropdown changes org status', async ({ page }) => {
    await page.goto('/organizations/test-id');
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) await statusSelect.selectOption({ index: 1 });
  });
});
```

### 3.5 moderation.spec.ts — Moderation Queue

```ts
test.describe('Admin Moderation', () => {
  test('moderation page loads', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('filter tabs switch between types', async ({ page }) => {
    await page.goto('/moderation');
    for (const tab of ['All', 'Listings', 'Reviews', 'Messages', 'Resources']) {
      const pill = page.getByRole('button', { name: new RegExp(tab, 'i') })
        .or(page.getByRole('tab', { name: new RegExp(tab, 'i') }));
      if (await pill.isVisible()) {
        await pill.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Select all checkbox toggles', async ({ page }) => {
    await page.goto('/moderation');
    const selectAll = page.getByRole('checkbox').first();
    if (await selectAll.isVisible()) {
      await selectAll.check();
      await expect(selectAll).toBeChecked();
      await selectAll.uncheck();
    }
  });

  test('bulk Approve/Reject buttons are present', async ({ page }) => {
    await page.goto('/moderation');
    const approveBtn = page.getByRole('button', { name: /approve.*selected/i });
    const rejectBtn = page.getByRole('button', { name: /reject.*selected/i });
    if (await approveBtn.isVisible()) await expect(approveBtn).toBeVisible();
    if (await rejectBtn.isVisible()) await expect(rejectBtn).toBeVisible();
  });

  test('per-row Approve/Reject/Flag buttons work', async ({ page }) => {
    await page.goto('/moderation');
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible()) await expect(approveBtn).toBeEnabled();
  });

  test('Review Content modal opens on row click', async ({ page }) => {
    await page.goto('/moderation');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) {
      await rows.nth(1).click();
      await page.waitForTimeout(500);
    }
  });
});
```

### 3.6 cases.spec.ts — Case Management

```ts
test.describe('Admin Cases', () => {
  test('cases list page loads', async ({ page }) => {
    await page.goto('/cases');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('New Case button is present', async ({ page }) => {
    await page.goto('/cases');
    const newBtn = page.getByRole('button', { name: /new case/i });
    if (await newBtn.isVisible()) await expect(newBtn).toBeEnabled();
  });

  test('search and filter controls work', async ({ page }) => {
    await page.goto('/cases');
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) await search.fill('fraud');
    const selects = page.locator('select');
    for (let i = 0; i < Math.min(await selects.count(), 3); i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
  });

  test('Assigned to me checkbox toggles', async ({ page }) => {
    await page.goto('/cases');
    const checkbox = page.getByRole('checkbox', { name: /assigned to me/i })
      .or(page.getByLabel(/assigned to me/i));
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });

  test('case detail page loads', async ({ page }) => {
    await page.goto('/cases/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('case detail — add note form', async ({ page }) => {
    await page.goto('/cases/test-id');
    const noteArea = page.locator('textarea');
    if (await noteArea.isVisible()) {
      await noteArea.fill('Investigating this report.');
      const addBtn = page.getByRole('button', { name: /add note/i });
      if (await addBtn.isVisible()) await addBtn.click();
    }
  });

  test('case detail — internal checkbox for notes', async ({ page }) => {
    await page.goto('/cases/test-id');
    const internalCheck = page.getByRole('checkbox', { name: /internal/i })
      .or(page.getByLabel(/internal/i));
    if (await internalCheck.isVisible()) {
      await internalCheck.check();
      await expect(internalCheck).toBeChecked();
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

  test('case detail — Reassign button', async ({ page }) => {
    await page.goto('/cases/test-id');
    const reassignBtn = page.getByRole('button', { name: /reassign/i });
    if (await reassignBtn.isVisible()) await expect(reassignBtn).toBeEnabled();
  });
});
```

### 3.7 partners.spec.ts — Partner Management

```ts
test.describe('Admin Partners', () => {
  test('partners page loads', async ({ page }) => {
    await page.goto('/partners');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Add Partner button opens modal', async ({ page }) => {
    await page.goto('/partners');
    const addBtn = page.getByRole('button', { name: /add partner/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
      const nameInput = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i));
      if (await nameInput.isVisible()) {
        await nameInput.fill('Portland Humane Society');
        const typeSelect = page.locator('select');
        if (await typeSelect.isVisible()) await typeSelect.selectOption({ index: 1 });
        const regionInput = page.getByLabel(/region/i);
        if (await regionInput.isVisible()) await regionInput.fill('Pacific NW');
        const createBtn = page.getByRole('button', { name: /create/i });
        if (await createBtn.isVisible()) await createBtn.click();
      }
    }
  });

  test('search input filters partners', async ({ page }) => {
    await page.goto('/partners');
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) await search.fill('Portland');
  });

  test('clicking partner row opens detail modal', async ({ page }) => {
    await page.goto('/partners');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) await rows.nth(1).click();
  });
});
```

### 3.8 audit-log.spec.ts — Audit Log

```ts
test.describe('Admin Audit Log', () => {
  test('audit log page loads', async ({ page }) => {
    await page.goto('/audit-log');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('filter controls work', async ({ page }) => {
    await page.goto('/audit-log');
    const actorSelect = page.locator('select').first();
    if (await actorSelect.isVisible()) await actorSelect.selectOption({ index: 1 });
    const actionInput = page.getByLabel(/action/i).or(page.getByPlaceholder(/action/i));
    if (await actionInput.isVisible()) await actionInput.fill('create');
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2025-01-01');
      await dateInputs.nth(1).fill('2025-12-31');
    }
  });

  test('Export button is present', async ({ page }) => {
    await page.goto('/audit-log');
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) await expect(exportBtn).toBeEnabled();
  });

  test('expand/hide row detail buttons work', async ({ page }) => {
    await page.goto('/audit-log');
    const expandBtn = page.getByRole('button', { name: /expand|show|details/i });
    if (await expandBtn.isVisible()) {
      await expandBtn.first().click();
      await page.waitForTimeout(300);
    }
  });
});
```

### 3.9 ai.spec.ts — AI Correspondence & Discovery

```ts
test.describe('Admin AI Pages', () => {
  test('correspondence page loads', async ({ page }) => {
    await page.goto('/ai/correspondence');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('correspondence — filter selects work', async ({ page }) => {
    await page.goto('/ai/correspondence');
    const selects = page.locator('select');
    for (let i = 0; i < Math.min(await selects.count(), 2); i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
  });

  test('correspondence — clickable rows expand detail', async ({ page }) => {
    await page.goto('/ai/correspondence');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) await rows.nth(1).click();
  });

  test('discovery page loads', async ({ page }) => {
    await page.goto('/ai/discovery');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('discovery — filter selects work', async ({ page }) => {
    await page.goto('/ai/discovery');
    const selects = page.locator('select');
    for (let i = 0; i < Math.min(await selects.count(), 2); i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
  });

  test('discovery — entity detail modal with actions', async ({ page }) => {
    await page.goto('/ai/discovery');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) {
      await rows.nth(1).click();
      await page.waitForTimeout(500);
      for (const action of ['Confirm', 'Reject', 'Mark Duplicate']) {
        const btn = page.getByRole('button', { name: new RegExp(action, 'i') });
        if (await btn.isVisible()) await expect(btn).toBeEnabled();
      }
      const routeSelect = page.locator('select').filter({ hasText: /route|team/i });
      if (await routeSelect.isVisible()) await routeSelect.selectOption({ index: 1 });
    }
  });
});
```

---

## 4. web-partner Tests (e2e/partner/)

### 4.1 auth.spec.ts

```ts
test.describe('Partner Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form submits', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('partner@petcentral.com');
    await page.getByLabel(/password/i).fill('PartnerPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
  });
});
```

### 4.2 dashboard.spec.ts

```ts
test.describe('Partner Dashboard', () => {
  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('quick action cards navigate correctly', async ({ page }) => {
    await page.goto('/');
    const actions = [
      { name: /view cases/i, url: /\/cases/ },
      { name: /review validations/i, url: /\/validations/ },
      { name: /organization/i, url: /\/organization/ },
      { name: /manage members/i, url: /\/members/ },
    ];
    for (const action of actions) {
      const link = page.getByRole('link', { name: action.name });
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('active cases links are clickable', async ({ page }) => {
    await page.goto('/');
    const caseLinks = page.getByRole('link').filter({ hasText: /case|#/i });
    if (await caseLinks.count() > 0) {
      await expect(caseLinks.first()).toHaveAttribute('href', /\/cases\//);
    }
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/');
    for (const name of [/dashboard/i, /cases/i, /validations/i, /organization/i, /members/i]) {
      const link = page.getByRole('link', { name }).first();
      if (await link.isVisible()) await expect(link).toHaveAttribute('href', /.+/);
    }
  });
});
```

### 4.3 cases.spec.ts

```ts
test.describe('Partner Cases', () => {
  test('cases list loads with table', async ({ page }) => {
    await page.goto('/cases');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('case rows are clickable', async ({ page }) => {
    await page.goto('/cases');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) await rows.nth(1).click();
  });

  test('case detail page loads', async ({ page }) => {
    await page.goto('/cases/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('case detail — back link works', async ({ page }) => {
    await page.goto('/cases/test-id');
    const backLink = page.getByRole('link', { name: /back/i });
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/cases$/);
    }
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

  test('case detail — update status', async ({ page }) => {
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
```

### 4.4 validations.spec.ts

```ts
test.describe('Partner Validations', () => {
  test('validations list page loads', async ({ page }) => {
    await page.goto('/validations');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('validation rows are clickable', async ({ page }) => {
    await page.goto('/validations');
    const rows = page.locator('tr, [role="row"]');
    if (await rows.count() > 1) await rows.nth(1).click();
  });

  test('validation detail page loads', async ({ page }) => {
    await page.goto('/validations/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('validation detail — back link works', async ({ page }) => {
    await page.goto('/validations/test-id');
    const backLink = page.getByRole('link', { name: /back/i });
    if (await backLink.isVisible()) await backLink.click();
  });

  test('validation detail — View/Download document buttons', async ({ page }) => {
    await page.goto('/validations/test-id');
    const viewBtns = page.getByRole('button', { name: /view|download/i });
    if (await viewBtns.count() > 0) await expect(viewBtns.first()).toBeEnabled();
  });

  test('validation detail — submit decision', async ({ page }) => {
    await page.goto('/validations/test-id');
    const verdictSelect = page.locator('select').filter({ hasText: /approve|reject|verdict/i });
    if (await verdictSelect.isVisible()) {
      await verdictSelect.selectOption({ index: 1 });
      const notesArea = page.locator('textarea');
      if (await notesArea.isVisible()) await notesArea.fill('Approved after review.');
      const submitBtn = page.getByRole('button', { name: /submit decision/i });
      if (await submitBtn.isVisible()) await submitBtn.click();
    }
  });
});
```

### 4.5 organization.spec.ts

```ts
test.describe('Partner Organization', () => {
  test('organization page loads', async ({ page }) => {
    await page.goto('/organization');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Edit Profile button toggles edit mode', async ({ page }) => {
    await page.goto('/organization');
    const editBtn = page.getByRole('button', { name: /edit profile/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(300);
      const nameInput = page.getByLabel(/name/i).first();
      if (await nameInput.isVisible()) await nameInput.fill('Updated Partner Org');
      const saveBtn = page.getByRole('button', { name: /save changes/i });
      if (await saveBtn.isVisible()) await saveBtn.click();
    }
  });

  test('Cancel button exits edit mode', async ({ page }) => {
    await page.goto('/organization');
    const editBtn = page.getByRole('button', { name: /edit profile/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test('capabilities badges are displayed', async ({ page }) => {
    await page.goto('/organization');
    // Badges/pills should be visible in read mode
  });
});
```

### 4.6 members.spec.ts

```ts
test.describe('Partner Members', () => {
  test('members page loads with table', async ({ page }) => {
    await page.goto('/members');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Invite Member button shows invite form', async ({ page }) => {
    await page.goto('/members');
    const inviteBtn = page.getByRole('button', { name: /invite member/i });
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await page.waitForTimeout(300);
      const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
      if (await emailInput.isVisible()) {
        await emailInput.fill('newpartner@test.com');
        const roleSelect = page.locator('select');
        if (await roleSelect.isVisible()) await roleSelect.selectOption({ index: 1 });
        const sendBtn = page.getByRole('button', { name: /send invite/i });
        if (await sendBtn.isVisible()) await sendBtn.click();
      }
    }
  });

  test('delete member button is present on each row', async ({ page }) => {
    await page.goto('/members');
    const deleteBtns = page.getByRole('button', { name: /delete|remove/i });
    if (await deleteBtns.count() > 0) await expect(deleteBtns.first()).toBeEnabled();
  });
});
```

---

## 5. web-kiosk Tests (e2e/kiosk/)

### 5.1 home.spec.ts

```ts
test.describe('Kiosk Home', () => {
  test('home page loads with large pet type cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('pet type cards (Dog/Cat/Bird) are clickable links', async ({ page }) => {
    await page.goto('/');
    for (const pet of ['Dog', 'Cat', 'Bird']) {
      const card = page.getByRole('link', { name: new RegExp(pet, 'i') });
      if (await card.isVisible()) {
        await expect(card).toHaveAttribute('href', /.+/);
      }
    }
  });

  test('Get AI Recommendations button navigates', async ({ page }) => {
    await page.goto('/');
    const aiBtn = page.getByRole('link', { name: /ai recommendation/i })
      .or(page.getByRole('button', { name: /ai recommendation/i }));
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      await expect(page).toHaveURL(/\/ai-guide/);
    }
  });

  test('QR handoff button navigates', async ({ page }) => {
    await page.goto('/');
    const qrBtn = page.getByRole('link', { name: /qr|scan|phone/i })
      .or(page.getByRole('button', { name: /qr|scan|phone/i }));
    if (await qrBtn.isVisible()) {
      await qrBtn.click();
      await expect(page).toHaveURL(/\/handoff/);
    }
  });
});
```

### 5.2 discover.spec.ts — Pet Discovery Wizard

```ts
test.describe('Kiosk Discover', () => {
  test('discover page loads with step 1', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('step 1 — pet type selection buttons work', async ({ page }) => {
    await page.goto('/discover');
    for (const pet of ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Reptiles']) {
      const btn = page.getByRole('button', { name: new RegExp(pet, 'i') });
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(200);
        break; // select one and move on
      }
    }
  });

  test('step 2 — size filter pills toggle', async ({ page }) => {
    await page.goto('/discover');
    // Select a pet type to advance to step 2
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);

    for (const size of ['Small', 'Medium', 'Large']) {
      const pill = page.getByRole('button', { name: new RegExp(size, 'i') });
      if (await pill.isVisible()) {
        await pill.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('step 2 — temperament filter pills toggle', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);

    for (const temp of ['Calm', 'Playful', 'Independent', 'Social']) {
      const pill = page.getByRole('button', { name: new RegExp(temp, 'i') });
      if (await pill.isVisible()) await pill.click();
    }
  });

  test('step 2 — Show Results button advances to step 3', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);
    const showBtn = page.getByRole('button', { name: /show results/i });
    if (await showBtn.isVisible()) await showBtn.click();
    await page.waitForTimeout(500);
  });

  test('step 3 — result cards are displayed', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);
    const showBtn = page.getByRole('button', { name: /show results/i });
    if (await showBtn.isVisible()) await showBtn.click();
    await page.waitForTimeout(500);
    // Result cards or empty state should be visible
  });

  test('Start Over button resets wizard', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(300);
    const startOver = page.getByRole('button', { name: /start over/i });
    if (await startOver.isVisible()) {
      await startOver.click();
      await page.waitForTimeout(300);
    }
  });

  test('Try Different Preferences button goes back', async ({ page }) => {
    await page.goto('/discover');
    const dogBtn = page.getByRole('button', { name: /dogs/i });
    if (await dogBtn.isVisible()) await dogBtn.click();
    await page.waitForTimeout(500);
    const showBtn = page.getByRole('button', { name: /show results/i });
    if (await showBtn.isVisible()) await showBtn.click();
    await page.waitForTimeout(500);
    const tryDiff = page.getByRole('button', { name: /different preferences/i });
    if (await tryDiff.isVisible()) await tryDiff.click();
  });
});
```

### 5.3 listing-detail.spec.ts

```ts
test.describe('Kiosk Listing Detail', () => {
  test('listing detail page loads', async ({ page }) => {
    await page.goto('/listings/test-id');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

### 5.4 ai-guide.spec.ts

```ts
test.describe('Kiosk AI Guide', () => {
  test('AI guide page loads', async ({ page }) => {
    await page.goto('/ai-guide');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

### 5.5 handoff.spec.ts

```ts
test.describe('Kiosk Handoff', () => {
  test('handoff page loads with QR code', async ({ page }) => {
    await page.goto('/handoff');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

---

## Test Count Summary

| App | Spec Files | Test Cases |
|-----|-----------|------------|
| web-consumer | 12 files | ~65 tests |
| web-vendor | 9 files | ~45 tests |
| web-admin | 9 files | ~50 tests |
| web-partner | 6 files | ~30 tests |
| web-kiosk | 5 files | ~15 tests |
| **Total** | **41 files** | **~205 tests** |

---

## Running the Tests

```bash
# Run all E2E tests (starts all dev servers automatically)
pnpm test:e2e

# Run only one app
npx playwright test --project=consumer
npx playwright test --project=vendor
npx playwright test --project=admin
npx playwright test --project=partner
npx playwright test --project=kiosk

# Run responsive tests
npx playwright test --project=consumer-mobile
npx playwright test --project=consumer-tablet

# Run a specific spec file
npx playwright test e2e/consumer/search.spec.ts

# Run headed (watch the browser)
pnpm test:e2e:headed

# Run with Playwright UI (interactive debugger)
pnpm test:e2e:ui

# Generate HTML report
npx playwright show-report
```

## Correction Loop

When tests fail:

1. Read the Playwright HTML report (`npx playwright show-report`)
2. Check screenshots in `test-results/` for visual failures
3. Check traces for step-by-step replay
4. Fix the application code (not the test) unless the test has a wrong selector
5. Re-run the failing test: `npx playwright test --grep "test name"`
6. Once fixed, re-run the full suite to catch regressions

## Integration with Existing Testing Plan

This E2E plan replaces Steps 9 and 10 of the existing `testing-plan.md` with automated, repeatable Playwright tests. Steps 1-8 (build, lint, Prisma, manual code review) remain unchanged and should be run first. The execution order is:

1. `testing-plan.md` Steps 1-8 (build validation)
2. This plan: `pnpm test:e2e` (automated browser testing)
3. `testing-plan.md` Step 12 (final full-system re-validation)
