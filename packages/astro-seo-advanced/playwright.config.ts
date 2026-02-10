import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Where Playwright looks for test files
  testDir: './tests',

  // Run tests sequentially in CI for stability
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI
  retries: process.env.CI ? 1 : 0,

  // Use the HTML reporter for nice visual output
  reporter: 'html',

  use: {
    // Base URL for all tests — the Astro dev server
    baseURL: 'http://localhost:4321',
  },

  // Only run in Chromium to keep things fast
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],

  // Start the Astro fixture dev server before running tests
  webServer: {
    command: 'pnpm astro dev --root ./tests/fixtures',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    // Give Astro time to start up (first run may be slower)
    timeout: 60_000,
  },
})
