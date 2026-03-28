import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 15_000,
  expect: { timeout: 5_000 },
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
});
