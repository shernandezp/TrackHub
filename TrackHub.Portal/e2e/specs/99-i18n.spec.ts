/**
 * The same shell and one CRUD flow, in Spanish.
 *
 * Runs under the `chromium-es` project, which binds the `t` fixture to the
 * Spanish bundle. The UI language is a per-user setting, so the first test
 * switches it and the last one puts it back — the account is left as found.
 *
 * The "no raw keys" check is exact rather than heuristic: every dotted token in
 * the visible text is looked up in the real key list, so a rendered `trips.board`
 * fails while `example.com` or `v1.1.0` do not.
 */

import { test, expect, uniqueName } from '../fixtures';
import { cardOf } from '../pages/profile';
import type { Page } from '@playwright/test';
import { CrudFlow } from '../pages/crud';
import { NAV_KEYS } from '../pages/shell';
import type { NavKey } from '../pages/shell';
import { allKeys } from '../fixtures/i18n';

const KEY_SET = new Set([...allKeys('en'), ...allKeys('es')]);
const DOTTED = /\b[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+\b/g;

/** Translation keys that leaked into the rendered text of a screen. */
async function leakedKeys(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return [...new Set(text.match(DOTTED) ?? [])].filter((token) => KEY_SET.has(token));
}

/**
 * Switches the signed-in user's language and saves it.
 *
 * `from` is not decoration: the settings card renders `en` as its initial state
 * and REPLACES it when the account's real preference arrives, so a switch made
 * before that lands is silently overwritten. Waiting for the stored value first
 * is what makes the change stick.
 */
async function setLanguage(page: Page, from: 'en' | 'es', to: 'en' | 'es'): Promise<void> {
  const card = cardOf(page, 'platform-settings');
  await expect(card.locator('#language')).toHaveText(from, { timeout: 60_000 });

  await card.locator('#language').click();
  await page.getByRole('option', { name: to, exact: true }).click();
  await card.getByRole('button', { name: /Save|Guardar/ }).click();
  await expect(card.locator('#language')).toHaveText(to);
}

test.describe.configure({ mode: 'serial' });

test.describe('spanish', () => {
  test('the account language switches to Spanish', async ({ shell, page }) => {
    await shell.open('profile');
    await setLanguage(page, 'en', 'es');

    // The shell re-renders immediately, in Spanish.
    await expect(page.getByTestId('nav-dashboard')).toContainText('Tablero');
  });

  test('every screen renders in Spanish with no raw translation keys', async ({
    shell,
    page,
    t,
  }) => {
    await shell.open('dashboard');
    // The Spanish bundle is what the project's translator resolves.
    expect(t('screen.dashboard')).toBe('Tablero');

    for (const key of NAV_KEYS as readonly NavKey[]) {
      if (key === 'platformStatus') continue;
      await shell.open(key);
      await expect(shell.nav(key)).toBeVisible();

      const leaked = await leakedKeys(page);
      expect(leaked, `${key} rendered raw translation keys`).toEqual([]);
    }
  });

  test('the shared dialogs and sections are localized', async ({ shell, page, t }) => {
    await shell.open('manageAdmin');

    // Section titles, the Add affordance and the dialog buttons all come from
    // the bundle, so they are Spanish end to end.
    const groups = new CrudFlow(page, 'groups', t);
    const section = await groups.open();
    await expect(section.header).toContainText(t('group.title'));

    await section.clickAdd();
    await groups.form.waitOpen();
    await expect(groups.form.saveButton).toBeVisible();
    await expect(groups.form.cancelButton).toBeVisible();
    expect(await leakedKeys(page)).toEqual([]);
    await groups.form.cancel();
  });

  test('a manager creates and deletes a group with the UI in Spanish', async ({
    shell,
    page,
    t,
    cleanup,
  }) => {
    const name = uniqueName('grupo');
    const groups = new CrudFlow(page, 'groups', t);

    await shell.open('manageAdmin');
    await groups.open();
    cleanup.add(`group ${name}`, () => groups.removeIfPresent(name));

    await groups.create(
      { fields: { name, description: 'creado por la suite e2e' } },
      name,
      'name'
    );
    await groups.reload(shell, 'manageAdmin');
    await expect(await groups.section.findRow(name)).toBeVisible();
    await groups.remove(name);
  });

  test('the validation messages are localized too', async ({ shell, page, t }) => {
    const groups = new CrudFlow(page, 'groups', t);
    await shell.open('manageAdmin');
    await groups.open();

    await groups.section.clickAdd();
    await groups.form.waitOpen();
    await groups.form.save();

    await expect(groups.form.error('name')).toHaveText(
      t('validation.required', { field: 'name' })
    );
    expect(await leakedKeys(page)).toEqual([]);
    await groups.form.cancel();
  });

  test('the account language is restored to English', async ({ shell, page }) => {
    await shell.open('profile');
    await setLanguage(page, 'es', 'en');
    await expect(page.getByTestId('nav-dashboard')).toContainText('Dashboard');
  });
});
