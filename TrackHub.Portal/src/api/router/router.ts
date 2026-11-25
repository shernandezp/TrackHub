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
 * `pingOperator` and `reverseGeocode` are silent: their callers swallow the error rather than
 * routing it through the query-cache handler.
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import type { RequestOptions } from 'api/core/errors';
import { formatDateTimeOffSet } from 'utils/dataUtils';
import type {
  PositionFieldsFragment as PositionFieldsType,
  TripFieldsFragment as TripFieldsType,
  AddressFieldsFragment as AddressFieldsType,
  GetProviderCapabilitiesQuery,
  PositionSourceType,
} from './generated/graphql';
import {
  PingOperatorDocument,
  GetDevicePositionsByUserDocument,
  GetTripsByTransporterDocument,
  ReverseGeocodeDocument,
  GetProviderCapabilitiesDocument,
} from './routerOperations';

export type Position = PositionFieldsType;
export type Trip = TripFieldsType;
export type Address = AddressFieldsType;
export type ProviderCapabilities = GetProviderCapabilitiesQuery['providerCapabilities'][number];
export type { PositionSourceType };

/** Doubles as the provider list for operator screens: the portal carries no local protocol table. */
export async function getProviderCapabilities(options?: RequestOptions): Promise<ProviderCapabilities[]> {
  const data = await executeGraphQL('router', GetProviderCapabilitiesDocument, undefined, options);
  return data.providerCapabilities;
}

/** Silent op: throws on transport failure. */
export async function pingOperator(operatorId: string): Promise<boolean> {
  const data = await executeGraphQL('router', PingOperatorDocument, { operatorId });
  return data.pingOperator;
}

/** Server-side narrowing of the live positions; an absent member means no narrowing. */
export interface DevicePositionScope {
  groupId?: number | null;
  operatorId?: string | null;
}

export async function getDevicePositions(
  { groupId = null, operatorId = null }: DevicePositionScope = {},
  options?: RequestOptions
): Promise<Position[]> {
  const data = await executeGraphQL('router', GetDevicePositionsByUserDocument, { groupId, operatorId }, options);
  return data.devicePositionsByUser;
}

export async function getTripsByTransporter(
  transporterId: string,
  from: string | Date,
  to: string | Date,
  source: PositionSourceType = 'PROVIDER',
  options?: RequestOptions
): Promise<Trip[]> {
  const data = await executeGraphQL('router', GetTripsByTransporterDocument, {
    transporterId,
    from: formatDateTimeOffSet(from) as string,
    to: formatDateTimeOffSet(to) as string,
    source,
  }, options);
  return data.tripsByTransporter;
}

/**
 * Silent op. With a transporterId the backend also persists the address onto the transporter's
 * latest-position row. Map callers swallow failures and keep their local cache untouched.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  transporterId: string | null = null
): Promise<Address> {
  const data = await executeGraphQL('router', ReverseGeocodeDocument, {
    latitude,
    longitude,
    transporterId,
  });
  return data.reverseGeocode;
}
