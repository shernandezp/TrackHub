/**
 * Authentication: the real OAuth 2.0 authorization-code + PKCE flow against the
 * deployed AuthorityServer. No mocks — a stubbed identity provider would prove
 * nothing about the one flow every other spec depends on.
 */

import { test, expect, config } from '../fixtures';
import { loginForm, signIn, tokenExchange } from '../fixtures/auth';

test.describe('authentication', () => {
  test('the seeded administrator signs in and lands on the dashboard', async ({ anonPage, t }) => {
    const result = await signIn(anonPage, config.credentials.admin);

    expect(result.error ?? '').toBe('');
    expect(result.ok).toBe(true);
    await expect(anonPage).toHaveURL(/\/dashboard$/);
    await expect(anonPage.getByTestId('nav-dashboard')).toBeVisible();
    await expect(anonPage.getByRole('button', { name: t('help.open') })).toBeVisible();
  });

  test('a wrong password is refused on the login page and the account still works', async ({
    anonPage,
  }) => {
    const form = loginForm(anonPage);
    await anonPage.goto('/dashboard');
    await expect(form.email).toBeVisible({ timeout: 60_000 });

    await form.email.fill(config.credentials.admin.email);
    await form.password.fill('definitely-not-the-password');
    await form.submit.click();

    await expect(form.error).toBeVisible();
    await expect(form.error).toHaveText(/incorrect/i);
    // The AuthorityServer re-renders its own page; the portal is never reached.
    await expect(anonPage).toHaveURL(/\/Identity\/login/i);
    await expect(anonPage.getByTestId('nav-dashboard')).toHaveCount(0);

    // Five failures lock the account for 15 minutes (`GetUsersQuery`), and this
    // suite shares the seeded administrator — so the failed attempt is cleared
    // by a successful one before leaving.
    const exchanged = tokenExchange(anonPage);
    await form.email.fill(config.credentials.admin.email);
    await form.password.fill(config.credentials.admin.password);
    await form.submit.click();
    await exchanged;
    await expect(anonPage.getByTestId('nav-dashboard')).toBeVisible({ timeout: 60_000 });
  });

  test('signing off ends the session and returns to the login page', async ({ page, shell }) => {
    await shell.enter();
    await shell.signOff();

    // logoff() revokes the token, drops the AuthorityServer cookie and restarts
    // the flow, which now has no session to reuse.
    await expect(loginForm(page).email).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('nav-dashboard')).toHaveCount(0);
  });

  test('a deep link opened while signed out returns to the requested screen after signing in', async ({
    anonPage,
  }) => {
    const form = loginForm(anonPage);
    await anonPage.goto('/manageAdmin');
    await expect(form.email).toBeVisible({ timeout: 60_000 });

    const exchanged = tokenExchange(anonPage);
    await form.email.fill(config.credentials.admin.email);
    await form.password.fill(config.credentials.admin.password);
    await form.submit.click();
    await exchanged;

    await expect(anonPage.getByTestId('nav-dashboard')).toBeVisible({ timeout: 60_000 });
    await expect(anonPage).toHaveURL(/\/manageAdmin$/);
  });

  test('the platform status page renders without signing in', async ({ anonPage, t }) => {
    await anonPage.goto('/status');

    await expect(anonPage.getByRole('heading', { name: t('platformStatus.title') })).toBeVisible();
    await expect(anonPage.getByTestId('service-tile').first()).toBeVisible();
    // No shell, and no bounce into the login flow.
    await expect(anonPage.getByTestId('nav-dashboard')).toHaveCount(0);
    await expect(anonPage).toHaveURL(/\/status$/);
  });
});
