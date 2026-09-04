/**
 * Public trip tracking (`/track`) — the one screen an anonymous customer sees.
 *
 * The link is minted through the real Share dialog, then opened in a browser
 * context with no session at all. The malformed/expired/unknown cases are
 * exercised with links built by hand, because a link the platform would refuse
 * cannot be produced by the dialog.
 */

import { test, expect, unique } from '../fixtures';
import type { Page } from '@playwright/test';
import { FormDialog } from '../pages/dialogs';
import type { Translator } from '../fixtures/i18n';

async function planTripAndShare(page: Page, t: Translator, code: string): Promise<string> {
  await page.getByRole('button', { name: t('trips.newTrip') }).click();
  const form = new FormDialog(page, t);
  await form.waitOpen();
  await form.field('code').fill(code);
  await form.field('customerName').fill('E2E customer');
  await form.selectFirst('transporterId');
  await form
    .field('plannedStartAt')
    .fill(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  await form.selectFirst('originGeofencePick');
  await form.selectFirst('destinationGeofencePick');
  await form.saveAndClose();
  await expect(page.getByRole('heading', { name: code })).toBeVisible({ timeout: 60_000 });

  await page.getByRole('button', { name: t('trips.actions.share') }).click();
  await form.waitOpen();
  await form.field('purpose').fill('e2e customer tracking');
  await form
    .field('expiresAt')
    .fill(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  // Share the stop detail so the page has something to render beyond the code.
  await form.root.locator('input[name="includeStopDetail"]').check();
  await form.save();

  // The token is shown once; the dialog stays open holding the URL.
  const url = form.field('shareUrl');
  await expect(url).not.toHaveValue('', { timeout: 45_000 });
  const shareUrl = await url.inputValue();
  await form.save(); // second press closes the dialog
  return shareUrl;
}

test.describe('public trip tracking', () => {
  test('a shared link renders the trip for a signed-out customer', async ({
    shell,
    page,
    anonPage,
    t,
    api,
    cleanup,
  }) => {
    const code = `e2e-trip-${unique()}`;
    await shell.open('tripManager');
    cleanup.add(`trip ${code}`, async () => {
      const found = await api.tryGql<{ trips: { items: { tripId: string; code: string }[] } }>(
        'tripManagement',
        'query($search: String) { trips(query: { search: $search, take: 50 }) { items { tripId code } } }',
        { search: code }
      );
      const trip = found?.trips.items.find((row) => row.code === code);
      if (trip) await api.releaseTrip(trip.tripId);
    });

    const shareUrl = await planTripAndShare(page, t, code);
    expect(shareUrl).toContain('/track?');

    await anonPage.goto(shareUrl);

    // The customer sees the trip facts — and no shell, because they are not a
    // platform principal.
    await expect(anonPage.getByText(code).first()).toBeVisible({ timeout: 60_000 });
    await expect(anonPage.getByText(t('tripTracking.stops'))).toBeVisible();
    await expect(anonPage.getByRole('button', { name: t('tripTracking.refresh') })).toBeVisible();
    await expect(anonPage.getByTestId('nav-dashboard')).toHaveCount(0);

    // Refresh re-reads the snapshot without leaving the page.
    await anonPage.getByRole('button', { name: t('tripTracking.refresh') }).click();
    await expect(anonPage.getByText(code).first()).toBeVisible();
  });

  test('an incomplete link says which part is missing', async ({ anonPage, t }) => {
    await anonPage.goto('/track?grant=1234');

    await expect(
      anonPage.getByRole('heading', { name: t('tripTracking.invalidLinkTitle') })
    ).toBeVisible({ timeout: 60_000 });
    await expect(anonPage.getByText(t('tripTracking.invalidLinkBody'))).toBeVisible();
  });

  test('a link with no query at all is treated as incomplete', async ({ anonPage, t }) => {
    await anonPage.goto('/track');

    await expect(
      anonPage.getByRole('heading', { name: t('tripTracking.invalidLinkTitle') })
    ).toBeVisible({ timeout: 60_000 });
  });

  test('a complete link for an unknown trip reports that it is not valid', async ({
    anonPage,
    t,
    api,
  }) => {
    const accountId = await api.accountId();
    const unknown = crypto.randomUUID();
    await anonPage.goto(
      `/track?grant=${unknown}&account=${accountId}&trip=${unknown}&token=not-a-real-token`
    );

    await expect(
      anonPage.getByRole('heading', { name: t('tripTracking.notFoundTitle') })
    ).toBeVisible({ timeout: 60_000 });
    await expect(anonPage.getByText(t('tripTracking.notFoundBody'))).toBeVisible();
  });

  test('a revoked link stops working', async ({
    shell,
    page,
    anonPage,
    t,
    api,
    cleanup,
  }) => {
    const code = `e2e-trip-${unique()}`;
    await shell.open('tripManager');
    cleanup.add(`trip ${code}`, async () => {
      const found = await api.tryGql<{ trips: { items: { tripId: string; code: string }[] } }>(
        'tripManagement',
        'query($search: String) { trips(query: { search: $search, take: 50 }) { items { tripId code } } }',
        { search: code }
      );
      const trip = found?.trips.items.find((row) => row.code === code);
      if (trip) await api.releaseTrip(trip.tripId);
    });

    const shareUrl = await planTripAndShare(page, t, code);
    await anonPage.goto(shareUrl);
    await expect(anonPage.getByText(code).first()).toBeVisible({ timeout: 60_000 });

    // Revoke it from the same dialog that minted it.
    await page.getByRole('button', { name: t('trips.actions.share') }).click();
    const form = new FormDialog(page, t);
    await form.waitOpen();
    await form.root.getByRole('button', { name: t('tripShare.revoke') }).first().click();
    await page
      .getByTestId('dialog-confirm')
      .getByRole('button', { name: t('generic.confirm') })
      .click();
    await expect(form.root.getByText(t('tripShare.revoked')).first()).toBeVisible({
      timeout: 45_000,
    });

    await anonPage.reload();
    await expect(
      anonPage.getByRole('heading', { name: t('tripTracking.notFoundTitle') })
    ).toBeVisible({ timeout: 60_000 });
  });
});
