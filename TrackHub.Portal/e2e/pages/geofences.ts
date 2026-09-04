/**
 * The Geofences screen: a Leaflet editor with the zone list beside it.
 *
 * The list is a shared `Table`, not a section accordion, so its rows carry the
 * `row-<id>` test id rather than living under a `section-*` root.
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** A row of the list beside the map. */
export const listRow = (page: Page, text: string): Locator =>
  page.locator('[data-testid^="row-"]').filter({ hasText: text }).first();

export const mapContainer = (page: Page): Locator => page.locator('.leaflet-container');

/**
 * The zone the map is currently focused on.
 *
 * The editor mirrors its selection onto the map container, which is what drives
 * `fitBounds` — so this is the observable proof that picking a row in the list
 * and focusing the map are one selection, not two.
 */
export const focusedGeofence = (page: Page): Locator => page.locator('[data-selected-geofence]');

/**
 * Opens a geofence's property dialog.
 *
 * There is no Edit button on the row: selecting a geofence (from the list or by
 * clicking its shape) puts the map layer into edit mode, which reveals the
 * "Save shape" tool, and THAT is what loads the geofence into the form.
 */
export async function openProperties(
  page: Page,
  name: string,
  saveShapeLabel: string
): Promise<void> {
  await listRow(page, name).click();
  const saveShape = page.getByLabel(saveShapeLabel);
  await expect(saveShape).toBeVisible({ timeout: 30_000 });
  await saveShape.click();
}
