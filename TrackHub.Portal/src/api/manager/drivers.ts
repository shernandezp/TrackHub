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
 * Driver API (Manager backend): plain typed async functions. Failures THROW
 * ApiError — fallbacks and toasts belong to the caller layer (src/queries).
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import type { RequestOptions } from 'api/core/errors';
import { fetchAllPages } from 'api/core/paging';
import type { ListParams, Page } from 'api/core/paging';
import type {
  DriverItemFragment as DriverItemType,
  DriverQualificationItemFragment as DriverQualificationItemType,
  DriverTransporterAssignmentItemFragment as DriverAssignmentItemType,
  DriverActiveAssignmentItemFragment as DriverActiveAssignmentItemType,
  DriverDtoInput,
  DriverQualificationDtoInput,
  GetDriverLookupQuery,
} from './generated/graphql';
import {
  GetDriversByAccountDocument,
  GetDriverLookupDocument,
  GetDriverOptionsDocument,
  CreateDriverDocument,
  UpdateDriverDocument,
  DeactivateDriverDocument,
  GetDriverAssignmentsDocument,
  GetDriverQualificationsDocument,
  CreateDriverQualificationDocument,
  UpdateDriverQualificationDocument,
  DeleteDriverQualificationDocument,
  GetDriverAssignmentHistoryDocument,
  AssignDriverToTransporterDocument,
  EndDriverAssignmentDocument,
} from './driverOperations';

export type Driver = DriverItemType;
/** Picker projection (id, name, active) served under Trips/Read: no phone, document or licence. */
export type DriverLookup = GetDriverLookupQuery['driverLookup'][number];
export type DriverQualification = DriverQualificationItemType;
export type DriverTransporterAssignment = DriverAssignmentItemType;
/** Time-aware active assignment projection (spec 09 §7.2); no assignment row id. */
export type DriverActiveAssignment = DriverActiveAssignmentItemType;
export type { DriverDtoInput, DriverQualificationDtoInput };

/** Filters accepted by the account-wide assignment-history query. */
export interface DriverAssignmentHistoryFilters {
  driverId?: string | null;
  transporterId?: string | null;
  from?: string | null;
  to?: string | null;
}

/** Builds a clean DriverDtoInput, dropping any extra fields carried by the form. */
function toDriverDto(driver: DriverDtoInput): DriverDtoInput {
  return {
    accountId: driver.accountId,
    name: driver.name,
    phone: driver.phone ?? null,
    documentType: driver.documentType ?? null,
    documentNumber: driver.documentNumber ?? null,
    active: driver.active !== false,
    employeeCode: driver.employeeCode ?? null,
    licenseNumber: driver.licenseNumber ?? null,
    licenseExpiresAt: driver.licenseExpiresAt ?? null,
    defaultTransporterId: driver.defaultTransporterId || null,
    expectedVersion: driver.expectedVersion ?? null,
  };
}

/** One page of account drivers. Callers that must see EVERY driver use {@link getAllDriversByAccount}. */
export async function getDriversByAccount(
  accountId: string,
  skip = 0,
  take = 50,
  search: string | null = null,
  options?: RequestOptions
): Promise<Page<Driver>> {
  const data = await executeGraphQL('manager', GetDriversByAccountDocument, {
    accountId,
    search,
    skip,
    take,
  }, options);
  return data.driversByAccount;
}

/**
 * Every driver on the account, paged to exhaustion. The driver pickers on every
 * workforce surface read from this: a single clamped page would make drivers
 * past the page boundary unadministrable (no credential, no qualification, no
 * assignment could ever be created for them) with no error shown.
 */
export async function getAllDriversByAccount(accountId: string, options?: RequestOptions): Promise<Driver[]> {
  return fetchAllPages(async (skip, take) => (await getDriversByAccount(accountId, skip, take, undefined, options)).items);
}

export async function createDriver(driver: DriverDtoInput): Promise<Driver> {
  const data = await executeGraphQL('manager', CreateDriverDocument, { driver: toDriverDto(driver) });
  return data.createDriver;
}

export async function updateDriver(driverId: string, driver: DriverDtoInput): Promise<boolean> {
  const data = await executeGraphQL('manager', UpdateDriverDocument, {
    driverId,
    driver: toDriverDto(driver),
  });
  return data.updateDriver;
}

export async function deactivateDriver(driverId: string): Promise<boolean> {
  const data = await executeGraphQL('manager', DeactivateDriverDocument, { driverId });
  return data.deactivateDriver;
}

/** Builds a clean DriverQualificationDtoInput, dropping form-only fields. */
function toQualificationDto(q: DriverQualificationDtoInput): DriverQualificationDtoInput {
  return {
    accountId: q.accountId,
    driverId: q.driverId,
    qualificationType: q.qualificationType,
    category: q.category || null,
    number: q.number || null,
    issuedAt: q.issuedAt || null,
    expiresAt: q.expiresAt || null,
    issuingAuthority: q.issuingAuthority || null,
    status: q.status,
    documentId: q.documentId || null,
    notes: q.notes || null,
  };
}

