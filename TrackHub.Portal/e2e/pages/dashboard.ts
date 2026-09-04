/**
 * The Dashboard: the live Units tab and the historical Positions tab.
 *
 * Both tabs render a map beside a table, and the selection is shared between
 * them — the map mirrors the selected unit onto its container, which is what
 * pans it and opens the marker.
 */

import type { Locator, Page } from '@playwright/test';
import type { Translator } from '../fixtures/i18n';

/** A row of the fleet table beside the live map. */
export const unitRow = (page: Page, text: string): Locator =>
  page.locator('[data-testid^="row-"]').filter({ hasText: text }).first();

/** Every row of whichever table the open tab renders. */
export const rows = (page: Page): Locator => page.locator('[data-testid^="row-"]');

/** The unit the live map is currently focused on. */
export const focusedUnit = (page: Page): Locator => page.locator('[data-selected-marker]');

/** One of the three map toggles, which report their state as `aria-pressed`. */
export const toggleChip = (page: Page, t: Translator, key: 'poiLayer' | 'followMode' | 'trail') =>
  page.getByRole('button', { name: t(`dashboard.${key}`) });

export async function openTab(
  page: Page,
  t: Translator,
  key: 'transporters' | 'positions'
): Promise<void> {
  await page.getByRole('tab', { name: t(`dashboard.${key}Title`) }).click();
}
