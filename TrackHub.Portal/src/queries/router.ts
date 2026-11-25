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

/**
 * The router reads are imperative (live-map polling, a search-button trip lookup), so consumers use
 * `queryClient.fetchQuery` with these keys. Silent ops are called directly and have no cache entry.
 */

import { useQuery } from '@tanstack/react-query';
import { getProviderCapabilities } from 'api/router/router';
import type { DevicePositionScope, PositionSourceType } from 'api/router/router';

export const routerKeys = {
  all: ['router'] as const,
  devicePositions: ({ groupId = null, operatorId = null }: DevicePositionScope = {}) =>
    [...routerKeys.all, 'devicePositions', groupId, operatorId] as const,
  trips: (transporterId: string, from: string, to: string, source: PositionSourceType) =>
    [...routerKeys.all, 'trips', transporterId, from, to, source] as const,
  providerCapabilities: () => [...routerKeys.all, 'providerCapabilities'] as const,
};

/** Static per deployment (built at Router startup), so it never goes stale within a session. */
export function useProviderCapabilities(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: routerKeys.providerCapabilities(),
    queryFn: ({ signal }) => getProviderCapabilities({ signal }),
    staleTime: Infinity,
    enabled: options.enabled ?? true,
  });
}
