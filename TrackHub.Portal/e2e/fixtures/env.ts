/**
 * Endpoints come from the portal's own `.env` / `.env.local` (via Vite's
 * `loadEnv`) so tests talk to the same backends as the app under test; suite
 * knobs come from `e2e/.env.e2e` (template: `e2e/.env.e2e.example`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

export const PORTAL_ROOT = path.resolve(__dirname, '..', '..');
export const AUTH_DIR = path.join(PORTAL_ROOT, 'e2e', '.auth');

/** Minimal `KEY=value` reader — no dependency, and `.env.e2e` needs nothing more. */
function readDotEnv(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const values: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/** `.env.e2e` values, with real environment variables winning (CI overrides a file). */
export const e2eEnv: Record<string, string | undefined> = {
  ...readDotEnv(path.join(PORTAL_ROOT, 'e2e', '.env.e2e')),
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('E2E_'))),
};

export const portalEnv = loadEnv('development', PORTAL_ROOT, 'REACT_APP_');

export const flag = (name: string): boolean => e2eEnv[name] === '1' || e2eEnv[name] === 'true';
export const value = (name: string, fallback: string): string => e2eEnv[name] || fallback;
export const optional = (name: string): string | undefined => e2eEnv[name] || undefined;

const stripGraphql = (url: string): string => url.replace(/graphql\/?$/, '').replace(/\/+$/, '');

export const config = {
  baseURL: value('E2E_BASE_URL', portalEnv.REACT_APP_CALLBACK_ENDPOINT
    ? new URL(portalEnv.REACT_APP_CALLBACK_ENDPOINT).origin
    : 'https://localhost:3000'),
  clientId: portalEnv.REACT_APP_CLIENT_ID || 'web_client',
  tokenEndpoint: portalEnv.REACT_APP_TOKEN_ENDPOINT,
  authorizationEndpoint: portalEnv.REACT_APP_AUTHORIZATION_ENDPOINT,
  revokeEndpoint: portalEnv.REACT_APP_REVOKE_TOKEN_ENDPOINT,
  graphql: {
    manager: portalEnv.REACT_APP_MANAGER_ENDPOINT,
    security: portalEnv.REACT_APP_SECURITY_ENDPOINT,
    geofencing: portalEnv.REACT_APP_GEOFENCING_ENDPOINT,
    router: portalEnv.REACT_APP_ROUTER_ENDPOINT,
    telemetry: portalEnv.REACT_APP_TELEMETRY_ENDPOINT,
    tripManagement: portalEnv.REACT_APP_TRIPMANAGEMENT_ENDPOINT,
  },
  rest: {
    managerBase: stripGraphql(portalEnv.REACT_APP_MANAGER_ENDPOINT ?? ''),
    tripBase: stripGraphql(portalEnv.REACT_APP_TRIPMANAGEMENT_ENDPOINT ?? ''),
    reporting: (portalEnv.REACT_APP_REPORTING_ENDPOINT ?? '').replace(/\/+$/, ''),
  },
  credentials: {
    admin: {
      email: value('E2E_ADMIN_EMAIL', 'email@mail.com'),
      password: value('E2E_ADMIN_PASSWORD', '12345678'),
    },
    manager: optional('E2E_MANAGER_EMAIL')
      ? { email: e2eEnv.E2E_MANAGER_EMAIL!, password: e2eEnv.E2E_MANAGER_PASSWORD ?? '' }
      : null,
    user: optional('E2E_USER_EMAIL')
      ? { email: e2eEnv.E2E_USER_EMAIL!, password: e2eEnv.E2E_USER_PASSWORD ?? '' }
      : null,
  },
} as const;

export type RoleName = 'admin' | 'manager' | 'user';
export const storageStatePath = (role: RoleName): string => path.join(AUTH_DIR, `${role}.json`);
export const tokenPath = (role: RoleName): string => path.join(AUTH_DIR, `${role}.token.json`);
export const createdPath = path.join(AUTH_DIR, 'created.json');
