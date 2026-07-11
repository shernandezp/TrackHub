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
 * Geofence query/mutation hooks. Components consume these — not the api layer
 * directly. Loading/error state comes from the hooks; failures also surface in
 * the global toast via the query client's error handlers. `transportersInGeofence`
 * is read imperatively (live-map refresh) via the key here + fetchQuery.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'api/geofencing/geofencing';
import type { GeofenceDtoInput } from 'api/geofencing/geofencing';

export const geofenceKeys = {
  all: ['geofences'] as const,
  byAccount: (enableCaching: boolean) => [...geofenceKeys.all, 'byAccount', enableCaching] as const,
  detail: (id: string) => [...geofenceKeys.all, 'detail', id] as const,
  transportersInGeofence: ['transportersInGeofence'] as const,
};

export function useGeofencesByAccount(
  enableCaching = false,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: geofenceKeys.byAccount(enableCaching),
    queryFn: () => api.getGeofencesByAccount(enableCaching),
    enabled: options.enabled ?? true,
  });
}

export function useCreateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (geofence: GeofenceDtoInput) => api.createGeofence(geofence),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geofenceKeys.all }),
  });
}

export function useUpdateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ geofenceId, geofence }: { geofenceId: string; geofence: GeofenceDtoInput }) =>
      api.updateGeofence(geofenceId, geofence),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geofenceKeys.all }),
  });
}

export function useDeleteGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (geofenceId: string) => api.deleteGeofence(geofenceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: geofenceKeys.all }),
  });
}
