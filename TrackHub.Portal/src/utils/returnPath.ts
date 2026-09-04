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
 * The screen the user asked for, held across the OAuth round trip in
 * `sessionStorage` alongside `oauth_state` and `code_verifier`.
 */

const RETURN_PATH_KEY = 'auth_return_path';

const isFlowRoute = (path: string) =>
  path.startsWith('/authentication/') || path === '/error' || path === '/';

/** `//host` and `https://host` are navigable targets, so only a single leading slash passes. */
const isSafePath = (path: string) => path.startsWith('/') && !path.startsWith('//');

export function rememberReturnPath(path: string): void {
  try {
    if (!isSafePath(path) || isFlowRoute(path)) return;
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch {
    // A browser that blocks storage lands on the default screen.
  }
}

/** Reads and clears the remembered path; null when there is nothing to return to. */
export function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    sessionStorage.removeItem(RETURN_PATH_KEY);
    return path && isSafePath(path) && !isFlowRoute(path) ? path : null;
  } catch {
    return null;
  }
}
