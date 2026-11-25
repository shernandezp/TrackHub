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

import { executeGraphQL } from 'api/core/graphqlClient';
import type { RequestOptions } from 'api/core/errors';
import { fetchAllPages } from 'api/core/paging';
import type { ListParams, Page } from 'api/core/paging';
import type {
  OperatorDetailFragment as OperatorDetailType,
  OperatorGpsFragment as OperatorGpsType,
  GetOperatorLookupQuery,
  OperatorDtoInput,
  UpdateOperatorDtoInput,
  TriggerOperatorDeviceSyncCommandInput,
} from './generated/graphql';
import {
  GetOperatorsByCurrentAccountDocument,
  GetOperatorLookupDocument,
  GetGpsOperatorsDocument,
  CreateOperatorDocument,
  UpdateOperatorDocument,
  DeleteOperatorDocument,
  SetOperatorEnabledDocument,
  TriggerOperatorDeviceSyncDocument,
} from './operatorOperations';

export type Operator = OperatorDetailType;
export type OperatorsPage = Page<Operator>;
export type OperatorLookup = GetOperatorLookupQuery['operatorLookup'][number];
export type GpsOperator = OperatorGpsType;
export type GpsOperatorsPage = Page<GpsOperator>;
export type { OperatorDtoInput, UpdateOperatorDtoInput, TriggerOperatorDeviceSyncCommandInput };

const DEFAULT_SYNC_INTERVAL_MINUTES = 30;

function positiveIntOr(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(value as string, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getOperatorsByCurrentAccount(
  params: ListParams = {},
  options?: RequestOptions
): Promise<OperatorsPage> {
  const data = await executeGraphQL('manager', GetOperatorsByCurrentAccountDocument, {
    skip: params.skip ?? null,
    take: params.take ?? null,
    search: params.search ?? null,
  }, options);
  return data.operatorsByCurrentAccount;
}

/** Unpaged by design: the server raises past its own ceiling rather than truncating. */
export async function getOperatorLookup(options?: RequestOptions): Promise<OperatorLookup[]> {
  const data = await executeGraphQL('manager', GetOperatorLookupDocument, undefined, options);
  return data.operatorLookup;
}

export async function getGpsOperators(params: ListParams = {}, options?: RequestOptions): Promise<GpsOperatorsPage> {
  const data = await executeGraphQL('manager', GetGpsOperatorsDocument, {
    skip: params.skip ?? null,
    take: params.take ?? null,
    search: params.search ?? null,
  }, options);
  return data.operatorsByCurrentAccount;
}

/**
 * All pages drained: the GPS screens filter and label rows by operator, and the lookup carries
 * only id + name, so the full record set is required.
 */
export async function getAllGpsOperators(options?: RequestOptions): Promise<GpsOperator[]> {
  return fetchAllPages(async (skip, take) => (await getGpsOperators({ skip, take }, options)).items);
}

export async function createOperator(operator: OperatorDtoInput): Promise<Operator> {
  const input: OperatorDtoInput = {
    name: operator.name,
    description: operator.description ?? null,
    phoneNumber: operator.phoneNumber ?? null,
    emailAddress: operator.emailAddress ?? null,
    address: operator.address ?? null,
    contactName: operator.contactName ?? null,
    protocolTypeId: operator.protocolTypeId,
    syncIntervalMinutes: positiveIntOr(operator.syncIntervalMinutes, DEFAULT_SYNC_INTERVAL_MINUTES),
  };
  const data = await executeGraphQL('manager', CreateOperatorDocument, { operator: input });
  return data.createOperator;
}

export async function updateOperator(
  operatorId: string,
  operator: Omit<UpdateOperatorDtoInput, 'operatorId'>
): Promise<boolean> {
  const input: UpdateOperatorDtoInput = {
    operatorId,
    name: operator.name,
    description: operator.description ?? null,
    phoneNumber: operator.phoneNumber ?? null,
    emailAddress: operator.emailAddress ?? null,
    address: operator.address ?? null,
    contactName: operator.contactName ?? null,
    protocolTypeId: operator.protocolTypeId,
    syncIntervalMinutes: positiveIntOr(operator.syncIntervalMinutes, DEFAULT_SYNC_INTERVAL_MINUTES),
    expectedVersion: operator.expectedVersion ?? null,
  };
  const data = await executeGraphQL('manager', UpdateOperatorDocument, { id: operatorId, operator: input });
  return data.updateOperator;
}

export async function deleteOperator(operatorId: string): Promise<string> {
  const data = await executeGraphQL('manager', DeleteOperatorDocument, { id: operatorId });
  return data.deleteOperator;
}

export async function setOperatorEnabled(operatorId: string, enabled: boolean): Promise<boolean> {
  const data = await executeGraphQL('manager', SetOperatorEnabledDocument, { operatorId, enabled });
  return data.setOperatorEnabled;
}

export async function triggerOperatorDeviceSync(
  operatorId: string,
  resetDeviceCatalog = false,
  autoAssignNewDevices = true
): Promise<boolean> {
  const command: TriggerOperatorDeviceSyncCommandInput = {
    operatorId,
    resetDeviceCatalog: !!resetDeviceCatalog,
    autoAssignNewDevices: !!autoAssignNewDevices,
  };
  const data = await executeGraphQL('manager', TriggerOperatorDeviceSyncDocument, { command });
  return data.triggerOperatorDeviceSync;
}
