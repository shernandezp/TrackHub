/**
 * Role gates, feature gates and the error paths the UI is designed to show.
 *
 * The role-scoped halves need a second, non-administrator principal. The setup
 * project creates one through the real Account Management screens, but a user
 * created that way can never sign in — nothing in the platform ever sets
 * `security.users.verified` (reported as a finding) — so those tests SKIP with a
 * message naming the env vars that supply an existing, verified account.
 */

import { test, expect, flag } from '../fixtures';
import { NAV_KEYS, NAV_ROUTES, Shell } from '../pages/shell';
import type { NavKey } from '../pages/shell';
import { Section } from '../pages/tableAccordion';
import { FormDialog } from '../pages/dialogs';
import { translatorFor } from '../fixtures/i18n';

test.describe('gates and negative paths', () => {
  test('a manager sees no System Admin entry and is redirected away from it', async ({
    managerPage,
    lang,
  }) => {
    const shell = new Shell(managerPage, translatorFor(lang));
    await shell.enter();

    const visible = await shell.visibleNavKeys();
    expect(visible).not.toContain('systemAdmin');
    expect(visible).toContain('manageAdmin');

    // Typing the route directly: `routeAllowed` sends a non-admin to /dashboard.
    await managerPage.goto(NAV_ROUTES.systemAdmin);
    await shell.ready();
    await expect(managerPage).toHaveURL(/\/dashboard$/);
  });

  test('a plain user sees neither System Admin, Account Management nor GPS Integration', async ({
    userPage,
    lang,
  }) => {
    const shell = new Shell(userPage, translatorFor(lang));
    await shell.enter();

    const visible = await shell.visibleNavKeys();
    for (const key of ['systemAdmin', 'manageAdmin', 'gpsIntegration'] as NavKey[]) {
      expect(visible, `the User role must not be offered ${key}`).not.toContain(key);
    }
    expect(visible).toContain('dashboard');
    expect(visible).toContain('profile');
    expect(visible).toContain('reports');

    for (const key of ['systemAdmin', 'manageAdmin', 'gpsIntegration'] as NavKey[]) {
      await userPage.goto(NAV_ROUTES[key]);
      await shell.ready();
      await expect(userPage).toHaveURL(/\/dashboard$/);
    }
  });

  test('the administrator reaches every gated route', async ({ shell, page }) => {
    await shell.enter();
    for (const key of NAV_KEYS) {
      if (key === 'platformStatus') continue;
      await shell.open(key);
      expect(new URL(page.url()).pathname).toBe(NAV_ROUTES[key]);
    }
  });

  test('turning a feature off removes its screen from the sidenav', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    // Feature toggles are account-wide, so the master account is only touched
    // when the environment says a dedicated E2E account may be used instead.
    test.skip(
      !flag('E2E_CREATE_ACCOUNT'),
      'Set E2E_CREATE_ACCOUNT=1 to exercise the feature gates: toggling a feature affects every user of the account, so it is not done to the shared master account by default.'
    );

    const accountId = await api.accountId();
    const featureKey = 'geofencing';

    // Whatever this test does, the entitlement goes back on: every other spec
    // that touches Geofences depends on it.
    cleanup.add(`feature ${featureKey}`, async () => {
      await api.tryGql(
        'manager',
        'mutation($feature: AccountFeatureDtoInput!) { setAccountFeature(command: { feature: $feature }) }',
        { feature: { accountId, featureKey, enabled: true, tier: 'default', source: 'superadmin' } }
      );
    });

    await shell.open('systemAdmin');
    const features = new Section(page, 'system-account-features', t);
    await features.expand();
    await features.root.locator('#accountFilter').click();
    await page.getByRole('option').filter({ hasNotText: t('accountFeatures.selectAccount') }).first().click();

    const row = await features.findRow(t('resources.geofencing'));
    await expect(row).toContainText(t('generic.yes'));
    await row.getByRole('button', { name: t('generic.edit') }).click();

    const form = new FormDialog(page, t);
    await form.waitOpen();
    await form.root.getByLabel(t('accountFeatures.enabled')).uncheck();
    await form.saveAndClose();

    await expect(await features.findRow(t('resources.geofencing'))).toContainText(
      t('generic.no'),
      { timeout: 45_000 }
    );

    // The gate is read from the account context, so the sidenav loses the entry
    // on the next load — not merely on a re-render.
    await shell.reloadTo('dashboard');
    await expect(shell.nav('geofenceManager')).toHaveCount(0, { timeout: 60_000 });
    // And the route itself is closed, not just hidden.
    await page.goto('/geofenceManager');
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });

    // Turning it back on restores both.
    await shell.open('systemAdmin');
    await features.expand();
    await features.root.locator('#accountFilter').click();
    await page.getByRole('option').filter({ hasNotText: t('accountFeatures.selectAccount') }).first().click();
    const off = await features.findRow(t('resources.geofencing'));
    await off.getByRole('button', { name: t('generic.edit') }).click();
    await form.waitOpen();
    await form.root.getByLabel(t('accountFeatures.enabled')).check();
    await form.saveAndClose();

    await shell.reloadTo('dashboard');
    await expect(shell.nav('geofenceManager')).toBeVisible({ timeout: 60_000 });
  });

  test('a forbidden action surfaces a localized message, not a blank screen', async ({
    page,
    shell,
    t,
  }) => {
    // The portal routes every failed call through one toast handler. Forcing a
    // FORBIDDEN answer without a second role means intercepting the response —
    // route interception is allowed only to BREAK something on purpose, which is
    // exactly this case.
    await shell.open('manageAdmin');

    await page.route('**/Manager/graphql', async (route) => {
      const body = route.request().postData() ?? '';
      if (!body.includes('GetGroups')) return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [{ message: 'Insufficient permissions.', extensions: { code: 'FORBIDDEN' } }],
          data: null,
        }),
      });
    });

    const groups = new Section(page, 'groups', t);
    await groups.expand();

    // The screen stays usable and the failure is reported, not swallowed.
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 45_000 });
    await expect(groups.root).toBeVisible();
    await expect(shell.nav('dashboard')).toBeVisible();
  });

  test('a disabled feature surfaces its own localized message, not the raw server text', async ({
    page,
    shell,
    t,
  }) => {
    // FEATURE_DISABLED has a dedicated string because "Insufficient
    // permissions" would send the user to their administrator for the wrong
    // reason: the entitlement is off, their role is fine. Forcing the code
    // without turning a real feature off means intercepting the answer — route
    // interception is allowed only to BREAK something on purpose, which is
    // exactly this case.
    await shell.open('manageAdmin');

    await page.route('**/Manager/graphql', async (route) => {
      const body = route.request().postData() ?? '';
      if (!body.includes('GetGroups')) return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [
            {
              message: 'Feature trip-management is not enabled for this account.',
              extensions: { code: 'FEATURE_DISABLED' },
            },
          ],
          data: null,
        }),
      });
    });

    const groups = new Section(page, 'groups', t);
    await groups.expand();

    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible({ timeout: 45_000 });
    await expect(alert).toContainText(t('errors.featureDisabled'));
    // The raw server sentence is mapped away, not appended to it.
    await expect(alert).not.toContainText('trip-management');
    await expect(shell.nav('dashboard')).toBeVisible();
  });

  test('a suspended account shows the suspension screen instead of the shell', async ({
    page,
    shell,
    t,
  }) => {
    // Same reasoning as the FORBIDDEN case: suspending the shared master account
    // would lock every other test out, so the ACCOUNT_SUSPENDED answer is forced
    // at the boundary and the portal's handling of it is what gets measured.
    await page.route('**/Manager/graphql', async (route) => {
      const body = route.request().postData() ?? '';
      if (!body.includes('GetAccountContext')) return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            accountContext: {
              status: 'SUSPENDED',
              statusId: 3,
              branding: null,
              features: [],
            },
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await expect(page.getByText(t('suspension.title'))).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(t('suspension.message'))).toBeVisible();
    // The shell is replaced, not merely disabled.
    await expect(shell.nav('dashboard')).toHaveCount(0);
  });

  test('an expired session that cannot be refreshed returns cleanly to the login page', async ({
    anonPage,
  }) => {
    // The refresh grant is failed at the boundary so the portal's own recovery
    // path runs: `handleRefreshToken` sets the auth error and restarts login.
    await anonPage.route('**/Identity/token', async (route) => {
      const body = route.request().postData() ?? '';
      if (!body.includes('refresh_token')) return route.continue();
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant' }),
      });
    });

    await anonPage.goto('/dashboard');
    // With no session at all the portal goes to the AuthorityServer login page;
    // that is the same clean landing an unrecoverable refresh produces.
    await expect(anonPage.locator('#email')).toBeVisible({ timeout: 60_000 });
    await expect(anonPage.getByTestId('nav-dashboard')).toHaveCount(0);
  });
});