export async function getDriverQualifications(
  accountId: string,
  driverId: string | null = null,
  expiringWithinDays: number | null = null,
  skip = 0,
  take = 100,
  options?: RequestOptions
): Promise<Page<DriverQualification>> {
  const data = await executeGraphQL('manager', GetDriverQualificationsDocument, {
    accountId,
    driverId,
    expiringWithinDays,
    skip,
    take,
  }, options);
  return data.driverQualifications;
}

/** Every qualification matching the filter, paged to exhaustion. */
export async function getAllDriverQualifications(
  accountId: string,
  driverId: string | null = null,
  expiringWithinDays: number | null = null,
  options?: RequestOptions
): Promise<DriverQualification[]> {
  return fetchAllPages(async (skip, take) =>
    (await getDriverQualifications(accountId, driverId, expiringWithinDays, skip, take, options)).items
  );
}

export async function createDriverQualification(
  qualification: DriverQualificationDtoInput
): Promise<DriverQualification> {
  const data = await executeGraphQL('manager', CreateDriverQualificationDocument, {
    qualification: toQualificationDto(qualification),
  });
  return data.createDriverQualification;
}

export async function updateDriverQualification(
  driverQualificationId: string,
  qualification: DriverQualificationDtoInput
): Promise<boolean> {
  const data = await executeGraphQL('manager', UpdateDriverQualificationDocument, {
    driverQualificationId,
    qualification: toQualificationDto(qualification),
  });
  return data.updateDriverQualification;
}

export async function deleteDriverQualification(driverQualificationId: string): Promise<string> {
  const data = await executeGraphQL('manager', DeleteDriverQualificationDocument, {
    driverQualificationId,
  });
  return data.deleteDriverQualification;
}

export async function getDriverAssignmentHistory(
  accountId: string,
  filters: DriverAssignmentHistoryFilters = {},
  skip = 0,
  take = 100,
  options?: RequestOptions
): Promise<Page<DriverTransporterAssignment>> {
  const data = await executeGraphQL('manager', GetDriverAssignmentHistoryDocument, {
    accountId,
    driverId: filters.driverId || null,
    transporterId: filters.transporterId || null,
    from: filters.from || null,
    to: filters.to || null,
    skip,
    take,
  }, options);
  return data.driverAssignmentHistory;
}

/**
 * Every history row matching the filter, paged to exhaustion (capped by
 * `MAX_FETCH_ALL_ITEMS` — the caller compares against it and asks the user to
 * narrow the filters rather than truncating silently).
 */
export async function getAllDriverAssignmentHistory(
  accountId: string,
  filters: DriverAssignmentHistoryFilters = {},
  options?: RequestOptions
): Promise<DriverTransporterAssignment[]> {
  return fetchAllPages(async (skip, take) =>
    (await getDriverAssignmentHistory(accountId, filters, skip, take, options)).items
  );
}

/**
 * The driver's currently-active assignments (spec 09 §7.2). Unpaged and
 * time-aware server-side, so it is the only correct source for an "active"
 * list — the history query is ordered `StartsAt DESC` and paged, so a long-lived
 * assignment sorts below any page boundary and would disappear.
 *
 * Note the VM carries no assignment row id: `resourceId` is the transporter id,
 * and the last entry may be the synthesized default-transporter one, which has
 * no underlying row at all.
 */
export async function getDriverAssignments(driverId: string, options?: RequestOptions): Promise<DriverActiveAssignment[]> {
  const data = await executeGraphQL('manager', GetDriverAssignmentsDocument, { driverId }, options);
  return data.driverAssignments;
}

export async function assignDriverToTransporter(
  driverId: string,
  transporterId: string,
  startsAt: string,
  assignmentType: string
): Promise<DriverTransporterAssignment> {
  const data = await executeGraphQL('manager', AssignDriverToTransporterDocument, {
    driverId,
    transporterId,
    startsAt,
    assignmentType,
  });
  return data.assignDriverToTransporter;
}

export async function endDriverAssignment(
  driverTransporterAssignmentId: string,
  endsAt: string | null = null
): Promise<boolean> {
  const data = await executeGraphQL('manager', EndDriverAssignmentDocument, {
    driverTransporterAssignmentId,
    endsAt,
  });
  return data.endDriverAssignment;
}

/**
 * Names and ids for pickers and boards. A search offers the account's active drivers; a list of
 * ids names exactly those drivers, active or not.
 */
export async function getDriverLookup(search?: string | null, driverIds?: string[] | null, options?: RequestOptions): Promise<DriverLookup[]> {
  const data = await executeGraphQL('manager', GetDriverLookupDocument, {
    search: search || null,
    driverIds: driverIds && driverIds.length > 0 ? driverIds : null,
  }, options);
  return data.driverLookup;
}

/** The account's drivers, active or not, for the driver-operations pickers (DriverOperations/Read). */
export async function getDriverOptions(params: ListParams = {}, options?: RequestOptions): Promise<Page<DriverLookup>> {
  const data = await executeGraphQL('manager', GetDriverOptionsDocument, {
    search: params.search || null,
    skip: params.skip ?? null,
    take: params.take ?? null,
  }, options);
  return data.driverOptions;
}
