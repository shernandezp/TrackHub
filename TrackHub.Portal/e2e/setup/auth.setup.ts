/**
 * Signs every role in once. The portal throttles sign-in (3 attempts / 30 s in
 * `AuthContext.login`), so credentials are typed here and nowhere else. Manager
 * and User roles missing from `.env.e2e` are created through the Account
 * Management screens and recorded in `e2e/.auth/created.json` for teardown.
 */

import fs from 'node:fs';
import { test as setup, expect } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { AUTH_DIR, config, storageStatePath } from '../fixtures/env';
import type { RoleName } from '../fixtures/env';
import { authFiles, captureTokens, persistRole, signIn, writeCreated, writeRefusals } from '../fixtures/auth';
import type { CreatedPrincipal, Credentials, Refusals } from '../fixtures/auth';
import { translate } from '../fixtures/i18n';
import { uniqueEmail } from '../fixtures/data';

const CREATED_PASSWORD = 'E2eTestPass1';
const t = (key: string, vars?: Record<string, string | number>) => translate(key, 'en', vars);

setup.describe.configure({ mode: 'serial' });

/**
 * Returns the AuthorityServer's rejection text instead of throwing, so a principal
 * that cannot sign in is recorded with its reason rather than crashing setup.
 */
async function establish(
  browser: Browser,
  role: RoleName,
  credentials: Credentials
): Promise<string | null> {
  const context = await browser.newContext({
    baseURL: config.baseURL,
    ignoreHTTPSErrors: true,
    viewport: { width: 1600, height: 1000 },
  });
  const page = await context.newPage();
  try {
    const tokens = captureTokens(page);
    const result = await signIn(page, credentials);
    if (!result.ok) return result.error ?? 'sign-in was refused';
    // The token exchange resolves a beat after /dashboard renders.
    await expect.poll(() => tokens() !== null, { timeout: 20_000 }).toBe(true);
    persistRole(role, tokens());
    await context.storageState({ path: storageStatePath(role) });
    return null;
  } finally {
    await context.close();
  }
}

/**
 * A deep link cannot be typed: the token lives in memory and the callback page
 * navigates to `/dashboard` regardless. The sidenav click keeps the token.
 */
async function openScreen(page: Page, navKey: string, path: string): Promise<void> {
  await page.goto('/dashboard');
  await expect(page.getByTestId('nav-dashboard')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId(`nav-${navKey}`).click();
  await page.waitForURL(`**${path}`);
}

async function openSection(page: Page, key: string): Promise<void> {
  // Retried: expanding a section above this one reflows the page, and a header
  // that moves out from under the pointer mid-click swallows the toggle.
  const header = page.getByTestId(`section-${key}-header`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await header.getAttribute('aria-expanded')) === 'true') return;
    await header.click();
    try {
      await expect(header).toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 });
      return;
    } catch {
      // Fall through and try again.
    }
  }
  await expect(header).toHaveAttribute('aria-expanded', 'true');
}

async function createUser(
  page: Page,
  email: string,
  username: string,
  roleLabel: string
): Promise<string> {
  await openScreen(page, 'manageAdmin', '/manageAdmin');
  await openSection(page, 'users');
  await page.getByTestId('section-users-add').click();

  const dialog = page.getByTestId('dialog-form');
  await expect(dialog).toBeVisible();
  await dialog.locator('#emailAddress').fill(email);
  await dialog.locator('#password').fill(CREATED_PASSWORD);
  await dialog.locator('#username').fill(username);
  await dialog.locator('#firstName').fill('E2E');
  await dialog.locator('#lastName').fill(roleLabel);
  await dialog.getByRole('button', { name: t('generic.save') }).click();
  await expect(dialog).toBeHidden();

  await page.getByTestId('section-users').getByRole('textbox').first().fill(email);
  const row = page.locator('[data-testid^="row-"]').filter({ hasText: email }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  const userId = (await row.getAttribute('data-testid'))!.replace('row-', '');

  // A user with no role holds none of the mandatory baseline pairs, so the
  // shell it signs into would be broken rather than merely limited.
  await openSection(page, 'roles');
  const roleRow = page
    .getByTestId('section-roles')
    .locator('[data-testid^="row-"]')
    .filter({ hasText: roleLabel })
    .first();
  await roleRow.getByRole('button', { name: t('generic.assign') }).click();
  const allocator = page.getByTestId('dialog-dynamic-table');
  await expect(allocator).toBeVisible();
  await allocator.getByRole('combobox').click();
  await page.getByRole('option', { name: username, exact: true }).click();
  await allocator.getByRole('button', { name: t('generic.add') }).click();
  await expect(allocator.getByText(username)).toBeVisible({ timeout: 20_000 });
  await allocator.getByRole('button', { name: t('generic.close') }).click();

  return userId;
}

setup('administrator signs in and the session is recorded', async ({ browser }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  for (const role of ['admin', 'manager', 'user'] as RoleName[]) {
    // A stale state from a previous run would hide a provisioning failure.
    if (fs.existsSync(storageStatePath(role))) fs.rmSync(storageStatePath(role));
  }
  if (fs.existsSync(authFiles.refusalsFile)) fs.rmSync(authFiles.refusalsFile);
  const refusal = await establish(browser, 'admin', config.credentials.admin);
  expect(refusal, `the administrator could not sign in: ${refusal}`).toBeNull();
  expect(fs.existsSync(storageStatePath('admin'))).toBe(true);
});

setup('manager and user roles exist and sign in', async ({ browser }) => {
  const created: CreatedPrincipal[] = [];

  const provision = async (role: RoleName, roleLabel: string): Promise<Credentials | null> => {
    const configured = config.credentials[role as 'manager' | 'user'];
    if (configured?.email && configured.password) return configured;

    const context = await browser.newContext({
      baseURL: config.baseURL,
      ignoreHTTPSErrors: true,
      storageState: storageStatePath('admin'),
      viewport: { width: 1600, height: 1000 },
    });
    const page = await context.newPage();
    try {
      const email = uniqueEmail(role);
      const username = email.split('@')[0];
      const userId = await createUser(page, email, username, roleLabel);
      created.push({ role, userId, email, username, password: CREATED_PASSWORD });
      return { email, password: CREATED_PASSWORD };
    } finally {
      await context.close();
    }
  };

  const refusals: Refusals = {};
  for (const [role, label] of [
    ['manager', t('roles.manager')],
    ['user', t('roles.user')],
  ] as [RoleName, string][]) {
    const credentials = await provision(role, label);
    if (!credentials) continue;
    const refusal = await establish(browser, role, credentials);
    if (refusal) refusals[role] = refusal;
  }

  writeCreated(created);
  writeRefusals(refusals);

  // Recorded, not thrown: failing here would take the whole suite's setup dependency with it and
  // skip every test that does not need these roles. The specs that DO need them fail instead.
  for (const [role, refusal] of Object.entries(refusals)) {
    console.log(`[setup] the ${role} principal exists but cannot sign in: ${refusal}`);
  }
});
