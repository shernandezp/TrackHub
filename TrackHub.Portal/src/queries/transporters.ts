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
 * Transporter query/mutation hooks. Components consume these — not the api
 * layer directly. Loading/error state comes from the hooks; failures also
 * surface in the global toast via the query client's error handlers.
 */

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'api/manager/transporters';
import type {
  TransporterDtoInput,
  UpdateTransporterDtoInput,
  TransporterDeviceAssignmentDtoInput,
} from 'api/manager/transporters';
import type { ListParams } from 'api/core/paging';

export const transporterKeys = {
  all: ['transporters'] as const,
  byAccount: (params: ListParams = {}) =>
    [...transporterKeys.all, 'byAccount', params] as const,
  byUser: (params: ListParams = {}) => [...transporterKeys.all, 'byUser', params] as const,
  retired: (params: ListParams = {}) => [...transporterKeys.all, 'retired', params] as const,
  byGroup: (groupId: number) => [...transporterKeys.all, 'byGroup', groupId] as const,
  lookupByUser: () => [...transporterKeys.all, 'lookupByUser'] as const,
  detail: (id: string) => [...transporterKeys.all, 'detail', id] as const,
  assignments: ['transporterDeviceAssignments'] as const,
  assignmentsByAccount: (accountId: string, activeOnly: boolean, params: ListParams = {}) =>
    [...transporterKeys.assignments, 'byAccount', accountId, activeOnly, params] as const,
  assignmentsByTransporter: (transporterId: string, activeOnly: boolean) =>
    [...transporterKeys.assignments, 'byTransporter', transporterId, activeOnly] as const,
};

/** One server page of the account's transporters, for the admin list screen. */
export function useTransportersByAccount(
  params: ListParams = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: transporterKeys.byAccount(params),
    queryFn: ({ signal }) => api.getTransportersByAccount(params, { signal }),
    enabled: options.enabled ?? true,
    // A page change swaps the query key; without a placeholder the list reads as EMPTY
    // (totalCount 0) while the next page loads, and the page clamp snaps it back to page one.
    placeholderData: keepPreviousData,
  });
}

/** The transporters the signed-in user may track, as id + name. */
export function useTransporterLookupByUser(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: transporterKeys.lookupByUser(),
    queryFn: ({ signal }) => api.getTransporterLookupByUser({ signal }),
    enabled: options.enabled ?? true,
  });
}

/** One server page of the transporters the signed-in user may track (the user-scoped picker source). */
export function useTransportersByUser(params: ListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: transporterKeys.byUser(params),
    queryFn: ({ signal }) => api.getTransportersByUser(params, { signal }),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

/** Names exactly the given transporters, for a picker's current value or a short list of ids. */
export function useTransporterNames(transporterIds: readonly string[]) {
  const results = useQueries({
    queries: transporterIds.map((transporterId) => ({
      queryKey: transporterKeys.detail(transporterId),
      queryFn: ({ signal }: { signal: AbortSignal }) => api.getTransporter(transporterId, { signal }),
      staleTime: 5 * 60_000,
    })),
  });
  return new Map(
    results.flatMap((result) => (result.data ? [[result.data.transporterId, result.data.name] as const] : []))
  );
}

/**
 * A group's complete transporter membership (all server pages drained): the
 * allocator dialog excludes it from its picker, and a partial list would offer
 * already-assigned units again.
 */
export function useTransportersByGroup(groupId: number | undefined) {
  return useQuery({
    queryKey: transporterKeys.byGroup(groupId ?? -1),
    queryFn: ({ signal }) => api.getAllTransportersByGroup(groupId as number, { signal }),
    enabled: groupId !== undefined,
  });
}

export function useCreateTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transporter: TransporterDtoInput) => api.createTransporter(transporter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transporterKeys.all }),
  });
}

export function useUpdateTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      transporterId,
      ...transporter
    }: Omit<UpdateTransporterDtoInput, 'transporterId'> & { transporterId: string }) =>
      api.updateTransporter(transporterId, transporter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transporterKeys.all }),
  });
}

export function useRetiredTransporters(params: ListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: transporterKeys.retired(params),
    queryFn: ({ signal }) => api.getRetiredTransporters(params, { signal }),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useRestoreTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transporterId: string) => api.restoreTransporter(transporterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transporterKeys.all }),
  });
}

export function useDeleteTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transporterId: string) => api.deleteTransporter(transporterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transporterKeys.all }),
  });
}

/** One server page of the account's device assignments (`{ items, totalCount }`). */
export function useTransporterDeviceAssignmentsByAccount(
  accountId: string | undefined,
  activeOnly = false,
  params: ListParams = {}
) {
  return useQuery({
    queryKey: transporterKeys.assignmentsByAccount(accountId ?? '', activeOnly, params),
    queryFn: ({ signal }) =>
      api.getTransporterDeviceAssignmentsByAccount(accountId as string, { activeOnly, ...params }, { signal }),
    enabled: !!accountId,
    // A page change swaps the query key; without a placeholder the list reads as EMPTY
    // (totalCount 0) while the next page loads, and the page clamp snaps it back to page one.
    placeholderData: keepPreviousData,
  });
}

export function useAssignDeviceToTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignment: TransporterDeviceAssignmentDtoInput) =>
      api.assignDeviceToTransporter(assignment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transporterKeys.assignments }),
  });
}

export function useEndDeviceTransporterAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason?: string | null }) =>
      api.endDeviceTransporterAssignment(assignmentId, reason ?? null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transporterKeys.assignments }),
  });
}
