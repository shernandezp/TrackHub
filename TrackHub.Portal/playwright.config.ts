/**
 * Playwright configuration for the portal's end-to-end suite (spec 30).
 *
 * The suite drives the REAL portal against the REAL stack — no mocked backends.
 * `page.route` appears in exactly one place, and only to break a health probe on
 * purpose so the status page's outage state can be asserted.
 */

import { defineConfig, devices } from '@playwright/test';
import { config, storageStatePath } from './e2e/fixtures/env';

const reuseServer = process.env.E2E_REUSE_SERVER === '1';

export default defineConfig({
  testDir: './e2e/specs',
  outputDir: './test-results',
  globalTeardown: './e2e/global-teardown.ts',
  // Screens fan out to several services; a cold first render on a freshly started
  // stack is slow, and a timeout there says nothing about the behaviour under test.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  // One worker against one shared account: parallel workers would race on the
  // same rows (a `Created` trip holds the unit's arming slot — spec 11b).
  fullyParallel: false,
  workers: 1,
  // A flaky test is a bug, not something to retry away.
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: config.baseURL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    // `datetime-local` holds LOCAL wall time and the portal shifts it by the
    // viewer's offset in both directions (rules item 14). Pinning the browser to
    // UTC keeps a typed ISO instant and the value read back identical.
    timezoneId: 'UTC',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e/setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /99-i18n\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
        storageState: storageStatePath('admin'),
      },
    },
    {
      // Same flows, Spanish UI. The spec itself switches the signed-in user's
      // saved language and restores it; E2E_LANG tells the selectors which
      // bundle to resolve against.
      name: 'chromium-es',
      dependencies: ['setup'],
      testMatch: /99-i18n\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
        storageState: storageStatePath('admin'),
        locale: 'es-ES',
      },
    },
  ],
  webServer: reuseServer
    ? undefined
    : {
        command: 'npm start',
        url: config.baseURL,
        reuseExistingServer: true,
        ignoreHTTPSErrors: true,
        timeout: 180_000,
      },
});
