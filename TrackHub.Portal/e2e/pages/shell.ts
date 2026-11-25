import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { Translator } from '../fixtures/i18n';
import { principalLoaded, tokenExchange } from '../fixtures/auth';

/** Every route key the sidenav can render, in the order `routes.tsx` declares them. */
export const NAV_KEYS = [
  'dashboard',
  'systemAdmin',
  'manageAdmin',
  'geofenceManager',
  'tripManager',
  'reports',
  'gpsIntegration',
  'platformStatus',
  'profile',
] as const;

export type NavKey = (typeof NAV_KEYS)[number];

export const NAV_ROUTES: Record<NavKey, string> = {
  dashboard: '/dashboard',
  systemAdmin: '/systemAdmin',
  manageAdmin: '/manageAdmin',
  geofenceManager: '/geofenceManager',
  tripManager: '/tripManager',
  reports: '/reports',
  gpsIntegration: '/manage-admin/gps-integration',
  platformStatus: '/status',
  profile: '/profile',
};

export class Shell {
  /** A document load re-runs the OAuth round trip; this remembers it completed. */
  private established = false;

  constructor(
    readonly page: Page,
    private readonly t: Translator
  ) {}

  nav(key: NavKey): Locator {
    return this.page.getByTestId(`nav-${key}`);
  }

  /** Route keys the sidenav is currently offering. */
  async visibleNavKeys(): Promise<NavKey[]> {
    await expect(this.nav('dashboard')).toBeVisible({ timeout: 60_000 });
    const present: NavKey[] = [];
    for (const key of NAV_KEYS) {
      if (await this.nav(key).isVisible().catch(() => false)) present.push(key);
    }
    return present;
  }

  async navigateTo(key: NavKey): Promise<void> {
    await this.nav(key).click();
    await this.page.waitForURL(`**${NAV_ROUTES[key]}`);
  }

  /**
   * A URL is not enough: the token lives in memory, so every document load re-runs
   * the OAuth round trip and the callback navigates to `/dashboard`
   * unconditionally. The sidenav click is a client-side navigation that keeps the
   * token and actually arrives.
   */
  async open(key: NavKey): Promise<void> {
    await this.enter();
    if (new URL(this.page.url()).pathname !== NAV_ROUTES[key]) {
      await this.navigateTo(key);
    }
    expect(new URL(this.page.url()).pathname).toBe(NAV_ROUTES[key]);
  }

  /**
   * The rendered shell is not proof of a session: `App` mounts the Sidenav before
   * the redirect effect runs. The token exchange is the signal.
   */
  async enter(): Promise<void> {
    // `/status`, `/track`, `/error` and the auth interstitials render their own
    // full-page shell with no sidenav, so a session established earlier says
    // nothing about what is on screen now — go back through the dashboard.
    const path = this.page.url().startsWith('http') ? new URL(this.page.url()).pathname : null;
    const chromeless =
      path === null ||
      path === '/status' ||
      path === '/track' ||
      path === '/error' ||
      path.startsWith('/authentication/');
    if (this.established && !chromeless) {
      await this.ready();
      return;
    }
    this.established = false;
    const exchanged = tokenExchange(this.page).catch(() => null);
    const principal = principalLoaded(this.page);
    await this.page.goto('/dashboard');
    await exchanged;
    await principal;
    await this.ready();
    this.established = true;
  }

  /** The reload drops the in-memory token, so the return trip goes through the dashboard. */
  async reloadTo(key: NavKey): Promise<void> {
    this.established = false;
    const exchanged = tokenExchange(this.page).catch(() => null);
    const principal = principalLoaded(this.page);
    await this.page.reload();
    await exchanged;
    await principal;
    this.established = true;
    await this.open(key);
  }

  async ready(): Promise<void> {
    await expect(this.nav('dashboard')).toBeVisible({ timeout: 60_000 });
  }

  get screenTitle(): Locator {
    return this.page.getByTestId('screen-title');
  }

  get helpButton(): Locator {
    return this.page.getByRole('button', { name: this.t('help.open') });
  }

  get bellButton(): Locator {
    return this.page.getByRole('button', { name: this.t('notificationBell.title') });
  }

  get userMenuButton(): Locator {
    return this.page.getByTestId('user-menu');
  }

  get signOffButton(): Locator {
    return this.page.getByRole('menuitem', { name: this.t('navbar.signOff'), exact: true });
  }

  /** Rendered for managers only. */
  get configuratorButton(): Locator {
    return this.page.getByTestId('configurator-toggle');
  }

  /** The configurator drawer is permanent and slides in, so its heading's
   *  position in the viewport is what "open" means. */
  get configuratorTitle(): Locator {
    return this.page.getByRole('heading', { name: this.t('settings.title') });
  }

  get announcement(): Locator {
    return this.page.getByTestId('shell-announcement');
  }

  async openHelp(): Promise<Locator> {
    await this.helpButton.click();
    const dialog = this.page.getByTestId('dialog-help');
    await expect(dialog).toBeVisible();
    return dialog;
  }

  async signOff(): Promise<void> {
    await this.userMenuButton.click();
    await this.signOffButton.click();
  }
}
