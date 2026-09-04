/**
 * The Profile screen: the user's own record, their platform settings and the
 * roles and policies they hold, stacked as three cards.
 */

import type { Page } from '@playwright/test';

export type ProfileCard = 'profile-info' | 'platform-settings' | 'user-part-of';

/** One of the profile's three cards, by its stable test id. */
export const cardOf = (page: Page, id: ProfileCard) => page.getByTestId(`card-${id}`);

/**
 * Resolves once the settings card has its record.
 *
 * `PlatformSettings` seeds its form from defaults and REPLACES the whole object
 * when `getUserSettings` answers, so a toggle made before that lands is silently
 * discarded — and the save that follows writes the server's own values back.
 */
export const userSettingsLoaded = (page: Page) =>
  page
    .waitForResponse(
      (response) => (response.request().postData() ?? '').includes('GetUserSettings'),
      { timeout: 60_000 }
    )
    .catch(() => null);

/** Resolves once a settings save has actually left the browser. */
export const userSettingsSaved = (page: Page) =>
  page.waitForResponse(
    (response) => (response.request().postData() ?? '').includes('UpdateUserSettings'),
    { timeout: 60_000 }
  );

/** The platform password policy (utils/validationUtils + the Security validator). */
export const meetsPasswordPolicy = (value: string): boolean =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
