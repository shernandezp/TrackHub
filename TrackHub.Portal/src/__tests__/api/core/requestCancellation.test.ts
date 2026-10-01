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

import axios from 'axios';
import { executeGraphQL } from 'api/core/graphqlClient';
import { restRequest } from 'api/core/restClient';
import { ApiError, isRequestCancelled, isTransportFailure, notifyApiError } from 'api/core/errors';
import { tokenStore } from 'api/core/tokenStore';

vi.mock('axios');
vi.mock('api/core/tokenStore', () => ({
  tokenStore: { acquireValidAccessToken: vi.fn(), forceRefreshAccessToken: vi.fn() },
}));
vi.mock('api/core/endpoints', () => ({
  GRAPHQL_ENDPOINTS: { router: 'https://router/graphql' },
}));

const QUERY = '{ devicePositionsByUser { transporterId } }';
const canceled = { code: 'ERR_CANCELED', message: 'canceled' };

describe('request cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenStore.acquireValidAccessToken).mockResolvedValue('access-token');
  });

  test('the caller signal reaches axios', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { data: { devicePositionsByUser: [] } } });
    const controller = new AbortController();

    await executeGraphQL<unknown, Record<string, never>>('router', QUERY, undefined, { signal: controller.signal });

    expect(vi.mocked(axios.post).mock.calls[0][2]).toMatchObject({ signal: controller.signal });
  });

  test('an aborted GraphQL request is a silent cancellation, not a retryable transport failure', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.mocked(axios.post).mockRejectedValue(canceled);

    const error = await executeGraphQL<unknown, Record<string, never>>('router', QUERY, undefined, {
      signal: controller.signal,
    }).catch((e: unknown) => e);

    expect(isRequestCancelled(error)).toBe(true);
    expect(isTransportFailure(error)).toBe(false);
    expect(tokenStore.forceRefreshAccessToken).not.toHaveBeenCalled();
  });

  test('an aborted REST request is a silent cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.mocked(axios.request).mockRejectedValue(canceled);

    const error = await restRequest({ url: 'https://reporting/x', signal: controller.signal }).catch((e: unknown) => e);

    expect(isRequestCancelled(error)).toBe(true);
    expect(isTransportFailure(error)).toBe(false);
  });

  test('a cancellation never raises the error toast', () => {
    const listener = vi.fn();
    window.addEventListener('app-error', listener);
    try {
      notifyApiError(ApiError.cancelled(canceled));
      expect(listener).not.toHaveBeenCalled();
      notifyApiError(new ApiError('network down'));
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('app-error', listener);
    }
  });
});
