import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Runs both Workers locally (static site + headers, and the API behind the service binding).
    // Cloudflare's always-pass test key turns on the API form; the browser tests stub Turnstile.
    command: `astro build && wrangler dev -c wrangler.jsonc -c ../api/wrangler.jsonc --port ${PORT}`,
    env: { PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA', WRANGLER_SEND_METRICS: 'false' },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
