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
 * Device query/mutation hooks. Components consume these — not the api layer
 * directly. Loading/error state comes from the hooks; failures also surface in
 * the global toast via the query client's error handlers. Synchronized-device
 * reads/mutations are called imperatively from the GPS-integration screens.
 */

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'api/manager/devices';
import type { ListParams } from 'api/core/paging';

export const deviceKeys = {
  all: ['devices'] as const,
  byAccount: (params: ListParams = {}) => [...deviceKeys.all, 'byAccount', params] as const,
  name: (id: string) => [...deviceKeys.all, 'name', id] as const,
  unassignedAll: (accountId: string) => [...deviceKeys.all, 'unassigned', accountId] as const,
  unassigned: (accountId: string, params: ListParams = {}) =>
    [...deviceKeys.unassignedAll(accountId), params] as const,
};

/** One server page of the account's provider devices not assigned to any unit (the assign picker). */
export function useUnassignedSynchronizedDevices(
  accountId: string | undefined,
  params: ListParams = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: deviceKeys.unassigned(accountId ?? '', params),
    queryFn: ({ signal }) => api.getUnassignedSynchronizedDevices(accountId as string, params, { signal }),
    enabled: (options.enabled ?? true) && !!accountId,
    placeholderData: keepPreviousData,
  });
}

/** One server page of devices (`{ items, totalCount }`) for the device list. */
export function useDevicesByAccount(params: ListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: deviceKeys.byAccount(params),
    queryFn: ({ signal }) => api.getDevicesByAccount(params, { signal }),
    enabled: options.enabled ?? true,
    // A page change swaps the query key; without a placeholder the list reads as EMPTY
    // (totalCount 0) while the next page loads, and the page clamp snaps it back to page one.
    placeholderData: keepPreviousData,
  });
}

/** Names exactly the given devices, for the rows of one table page. */
export function useDeviceNames(deviceIds: readonly string[]) {
  const results = useQueries({
    queries: deviceIds.map((deviceId) => ({
      queryKey: deviceKeys.name(deviceId),
      queryFn: ({ signal }: { signal: AbortSignal }) => api.getDeviceName(deviceId, { signal }),
      staleTime: 5 * 60_000,
    })),
  });
  return new Map(
    results.flatMap((result) => (result.data ? [[result.data.deviceId, result.data.name] as const] : []))
  );
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => api.deleteDevice(deviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deviceKeys.all }),
  });
}
