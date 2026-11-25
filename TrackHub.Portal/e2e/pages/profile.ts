import type { Page } from '@playwright/test';

export type ProfileCard = 'profile-info' | 'platform-settings' | 'user-part-of';

export const cardOf = (page: Page, id: ProfileCard) => page.getByTestId(`card-${id}`);

/**
 * `PlatformSettings` replaces its whole form when `getUserSettings` answers, so a
 * toggle made earlier is silently discarded.
 */
export const userSettingsLoaded = (page: Page) =>
  page
    .waitForResponse(
      (response) => (response.request().postData() ?? '').includes('GetUserSettings'),
      { timeout: 60_000 }
    )
    .catch(() => null);

export const userSettingsSaved = (page: Page) =>
  page.waitForResponse(
    (response) => (response.request().postData() ?? '').includes('UpdateUserSettings'),
    { timeout: 60_000 }
  );

/** The platform password policy (utils/validationUtils + the Security validator). */
export const meetsPasswordPolicy = (value: string): boolean =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
