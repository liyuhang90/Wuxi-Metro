import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testMatch: 'search.browser.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'pnpm docs:preview --port 4173', url: 'http://localhost:4173/', reuseExistingServer: false },
    { command: 'pnpm exec vitepress preview tests/fixtures --port 4174', url: 'http://localhost:4174/metro-test/', reuseExistingServer: false },
    { command: 'pnpm docs:dev --port 4175', url: 'http://localhost:4175/', reuseExistingServer: false }
  ]
})
