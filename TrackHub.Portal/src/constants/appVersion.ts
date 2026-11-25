/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

/**
 * The only version the UI reports: backend services are identified by their Docker image tags,
 * but the portal is static files on a volume, so only the build itself can say which build a
 * browser runs. `BUILD_TIME` distinguishes two builds of the same version (deployments and
 * rollbacks do not bump `package.json`). Both are replaced by vite.config.ts `define`; the
 * `typeof` guard covers evaluation outside a Vite pipeline, where the identifier would throw.
 */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

export const BUILD_TIME: string = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : '';

export const versionLabel = (): string => `v${APP_VERSION}`;

/** Kept in UTC on purpose: the reader compares it against a server-side deployment time. */
export const buildLabel = (): string => {
  if (!BUILD_TIME) return versionLabel();
  const stamp = new Date(BUILD_TIME);
  if (Number.isNaN(stamp.getTime())) return versionLabel();
  return `${versionLabel()} · ${stamp.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
};
