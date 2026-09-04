/**
 * Account Management → Account & Subscription: the account record, its branding
 * and the read-only feature entitlements.
 */

import { test, expect, unique } from '../fixtures';
import { CrudFlow } from '../pages/crud';
import { Section } from '../pages/tableAccordion';

test.describe('account management — account & subscription', () => {
  test('a manager edits the account description and it survives a reload', async ({
    page,
    shell,
    t,
    cleanup,
  }) => {
    const account = new CrudFlow(page, 'account', t);
    await shell.open('manageAdmin');
    const section = await account.open();

    const row = section.rows.first();
    await expect(row).toBeVisible();
    const accountName = (await row.innerText()).split('\n')[0].trim();

    await account.section.rowAction(accountName, t('generic.edit'));
    await account.form.waitOpen();
    const originalDescription = await account.form.field('description').inputValue();
    cleanup.add('account description', async () => {
      await shell.open('manageAdmin');
      await account.open();
      await account.edit(accountName, { fields: { description: originalDescription } });
    });

    const description = `e2e description ${unique()}`;
    await account.form.field('description').fill(description);
    await account.form.saveAndClose();

    await account.reload(shell, 'manageAdmin');
    await account.assertStored(accountName, { fields: { description } });
  });

  test('the account dialog refuses an empty name', async ({ page, shell, t }) => {
    const account = new CrudFlow(page, 'account', t);
    await shell.open('manageAdmin');
    const section = await account.open();
    const accountName = (await section.rows.first().innerText()).split('\n')[0].trim();

    await account.section.rowAction(accountName, t('generic.edit'));
    await account.form.waitOpen();
    await account.form.field('name').fill('');
    await account.form.save();

    await expect(account.form.root).toBeVisible();
    await expect(account.form.error('name')).toBeVisible();
    await account.form.cancel();
  });

  test('branding rejects a malformed colour and keeps a valid one after a reload', async ({
    page,
    shell,
    t,
    cleanup,
  }) => {
    const branding = new Section(page, 'branding', t);
    await shell.open('manageAdmin');
    await branding.expand();

    const displayName = branding.root.locator('#displayName');
    const primaryColor = branding.root.locator('#primaryColor');
    const save = branding.root.getByRole('button', { name: t('branding.save') });

    // The section loads its record after it expands and REPLACES the form state
    // when it arrives; typing before that lands would be silently overwritten.
    await expect(displayName).toBeVisible();
    await expect(displayName).not.toHaveValue('', { timeout: 30_000 });
    const originalName = await displayName.inputValue();
    const originalColor = await primaryColor.inputValue();
    cleanup.add('branding', async () => {
      await shell.open('manageAdmin');
      await branding.expand();
      await expect(displayName).not.toHaveValue('', { timeout: 30_000 });
      await displayName.fill(originalName);
      await primaryColor.fill(originalColor || '#1A73E8');
      const restored = page.waitForResponse(
        (response) => (response.request().postData() ?? '').includes('UpdateAccountBranding'),
        { timeout: 45_000 }
      );
      await save.click();
      await restored;
    });

    // A colour that is not #RRGGBB must be refused in the form.
    await primaryColor.fill('not-a-colour');
    await save.click();
    await expect(branding.root.locator('#primaryColor-helper-text')).toBeVisible();

    const newName = `E2E Branding ${unique()}`;
    await displayName.fill(newName);
    await primaryColor.fill('#123456');
    // Saving is silent on success, so the mutation itself is the signal that the
    // write left the browser — without it the reload below can outrun the save.
    const saved = page.waitForResponse(
      (response) => (response.request().postData() ?? '').includes('UpdateAccountBranding'),
      { timeout: 45_000 }
    );
    await save.click();
    await saved;

    await shell.reloadTo('manageAdmin');
    await branding.expand();
    await expect(branding.root.locator('#displayName')).toHaveValue(newName);
    await expect(branding.root.locator('#primaryColor')).toHaveValue('#123456');
  });

  test('the account features section reports every entitlement read-only', async ({
    page,
    shell,
    t,
  }) => {
    const features = new Section(page, 'account-features', t);
    await shell.open('manageAdmin');
    await features.expand();

    // Enabling a feature is a billing decision owned by the System Admin screen;
    // a manager only sees the state of each one.
    await expect(features.addButton).toHaveCount(0);
    // The section lists eleven entitlements through the client-paged shared
    // Table, so the eleventh sits on page two.
    for (const featureKey of [
      'gps.integration',
      'geofencing',
      'trip-management',
      'documents',
      'public-links',
      'notifications',
    ]) {
      await expect(features.rowById(featureKey)).toBeVisible();
    }
    await expect(features.rows).toHaveCount(10);
  });
});
