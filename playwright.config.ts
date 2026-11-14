import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://127.0.0.1:4000/api/v1/health/live',
      reuseExistingServer: true,
      timeout: 30000,
      env: {
        ALLOW_IN_MEMORY_FALLBACK: 'true',
        NODE_ENV: 'development',
      },
    },
    {
      command: 'npm run dev:web',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
