/** The list is a shared `Table`, so its rows carry the `row-<id>` test id. */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export const listRow = (page: Page, text: string): Locator =>
  page.locator('[data-testid^="row-"]').filter({ hasText: text }).first();

export const mapContainer = (page: Page): Locator => page.locator('.leaflet-container');

/**
 * The editor mirrors its selection onto the map container, which drives
 * `fitBounds`: proof that the list and the map share one selection.
 */
export const focusedGeofence = (page: Page): Locator => page.locator('[data-selected-geofence]');

/**
 * There is no Edit button on the row: selecting a geofence puts the layer into
 * edit mode, which reveals "Save shape", and that loads the geofence into the form.
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

/**
 * The list is client-paged, so a fresh zone may need searching for; the search
 * must not be typed before the first fetch paints, or the initial load re-runs over it.
 */
export async function findGeofence(page: Page, searchPlaceholder: string, name: string): Promise<Locator> {
  await expect(page.locator('[data-testid^="row-"]').first()).toBeVisible({ timeout: 60_000 });
  await page.getByPlaceholder(searchPlaceholder).fill(name);

  const row = listRow(page, name);
  await expect(row).toBeVisible({ timeout: 60_000 });
  return row;
}
