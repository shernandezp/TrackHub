/**
 * The suite's `test` export: Playwright's, plus the fixtures every spec needs.
 *
 * - `t` resolves a translation key in the language the current PROJECT drives
 *   the UI in, so one test body runs in English and Spanish unchanged.
 * - `api` is the seeding/cleanup client (worker-scoped: one token per worker).
 * - `cleanup` is the per-test undo registry, drained after the test whether it
 *   passed or failed.
 * - `shell`, `form`, `confirm`, `message`, `allocator` are the shared page
 *   objects; `sectionOf` addresses any `TableAccordion` by its key.
 * - `managerPage`, `userPage`, `anonPage` open a second browser context for the
 *   role/gate tests without re-typing credentials.
 */

import { test as base, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { ApiClient } from './api';
import { CleanupRegistry } from './data';
import { config, storageStatePath } from './env';
import type { RoleName } from './env';
import { authFiles } from './auth';
import { translatorFor } from './i18n';
import type { Language, Translator } from './i18n';
import { Shell } from '../pages/shell';
import { Section } from '../pages/tableAccordion';
import { AllocatorDialog, ConfirmDialog, FormDialog, MessageDialog } from '../pages/dialogs';

export interface E2EFixtures {
  lang: Language;
  t: Translator;
  cleanup: CleanupRegistry;
  shell: Shell;
  form: FormDialog;
  confirm: ConfirmDialog;
  message: MessageDialog;
  allocator: AllocatorDialog;
  sectionOf: (key: string) => Section;
  managerPage: Page;
  userPage: Page;
  anonPage: Page;
}

export interface E2EWorkerFixtures {
  api: ApiClient;
}

/** Opens a second context for another role, or skips the test when it has none. */
async function contextForRole(
  browser: import('@playwright/test').Browser,
  role: RoleName
): Promise<BrowserContext> {
  if (!authFiles.hasRole(role)) {
    // A specific skip beats a silent pass: the message names what is missing.
    base.skip(true, `No stored session for the "${role}" role — set E2E_${role.toUpperCase()}_EMAIL/PASSWORD or let setup create one.`);
  }
  return browser.newContext({
    baseURL: config.baseURL,
    ignoreHTTPSErrors: true,
    storageState: storageStatePath(role),
    viewport: { width: 1600, height: 1000 },
  });
}

export const test = base.extend<E2EFixtures, E2EWorkerFixtures>({
  lang: async ({}, use, testInfo) => {
    await use(testInfo.project.name.endsWith('-es') ? 'es' : 'en');
  },

  t: async ({ lang }, use) => {
    await use(translatorFor(lang));
  },

  api: [
    async ({}, use) => {
      const client = new ApiClient('admin');
      await use(client);
      await client.dispose();
    },
    { scope: 'worker' },
  ],

  cleanup: async ({}, use, testInfo) => {
    const registry = new CleanupRegistry();
    await use(registry);
    const failures = await registry.runAll();
    if (failures.length > 0) {
      // Loud, but not a failure of the test that already made its point: the
      // global teardown sweep is the second line of defence.
      testInfo.annotations.push({ type: 'cleanup-failure', description: failures.join(' | ') });
      console.log(`[cleanup] ${testInfo.title}: ${failures.join(' | ')}`);
    }
  },

  shell: async ({ page, t }, use) => {
    await use(new Shell(page, t));
  },

  form: async ({ page, t }, use) => {
    await use(new FormDialog(page, t));
  },

  confirm: async ({ page, t }, use) => {
    await use(new ConfirmDialog(page, t));
  },

  message: async ({ page, t }, use) => {
    await use(new MessageDialog(page, t));
  },

  allocator: async ({ page, t }, use) => {
    await use(new AllocatorDialog(page, t));
  },

  sectionOf: async ({ page, t }, use) => {
    await use((key: string) => new Section(page, key, t));
  },

  managerPage: async ({ browser }, use) => {
    const context = await contextForRole(browser, 'manager');
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const context = await contextForRole(browser, 'user');
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  anonPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: config.baseURL,
      ignoreHTTPSErrors: true,
      viewport: { width: 1600, height: 1000 },
      // `browser.newContext()` inherits the project's `use` options, and this
      // project signs in as the administrator — an anonymous context has to opt
      // out explicitly or it is not anonymous at all.
      storageState: undefined,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
export { Section } from '../pages/tableAccordion';
export { PermissionMatrix } from '../pages/dialogs';
export * from './data';
export { config, flag, optional, e2eEnv } from './env';
