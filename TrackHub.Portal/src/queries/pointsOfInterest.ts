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

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'api/manager/pointsOfInterest';
import type {
  PointOfInterestDtoInput,
  UpdatePointOfInterestDtoInput,
} from 'api/manager/pointsOfInterest';
import type { ListParams } from 'api/core/paging';

export const poiKeys = {
  all: ['pointsOfInterest'] as const,
  byAccount: (params: ListParams = {}) => [...poiKeys.all, 'byAccount', params] as const,
  lookup: () => [...poiKeys.all, 'lookup'] as const,
};

export function usePointsOfInterestByAccount(
  params: ListParams & { active?: boolean | null } = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: poiKeys.byAccount(params),
    queryFn: ({ signal }) => api.getPointsOfInterestByAccount(params, { signal }),
    enabled: options.enabled ?? true,
    // A page change swaps the query key; without a placeholder the list reads as EMPTY
    // (totalCount 0) while the next page loads, and the page clamp snaps it back to page one.
    placeholderData: keepPreviousData,
  });
}

/** Unpaged by design. Keyed under {@link poiKeys.all} so one invalidation refreshes it alongside the paged list. */
export function usePointOfInterestLookup(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: poiKeys.lookup(),
    queryFn: ({ signal }) => api.getPointOfInterestLookup({ signal }),
    enabled: options.enabled ?? true,
  });
}

export function useCreatePointOfInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poi: PointOfInterestDtoInput) => api.createPointOfInterest(poi),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poiKeys.all }),
  });
}

export function useUpdatePointOfInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pointOfInterestId,
      ...poi
    }: UpdatePointOfInterestDtoInput & { pointOfInterestId: string }) =>
      api.updatePointOfInterest(pointOfInterestId, poi),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poiKeys.all }),
  });
}

export function useDeletePointOfInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pointOfInterestId: string) => api.deletePointOfInterest(pointOfInterestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poiKeys.all }),
  });
}
