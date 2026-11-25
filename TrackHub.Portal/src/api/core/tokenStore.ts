/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import { jwtDecode } from 'jwt-decode';
import { ApiError } from './errors';

/**
 * AuthContext is the writer and registers its refresh routine; the api layer
 * reads, so services stay plain async functions. Tokens live in memory only.
 */

type RefreshHandler = () => Promise<string | undefined>;

let accessToken: string | null = null;
let refreshHandler: RefreshHandler | null = null;
/** Module-level mutex so concurrent requests trigger a single refresh. */
let refreshPromise: Promise<string> | null = null;

/**
 * Treated as already expired this many seconds before it actually is. Without the buffer a token
 * that the browser clock still calls valid is regularly rejected by the server — clock skew, or a
 * request issued in the last moments of its life.
 */
const EXPIRY_SKEW_SECONDS = 45;

function isTokenValid(token: string): boolean {
  try {
    const { exp } = jwtDecode(token);
    return exp !== undefined && exp - EXPIRY_SKEW_SECONDS >= Date.now() / 1000;
  } catch {
    return false;
  }
}

export const tokenStore = {
  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  getAccessToken(): string | null {
    return accessToken;
  },

  registerRefreshHandler(handler: RefreshHandler | null): void {
    refreshHandler = handler;
  },

  async acquireValidAccessToken(): Promise<string> {
    if (accessToken && isTokenValid(accessToken)) {
      return accessToken;
    }
    if (refreshPromise) {
      return refreshPromise;
    }
    if (!refreshHandler) {
      throw new ApiError('Not authenticated: no token and no refresh handler registered.', {
        code: 'NOT_AUTHENTICATED',
      });
    }
    refreshPromise = refreshHandler()
      .then((token) => {
        if (!token) {
          throw new ApiError('Token refresh did not produce an access token.', {
            code: 'NOT_AUTHENTICATED',
          });
        }
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  },

  /**
   * Forces a refresh: the held token was rejected by the server even though it looked valid here
   * (a revoked grant, an authority restart, skew beyond the buffer). Shares the same single-flight
   * promise, so concurrent 401s still refresh once.
   */
  async forceRefreshAccessToken(): Promise<string> {
    accessToken = null;
    return this.acquireValidAccessToken();
  },

  reset(): void {
    accessToken = null;
    refreshHandler = null;
    refreshPromise = null;
  },
};
