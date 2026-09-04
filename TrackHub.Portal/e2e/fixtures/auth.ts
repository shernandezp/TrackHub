/**
 * Real sign-in against the deployed AuthorityServer.
 *
 * The portal keeps its access token in memory and its refresh token in React
 * state, so a saved storage state restores NO session by itself. What it does
 * restore is the AuthorityServer's own cookie on `trackhub.local`, and that is
 * enough: the portal's `/authorize` round trip then completes without a login
 * form, and the callback mints a fresh token pair. The suite therefore signs in
 * with credentials exactly once per role (the `setup` project) and reuses the
 * cookie afterwards.
 */

import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { AUTH_DIR, config, storageStatePath, tokenPath } from './env';
import type { RoleName } from './env';
import type { CapturedTokens } from './api';

export interface Credentials {
  email: string;
  password: string;
}

/** Starts recording the OAuth token exchange; resolve after the sign-in completes. */
export function captureTokens(page: Page): () => CapturedTokens | null {
  let captured: CapturedTokens | null = null;
  page.on('response', (response) => {
    if (!config.tokenEndpoint || response.url() !== config.tokenEndpoint) return;
    if (!response.ok()) {
      console.log(`[auth] token endpoint answered ${response.status()}`);
      return;
    }
    void response
      .json()
      .then((body: Record<string, unknown>) => {
        if (typeof body.access_token === 'string') {
          captured = {
            access_token: body.access_token,
            refresh_token: typeof body.refresh_token === 'string' ? body.refresh_token : undefined,
            expires_in: typeof body.expires_in === 'number' ? body.expires_in : undefined,
            obtained_at: Date.now(),
          };
        } else {
          console.log(`[auth] token response carried no access_token: ${Object.keys(body).join(', ')}`);
        }
      })
      .catch((error: Error) => {
        // A body that cannot be read is not a capture — but say so, because the
        // silent version of this turns into an unexplained empty token file.
        console.log(`[auth] could not read the token response body: ${error.message}`);
      });
  });
  return () => captured;
}

/** The AuthorityServer login form, addressed by its stable element ids. */
export const loginForm = (page: Page) => ({
  email: page.locator('#email'),
  password: page.locator('#password'),
  submit: page.locator('form button[type="submit"]'),
  error: page.locator('.alert-danger'),
});

export interface SignInResult {
  /** The shell rendered — the session is live. */
  ok: boolean;
  /** The AuthorityServer's own rejection text, when it refused the credentials. */
  error?: string;
}

/**
 * Drives the credential form when it appears, and reports the AuthorityServer's
 * rejection rather than timing out on it — "wrong password" and "account not
 * verified" are different answers and a test needs to tell them apart.
 */
export async function signIn(page: Page, credentials: Credentials): Promise<SignInResult> {
  const form = loginForm(page);
  const signedIn = page.getByTestId('nav-dashboard');

  // The rendered shell is NOT proof of a session: `App` mounts the Sidenav for
  // any non-chromeless route and only THEN runs the effect that redirects an
  // unauthenticated visitor, so the sidenav flashes on the way to the login
  // page. The token exchange is the only unambiguous signal.
  const exchanged = tokenExchange(page);
  await page.goto('/dashboard');

  const first = await Promise.race([
    form.email.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'form' as const),
    exchanged.then(() => 'token' as const),
  ]).catch(() => 'nothing' as const);

  if (first === 'token') {
    await expect(signedIn).toBeVisible({ timeout: 60_000 });
    return { ok: true };
  }
  if (first === 'nothing') {
    return { ok: false, error: 'neither the login form nor a token exchange appeared' };
  }

  await form.email.fill(credentials.email);
  await form.password.fill(credentials.password);
  const retry = tokenExchange(page);
  await form.submit.click();

  const outcome = await Promise.race([
    retry.then(() => 'token' as const),
    form.error.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'refused' as const),
  ]).catch(() => 'nothing' as const);

  if (outcome === 'token') {
    await expect(signedIn).toBeVisible({ timeout: 60_000 });
    return { ok: true };
  }
  if (outcome === 'refused') {
    return { ok: false, error: (await form.error.innerText()).trim() };
  }
  return { ok: false, error: 'the sign-in neither completed nor reported an error' };
}

/** Resolves when the portal completes an OAuth token exchange on this page. */
export function tokenExchange(page: Page, timeout = 60_000): Promise<unknown> {
  return page.waitForResponse(
    (response) => response.url() === config.tokenEndpoint && response.ok(),
    { timeout }
  );
}

/** Persists the browser state and the captured tokens for one role. */
export function persistRole(role: RoleName, tokens: CapturedTokens | null): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  if (tokens) {
    fs.writeFileSync(tokenPath(role), JSON.stringify(tokens, null, 2));
  }
}

export const authFiles = {
  dir: AUTH_DIR,
  /** Roles whose storage state exists — a spec skips rather than fails without one. */
  hasRole: (role: RoleName): boolean => fs.existsSync(storageStatePath(role)),
  createdFile: path.join(AUTH_DIR, 'created.json'),
};

/** Users the setup project created itself, recorded so teardown can delete them. */
export interface CreatedPrincipal {
  role: RoleName;
  userId: string;
  email: string;
  username: string;
  password: string;
}

export function readCreated(): CreatedPrincipal[] {
  if (!fs.existsSync(authFiles.createdFile)) return [];
  return JSON.parse(fs.readFileSync(authFiles.createdFile, 'utf8')) as CreatedPrincipal[];
}

export function writeCreated(entries: CreatedPrincipal[]): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(authFiles.createdFile, JSON.stringify(entries, null, 2));
}
