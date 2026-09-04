/**
 * The public platform status page — the screen that has to work when nothing
 * else does.
 *
 * This is the one place the suite is allowed to break something on purpose: a
 * single health URL is failed with `page.route` so the "not working" state can
 * be asserted. Everything else runs against the real probes.
 */

import { test, expect, unique } from '../fixtures';
import { PROBED_SERVICE_COUNT } from '../fixtures/services';

test.describe('platform status', () => {
  test('a signed-out visitor sees every service tile and the portal build', async ({
    anonPage,
    t,
  }) => {
    await anonPage.goto('/status');

    await expect(anonPage.getByRole('heading', { name: t('platformStatus.title') })).toBeVisible();
    const tiles = anonPage.getByTestId('service-tile');
    await expect(tiles).toHaveCount(PROBED_SERVICE_COUNT);

    // Every tile answers with a state, and the page says when it last checked.
    for (let index = 0; index < PROBED_SERVICE_COUNT; index += 1) {
      await expect
        .poll(() => tiles.nth(index).getAttribute('data-state'), { timeout: 60_000 })
        .toMatch(/^(up|down|unknown)$/);
    }
    // Anchored: while the probes are still in flight the page also says
    // "Checking systems…" for the OVERALL state, and an unanchored match would
    // collide with it.
    await expect(anonPage.getByText(/^(Last checked|Checking…)/)).toBeVisible();

    await expect(anonPage.getByRole('button', { name: t('platformStatus.refresh') })).toBeVisible();
    await expect(anonPage.getByRole('button', { name: t('platformStatus.signIn') })).toBeVisible();
    await expect(anonPage.getByText(/Portal build:/)).toBeVisible();
    await expect(anonPage.getByText(t('platformStatus.signInHint'))).toBeVisible();
  });

  test('the refresh button re-probes the services', async ({ anonPage, t }) => {
    await anonPage.goto('/status');
    const tiles = anonPage.getByTestId('service-tile');
    await expect(tiles.first()).toBeVisible();

    let probes = 0;
    anonPage.on('response', (response) => {
      if (response.url().endsWith('/health')) probes += 1;
    });

    await anonPage.getByRole('button', { name: t('platformStatus.refresh') }).click();
    await expect.poll(() => probes, { timeout: 60_000 }).toBeGreaterThan(0);
  });

  test('a service whose health check fails is reported as not working', async ({
    anonPage,
    t,
  }) => {
    // The only deliberate breakage in the suite: one probe is failed so the
    // page's outage state can be exercised. SVD-10 — a CORS/network failure has
    // to read as "down", and the rest of the page must still render.
    await anonPage.route('**/Manager/health', (route) => route.abort('failed'));

    await anonPage.goto('/status');
    const tiles = anonPage.getByTestId('service-tile');
    await expect(tiles.first()).toBeVisible();

    const managerTile = tiles.filter({
      hasText: t('platformStatus.services.manager.name'),
    });
    await expect(managerTile).toHaveAttribute('data-state', 'down', { timeout: 60_000 });
    await expect(managerTile).toContainText(t('platformStatus.state.down'));

    // The page survives it: the other tiles and the header still render.
    await expect(anonPage.getByRole('heading', { name: t('platformStatus.title') })).toBeVisible();
    await expect(tiles).toHaveCount(PROBED_SERVICE_COUNT);
  });

  test('an administrator sees the background jobs table and the announcement manager', async ({
    shell,
    page,
    t,
  }) => {
    // The status page never starts the sign-in flow, so the administrator tier
    // appears only when the session already exists — reach it from the shell.
    await shell.open('platformStatus');

    await expect(page.getByRole('heading', { name: t('platformStatus.jobs.title') })).toBeVisible({
      timeout: 60_000,
    });

    const rows = page.locator('[data-testid^="job-row-"]');
    const empty = page.getByText(t('platformStatus.jobs.empty'));
    await expect(rows.first().or(empty).first()).toBeVisible();
    if ((await rows.count()) > 0) {
      await expect
        .poll(() => rows.first().getAttribute('data-testid'))
        .toMatch(/^job-row-(ok|failed|stale|idle)$/);
    }

    // The sync-worker tile is the manager/administrator tier of the same page.
    await expect(
      page.getByTestId('service-tile').filter({ hasText: t('platformStatus.services.syncWorker.name') })
    ).toBeVisible();

    await expect(page.getByRole('button', { name: t('platformStatus.manage.open') })).toBeVisible();
  });

  test('an administrator schedules, edits and deletes an announcement', async ({
    shell,
    page,
    t,
    cleanup,
  }) => {
    const message = `E2E scheduled ${unique()}`;
    await shell.open('platformStatus');

    const manage = page.getByRole('button', { name: t('platformStatus.manage.open') });
    await expect(manage).toBeVisible({ timeout: 60_000 });
    await manage.click();

    const dialog = page.getByTestId('dialog-form');
    await expect(dialog).toBeVisible();

    // An empty message is refused in the dialog.
    await dialog.getByRole('button', { name: t('generic.save') }).click();
    await expect(dialog.getByText(t('platformStatus.manage.errors.messageRequired'))).toBeVisible();

    // An end before the start is refused too.
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
    const end = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16);
    await dialog.getByRole('textbox', { name: t('platformStatus.manage.messageEn') }).fill(message);
    await dialog.getByRole('textbox', { name: t('platformStatus.manage.startsAt') }).fill(start);
    await dialog.getByRole('textbox', { name: t('platformStatus.manage.endsAt') }).fill(end);
    await dialog.getByRole('button', { name: t('generic.save') }).click();
    await expect(dialog.getByText(t('platformStatus.manage.errors.windowInvalid'))).toBeVisible();

    const laterEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await dialog.getByRole('textbox', { name: t('platformStatus.manage.endsAt') }).fill(laterEnd);
    await dialog.getByRole('button', { name: t('generic.save') }).click();

    await expect(
      dialog.getByRole('textbox', { name: t('platformStatus.manage.messageEn') })
    ).toHaveValue('', { timeout: 45_000 });
    const entry = dialog.getByText(message, { exact: true });
    await expect(entry).toBeVisible();

    cleanup.add(`announcement ${message}`, async () => {
      await shell.open('platformStatus');
      const reopen = page.getByRole('button', { name: t('platformStatus.manage.open') });
      await expect(reopen).toBeVisible({ timeout: 60_000 });
      await reopen.click();
      const stale = page.getByTestId('dialog-form').getByText(message, { exact: true });
      if ((await stale.count()) > 0) {
        await stale
          .locator('xpath=ancestor::div[2]')
          .getByRole('button', { name: t('generic.delete') })
          .click();
        await expect(stale).toBeHidden({ timeout: 30_000 });
      }
    });

    // Editing loads the announcement back into the draft.
    const row = entry.locator('xpath=ancestor::div[2]');
    await row.getByRole('button', { name: t('generic.edit') }).click();
    await expect(
      dialog.getByRole('textbox', { name: t('platformStatus.manage.messageEn') })
    ).toHaveValue(message);

    const edited = `${message} edited`;
    await dialog.getByRole('textbox', { name: t('platformStatus.manage.messageEn') }).fill(edited);
    await dialog.getByRole('button', { name: t('generic.save') }).click();
    await expect(dialog.getByText(edited, { exact: true })).toBeVisible({ timeout: 45_000 });

    const editedRow = dialog.getByText(edited, { exact: true }).locator('xpath=ancestor::div[2]');
    await editedRow.getByRole('button', { name: t('generic.delete') }).click();
    await expect(dialog.getByText(edited, { exact: true })).toBeHidden({ timeout: 45_000 });
  });
});
