/**
 * Profile: the signed-in user's own record, their platform settings and the
 * roles/policies they hold.
 */

import { test, expect, config, flag, unique } from '../fixtures';
import { signIn } from '../fixtures/auth';
import {
  cardOf,
  meetsPasswordPolicy,
  userSettingsLoaded,
  userSettingsSaved,
} from '../pages/profile';

test.describe('profile', () => {
  test('the header, info card, settings and memberships all render', async ({
    shell,
    page,
    t,
  }) => {
    await shell.open('profile');

    await expect(page.getByRole('heading', { name: t('userprofile.info') })).toBeVisible();
    await expect(page.getByRole('heading', { name: t('userprofile.title') })).toBeVisible();
    await expect(page.getByRole('heading', { name: t('role.title') })).toBeVisible();

    // The administrator holds Administrator and Manager (Security DBInitializer).
    await expect(
      cardOf(page, 'user-part-of').getByText(t('roles.administrator'), { exact: true })
    ).toBeVisible();
  });

  test('editing the profile name persists across a reload', async ({
    shell,
    page,
    t,
    cleanup,
  }) => {
    await shell.open('profile');

    // The configurator drawer is always mounted and carries its own Save, so the
    // profile's button has to be taken from the card it belongs to.
    const infoCard = cardOf(page, 'profile-info');
    const secondName = infoCard.locator('#secondName');
    await expect(infoCard.locator('#firstName')).not.toHaveValue('', { timeout: 30_000 });
    const original = await secondName.inputValue();
    cleanup.add('profile second name', async () => {
      await shell.open('profile');
      await cardOf(page, 'profile-info').locator('#secondName').fill(original);
      await cardOf(page, 'profile-info').getByRole('button', { name: t('generic.save') }).click();
    });

    const changed = `E2E ${unique()}`;
    await secondName.fill(changed);
    const saved = page.waitForResponse(
      (response) => (response.request().postData() ?? '').includes('UpdateCurrentUser'),
      { timeout: 60_000 }
    );
    await infoCard.getByRole('button', { name: t('generic.save') }).click();
    await saved;

    await shell.reloadTo('profile');
    await expect(cardOf(page, 'profile-info').locator('#secondName')).toHaveValue(changed, {
      timeout: 45_000,
    });
  });

  test('the profile refuses an empty first name', async ({ shell, page, t }) => {
    await shell.open('profile');
    const infoCard = cardOf(page, 'profile-info');
    const firstName = infoCard.locator('#firstName');
    await expect(firstName).not.toHaveValue('', { timeout: 30_000 });

    const original = await firstName.inputValue();
    await firstName.fill('');
    await infoCard.getByRole('button', { name: t('generic.save') }).click();

    await expect(infoCard.locator('#firstName-helper-text')).toBeVisible();
    await firstName.fill(original);
  });

  test('the password dialog refuses a mismatched confirmation', async ({ shell, page, t }) => {
    await shell.open('profile');

    await page.getByText('lock', { exact: true }).click();
    const dialog = page.getByTestId('dialog-form');
    await expect(dialog).toBeVisible();

    await dialog.locator('#password').fill('E2eChanged9');
    await dialog.locator('#confirmPassword').fill('E2eDifferent9');
    await dialog.getByRole('button', { name: t('generic.save') }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#confirmPassword-helper-text')).toBeVisible();
    await dialog.getByRole('button', { name: t('generic.cancel') }).click();
  });

  test('the password dialog refuses a password below the platform policy', async ({
    shell,
    page,
    t,
  }) => {
    await shell.open('profile');
    await page.getByText('lock', { exact: true }).click();
    const dialog = page.getByTestId('dialog-form');
    await expect(dialog).toBeVisible();

    await dialog.locator('#password').fill('12345678');
    await dialog.locator('#confirmPassword').fill('12345678');
    await dialog.getByRole('button', { name: t('generic.save') }).click();

    // Eight characters is not enough: the policy also wants an upper-case
    // letter, a lower-case letter and a digit.
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#password-helper-text')).toHaveText(
      t('validation.passwordComplexity', { field: 'password' })
    );
    await dialog.getByRole('button', { name: t('generic.cancel') }).click();
  });

  test('the password can be changed and used to sign in, then changed back', async ({
    shell,
    page,
    anonPage,
    t,
  }) => {
    // Changing the shared administrator's password is a ONE-WAY door unless the
    // configured password itself satisfies the platform policy: the policy is
    // enforced by the Security validator as well as the form, so a password that
    // does not meet it (the seeded `12345678` does not) can never be set back
    // through any surface, and every later run would fail to sign in. The test
    // therefore runs only when the environment opts in AND the password it would
    // have to restore is one the platform will accept.
    test.skip(
      !flag('E2E_ALLOW_PASSWORD_CHANGE') || !meetsPasswordPolicy(config.credentials.admin.password),
      'Set E2E_ALLOW_PASSWORD_CHANGE=1 with an E2E_ADMIN_PASSWORD that meets the platform policy (8+ chars, upper, lower, digit) — otherwise the change cannot be undone.'
    );

    const temporary = 'E2eTemporary9';
    await shell.open('profile');

    const change = async (value: string): Promise<void> => {
      await page.getByText('lock', { exact: true }).click();
      const dialog = page.getByTestId('dialog-form');
      await expect(dialog).toBeVisible();
      await dialog.locator('#password').fill(value);
      await dialog.locator('#confirmPassword').fill(value);
      await dialog.getByRole('button', { name: t('generic.save') }).click();
      await expect(dialog).toBeHidden({ timeout: 45_000 });
    };

    await change(temporary);
    try {
      const result = await signIn(anonPage, {
        email: config.credentials.admin.email,
        password: temporary,
      });
      expect(result.error ?? '').toBe('');
      expect(result.ok).toBe(true);
    } finally {
      // Restore whatever happened: every other spec signs in with this password.
      await change(config.credentials.admin.password);
    }
  });

  test('switching the language changes the UI and survives a reload', async ({
    shell,
    page,
    t,
    lang,
  }) => {
    const loaded = userSettingsLoaded(page);
    await shell.open('profile');
    await loaded;
    // Anchored on the language control itself, not on the card's heading: the
    // heading is one of the strings that changes when the language does, and a
    // locator built from it would stop resolving mid-test.
    const settingsCard = page.getByTestId('card-platform-settings');

    const target = lang === 'es' ? 'en' : 'es';
    const language = settingsCard.locator('#language');
    await expect(language).toBeVisible();
    const original = (await language.innerText()).trim();

    await language.click();
    await page.getByRole('option', { name: target, exact: true }).click();
    // Choosing the language re-renders the UI immediately, so the Save button is
    // already labelled in the NEW language by the time it is clicked.
    await settingsCard.getByRole('button', { name: /Save|Guardar/ }).click();

    // The switch is immediate: the sidenav re-renders in the new language.
    const dashboardInTarget = target === 'es' ? 'Tablero' : 'Dashboard';
    await expect(page.getByTestId('nav-dashboard')).toContainText(dashboardInTarget, {
      timeout: 30_000,
    });

    await shell.reloadTo('profile');
    const reloadedCard = page.getByTestId('card-platform-settings');
    await expect(reloadedCard.locator('#language')).toHaveText(target);

    // Put the account back the way it was found. The Save label is now in the
    // language just switched to, so both spellings are accepted.
    await reloadedCard.locator('#language').click();
    await page.getByRole('option', { name: original, exact: true }).click();
    await reloadedCard.getByRole('button', { name: /Save|Guardar/ }).click();
    await expect(reloadedCard.locator('#language')).toHaveText(original);
  });

  test('the sidenav style preference persists across a reload', async ({ shell, page, t }) => {
    const loaded = userSettingsLoaded(page);
    await shell.open('profile');
    await loaded;

    const settingsCard = cardOf(page, 'platform-settings');
    const sidenavSwitch = settingsCard.getByRole('switch', { name: t('userprofile.sidenav') });
    await expect(sidenavSwitch).toBeVisible();
    const before = await sidenavSwitch.isChecked();

    await sidenavSwitch.click();
    const saved = userSettingsSaved(page);
    await settingsCard.getByRole('button', { name: t('generic.save') }).click();
    await saved;
    await expect(sidenavSwitch).toBeChecked({ checked: !before });

    const reloaded = userSettingsLoaded(page);
    await shell.reloadTo('profile');
    await reloaded;
    const after = cardOf(page, 'platform-settings').getByRole('switch', {
      name: t('userprofile.sidenav'),
    });
    await expect(after).toBeChecked({ checked: !before, timeout: 45_000 });

    // Restore.
    await after.click();
    const restored = userSettingsSaved(page);
    await cardOf(page, 'platform-settings')
      .getByRole('button', { name: t('generic.save') })
      .click();
    await restored;
    await expect(after).toBeChecked({ checked: before });
  });
});
