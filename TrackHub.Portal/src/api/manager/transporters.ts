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
 * Transporter API (Manager backend): plain typed async functions. Failures
 * THROW ApiError — fallbacks and toasts belong to the caller layer
 * (src/queries handles both for components).
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import type { RequestOptions } from 'api/core/errors';
import { fetchAllPages } from 'api/core/paging';
import type { ListParams, Page } from 'api/core/paging';
import type {
  TransporterItemFragment as TransporterItemType,
  AssignmentFieldsFragment as AssignmentFieldsType,
  TransporterDtoInput,
  UpdateTransporterDtoInput,
  TransporterDeviceAssignmentDtoInput,
  GetTransporterDeviceAssignmentsByAccountQuery,
  GetTransporterLookupByUserQuery,
} from './generated/graphql';
import {
  GetTransportersByAccountDocument,
  GetTransportersByGroupDocument,
  GetTransportersByUserDocument,
  GetTransporterDocument,
  GetTransporterLookupByUserDocument,
  GetRetiredTransportersDocument,
  RestoreTransporterDocument,
  CreateTransporterDocument,
  UpdateTransporterDocument,
  DeleteTransporterDocument,
  GetTransporterDeviceAssignmentsByAccountDocument,
  AssignDeviceToTransporterDocument,
  EndDeviceTransporterAssignmentDocument,
} from './transporterOperations';

export type Transporter = TransporterItemType;
export type TransportersPage = Page<Transporter>;
export type TransporterLookup =
  GetTransporterLookupByUserQuery['transporterLookupByUser'][number];
export type TransporterAssignment = AssignmentFieldsType;
export type TransporterAssignmentWithAudit =
  GetTransporterDeviceAssignmentsByAccountQuery['transporterDeviceAssignmentsByAccount']['items'][number];
export type TransporterAssignmentsPage = Page<TransporterAssignmentWithAudit>;
export type { TransporterDtoInput, UpdateTransporterDtoInput, TransporterDeviceAssignmentDtoInput };

/** Paging plus the assignment-specific `activeOnly` toggle (no server-side search). */
export interface TransporterAssignmentFilters extends Omit<ListParams, 'search'> {
  activeOnly?: boolean;
}

export async function getTransportersByAccount(
  params: ListParams = {},
  options?: RequestOptions
): Promise<TransportersPage> {
  const data = await executeGraphQL('manager', GetTransportersByAccountDocument, {
    skip: params.skip ?? null,
    take: params.take ?? null,
    search: params.search ?? null,
  }, options);
  return data.transportersByAccount;
}

/** One server page of the transporters the signed-in user may track. */
export async function getTransportersByUser(params: ListParams = {}, options?: RequestOptions): Promise<TransportersPage> {
  const data = await executeGraphQL('manager', GetTransportersByUserDocument, {
    skip: params.skip ?? null,
    take: params.take ?? null,
    search: params.search ?? null,
  }, options);
  return data.transportersByUser;
}

export async function getTransporter(transporterId: string, options?: RequestOptions): Promise<Transporter> {
  const data = await executeGraphQL('manager', GetTransporterDocument, { id: transporterId }, options);
  return data.transporter;
}

export async function getRetiredTransporters(params: ListParams = {}, options?: RequestOptions): Promise<TransportersPage> {
  const data = await executeGraphQL('manager', GetRetiredTransportersDocument, {
    skip: params.skip ?? null,
    take: params.take ?? null,
    search: params.search ?? null,
  }, options);
  return data.retiredTransporters;
}

export async function getTransportersByGroup(
  groupId: number,
  params: ListParams = {},
  options?: RequestOptions
): Promise<TransportersPage> {
  const data = await executeGraphQL('manager', GetTransportersByGroupDocument, {
    groupId,
    skip: params.skip ?? null,
    take: params.take ?? null,
    search: params.search ?? null,
  }, options);
  return data.transportersByGroup;
}

/** The transporters the signed-in user may track, as id + name. Unpaged by design. */
export async function getTransporterLookupByUser(options?: RequestOptions): Promise<TransporterLookup[]> {
  const data = await executeGraphQL('manager', GetTransporterLookupByUserDocument, undefined, options);
  return data.transporterLookupByUser;
}

/**
 * Every transporter in a group, all server pages drained: the allocator dialog lists the whole
 * membership and excludes it from its server-searched picker.
 */
export async function getAllTransportersByGroup(groupId: number, options?: RequestOptions): Promise<Transporter[]> {
  return fetchAllPages(
    async (skip, take) => (await getTransportersByGroup(groupId, { skip, take }, options)).items
  );
}

export async function createTransporter(transporter: TransporterDtoInput): Promise<Transporter> {
  const data = await executeGraphQL('manager', CreateTransporterDocument, { transporter });
  return data.createTransporter;
}

export async function updateTransporter(
  transporterId: string,
  transporter: Omit<UpdateTransporterDtoInput, 'transporterId'>
): Promise<boolean> {
  const data = await executeGraphQL('manager', UpdateTransporterDocument, {
    id: transporterId,
    transporter: { ...transporter, transporterId },
  });
  return data.updateTransporter;
}

export async function deleteTransporter(transporterId: string): Promise<string> {
  const data = await executeGraphQL('manager', DeleteTransporterDocument, { id: transporterId });
  return data.deleteTransporter;
}

export async function restoreTransporter(transporterId: string): Promise<string> {
  const data = await executeGraphQL('manager', RestoreTransporterDocument, { id: transporterId });
  return data.restoreTransporter;
}

export async function getTransporterDeviceAssignmentsByAccount(
  accountId: string,
  filters: TransporterAssignmentFilters = {},
  options?: RequestOptions
): Promise<TransporterAssignmentsPage> {
  const data = await executeGraphQL('manager', GetTransporterDeviceAssignmentsByAccountDocument, {
    accountId,
    activeOnly: filters.activeOnly ?? false,
    skip: filters.skip ?? null,
    take: filters.take ?? null,
  }, options);
  return data.transporterDeviceAssignmentsByAccount;
}

export async function assignDeviceToTransporter(
  assignment: TransporterDeviceAssignmentDtoInput
): Promise<{ transporterDeviceAssignmentId: string }> {
  const data = await executeGraphQL('manager', AssignDeviceToTransporterDocument, { assignment });
  return data.assignDeviceToTransporter;
}

export async function endDeviceTransporterAssignment(
  assignmentId: string,
  reason: string | null = null
): Promise<boolean> {
  const data = await executeGraphQL('manager', EndDeviceTransporterAssignmentDocument, {
    assignmentId,
    reason,
  });
  return data.endDeviceTransporterAssignment;
}
