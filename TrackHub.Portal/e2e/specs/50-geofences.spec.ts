/**
 * Geofences (feature `geofencing`): the map editor, the list beside it, and the
 * per-geofence properties.
 *
 * Shapes are drawn on a Leaflet map. Circles are drawable from the browser (the
 * tool takes a click for the centre and a drag for the radius) and that path is
 * exercised here. Polygons need a click per vertex plus a commit gesture that
 * `leaflet-editable` only completes reliably with a real pointer, so the polygon
 * used by the edit/toggle/delete/filter tests is SEEDED through the API — what
 * those tests measure is the screen, not the drawing library.
 */

import { test, expect, uniqueName } from '../fixtures';
import { FormDialog, ConfirmDialog } from '../pages/dialogs';
import { focusedGeofence, listRow, mapContainer, openProperties } from '../pages/geofences';

test.describe('geofences', () => {
  test('the screen renders the map, its drawing tools, the filters and the list', async ({
    shell,
    page,
    t,
  }) => {
    await shell.open('geofenceManager');

    await expect(mapContainer(page)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('combobox', { name: t('geofence.filterType') })).toBeVisible();
    await expect(page.getByRole('combobox', { name: t('geofence.filterActive') })).toBeVisible();
    await expect(page.getByText(/\d+\s*[–-]\s*\d+/).first()).toBeVisible();

    // The two drawing tools sit on the map control overlay.
    await expect(page.getByLabel(t('geofence.drawPolygon'))).toBeVisible();
    await expect(page.getByLabel(t('geofence.drawCircle'))).toBeVisible();
  });

  test('a manager draws a circle on the map and names it', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('circle');
    await shell.open('geofenceManager');
    await expect(mapContainer(page)).toBeVisible({ timeout: 60_000 });

    cleanup.add(`geofence ${name}`, async () => {
      const found = await api.tryGql<{
        geofencesByAccount: { items: { geofenceId: string; name: string }[] };
      }>(
        'geofencing',
        'query($search: String) { geofencesByAccount(query: { enableCaching: false, take: 50, search: $search }) { items { geofenceId name } } }',
        { search: name }
      );
      const geofence = found?.geofencesByAccount.items.find((row) => row.name === name);
      if (geofence) await api.deleteGeofence(geofence.geofenceId);
    });

    // Draw: leaflet-editable takes one click for the centre and a second for the
    // radius. A press-and-drag commits a circle of radius zero, which the form
    // then rejects — the two clicks are the gesture the tool actually expects.
    await page.getByLabel(t('geofence.drawCircle')).click();
    const box = (await mapContainer(page).boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.click(centre.x, centre.y);
    await page.mouse.move(centre.x + 100, centre.y + 100, { steps: 10 });
    await page.mouse.click(centre.x + 100, centre.y + 100);

    const form = new FormDialog(page, t);
    await form.waitOpen();
    await form.field('name').fill(name);
    await form.field('dwellThresholdMinutes').fill('15');
    await form.saveAndClose();

    await expect(listRow(page, name)).toBeVisible({ timeout: 45_000 });

    // The saved circle survives a reload with its radius and dwell threshold.
    await shell.reloadTo('geofenceManager');
    const row = listRow(page, name);
    await expect(row).toBeVisible({ timeout: 45_000 });
    await openProperties(page, name, t('geofence.saveShape'));
    await form.waitOpen();
    await expect(form.field('circleRadiusMeters')).not.toHaveValue('');
    await expect(form.field('dwellThresholdMinutes')).toHaveValue('15');
    await form.cancel();
  });

  test('the geofence form rejects an out-of-range radius and dwell threshold', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('zone');
    const geofenceId = await api.createPolygonGeofence(name);
    cleanup.add(`geofence ${name}`, () => api.deleteGeofence(geofenceId));

    await shell.open('geofenceManager');
    await page.getByPlaceholder(t('navbar.searchText')).fill(name);
    await expect(listRow(page, name)).toBeVisible({ timeout: 60_000 });
    await openProperties(page, name, t('geofence.saveShape'));

    const form = new FormDialog(page, t);
    await form.waitOpen();
    await form.field('dwellThresholdMinutes').fill('99999');
    await form.save();
    await expect(form.root).toBeVisible();
    await expect(form.error('dwellThresholdMinutes')).toHaveText(t('geofence.validation.dwellRange'));

    // An empty name is refused too.
    await form.field('dwellThresholdMinutes').fill('30');
    await form.field('name').fill('');
    await form.save();
    await expect(form.error('name')).toBeVisible();
    await form.cancel();
  });

  test('a manager renames a geofence and opts it into entry alerts', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('zone');
    const renamed = uniqueName('renamed');
    const geofenceId = await api.createPolygonGeofence(name);
    cleanup.add(`geofence ${renamed}`, () => api.deleteGeofence(geofenceId));

    await shell.open('geofenceManager');
    await expect(listRow(page, name)).toBeVisible({ timeout: 60_000 });
    await openProperties(page, name, t('geofence.saveShape'));

    const form = new FormDialog(page, t);
    await form.waitOpen();
    await form.field('name').fill(renamed);
    await form.root.locator('input[name="alertOnEntry"]').check();
    await form.saveAndClose();

    await shell.reloadTo('geofenceManager');
    await page.getByPlaceholder(t('navbar.searchText')).fill(renamed);
    await expect(listRow(page, renamed)).toBeVisible({ timeout: 45_000 });
    await openProperties(page, renamed, t('geofence.saveShape'));
    await form.waitOpen();
    await expect(form.field('name')).toHaveValue(renamed);
    await expect(form.root.locator('input[name="alertOnEntry"]')).toBeChecked();
    await form.cancel();
  });

  test('deactivating a geofence moves it out of the active list', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('zone');
    const geofenceId = await api.createPolygonGeofence(name);
    cleanup.add(`geofence ${name}`, () => api.deleteGeofence(geofenceId));

    await shell.open('geofenceManager');
    await page.getByPlaceholder(t('navbar.searchText')).fill(name);
    await expect(listRow(page, name)).toBeVisible({ timeout: 60_000 });
    await openProperties(page, name, t('geofence.saveShape'));

    const form = new FormDialog(page, t);
    await form.waitOpen();
    await form.root.locator('input[name="active"]').uncheck();
    await form.saveAndClose();

    const status = page.getByRole('combobox', { name: t('geofence.filterActive') });
    await status.click();
    await page.getByRole('option', { name: t('geofence.onlyActive'), exact: true }).click();
    await expect(page.locator('[data-testid^="row-"]').filter({ hasText: name })).toHaveCount(0, {
      timeout: 30_000,
    });

    await status.click();
    await page.getByRole('option', { name: t('geofence.onlyInactive'), exact: true }).click();
    await expect(listRow(page, name)).toBeVisible({ timeout: 30_000 });
  });

  test('the status filter narrows the list and the name search finds one zone', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('zone');
    const geofenceId = await api.createPolygonGeofence(name);
    cleanup.add(`geofence ${name}`, () => api.deleteGeofence(geofenceId));

    await shell.open('geofenceManager');
    // Wait for the list to load before typing: a search applied before the
    // screen has its rows would be re-run by the initial fetch.
    await expect(listRow(page, name)).toBeVisible({ timeout: 60_000 });

    // The name search lives in the navbar, mirroring the dashboard.
    await page.getByPlaceholder(t('navbar.searchText')).fill(name);
    await expect
      .poll(() => page.locator('[data-testid^="row-"]').count(), { timeout: 30_000 })
      .toBe(1);
    await expect(listRow(page, name)).toBeVisible();

    // Filtering to inactive removes it: the seeded zone is active.
    const status = page.getByRole('combobox', { name: t('geofence.filterActive') });
    await status.click();
    await page.getByRole('option', { name: t('geofence.onlyInactive') }).click();
    await expect(page.locator('[data-testid^="row-"]')).toHaveCount(0, { timeout: 30_000 });

    await status.click();
    await page.getByRole('option', { name: t('geofence.allActive') }).click();
    await expect(listRow(page, name)).toBeVisible({ timeout: 30_000 });
  });

  test('the type filter narrows the list and selecting a zone focuses the map on it', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('zone');
    const geofenceId = await api.createPolygonGeofence(name);
    cleanup.add(`geofence ${name}`, () => api.deleteGeofence(geofenceId));

    await shell.open('geofenceManager');
    await expect(listRow(page, name)).toBeVisible({ timeout: 60_000 });

    // The seeded zone is a ClientLocation, so every other type excludes it.
    const type = page.getByRole('combobox', { name: t('geofence.filterType') });
    await type.click();
    await page.getByRole('option', { name: t('geofenceTypes.warehouse'), exact: true }).click();
    await expect(page.locator('[data-testid^="row-"]').filter({ hasText: name })).toHaveCount(0, {
      timeout: 30_000,
    });

    await type.click();
    await page.getByRole('option', { name: t('geofenceTypes.clientLocation'), exact: true }).click();
    await expect(listRow(page, name)).toBeVisible({ timeout: 30_000 });

    await type.click();
    await page.getByRole('option', { name: t('geofence.allTypes') }).click();
    await expect(listRow(page, name)).toBeVisible({ timeout: 30_000 });

    // Clicking the row hands the zone to the map, which is what makes it fit
    // its bounds — the list and the map are one selection, not two.
    await listRow(page, name).click();
    await expect(focusedGeofence(page)).toHaveAttribute(
      'data-selected-geofence',
      name,
      { timeout: 30_000 }
    );
  });

  test('a manager deletes a geofence through its confirmation', async ({
    shell,
    page,
    t,
    api,
    cleanup,
  }) => {
    const name = uniqueName('zone');
    const geofenceId = await api.createPolygonGeofence(name);
    cleanup.add(`geofence ${name}`, () => api.deleteGeofence(geofenceId));

    await shell.open('geofenceManager');
    await page.getByPlaceholder(t('navbar.searchText')).fill(name);
    const row = listRow(page, name);
    await expect(row).toBeVisible({ timeout: 60_000 });

    await row.getByRole('button', { name: t('generic.delete') }).click();
    await new ConfirmDialog(page, t).confirm();
    await expect(page.locator('[data-testid^="row-"]').filter({ hasText: name })).toHaveCount(0, {
      timeout: 45_000,
    });
  });
});
