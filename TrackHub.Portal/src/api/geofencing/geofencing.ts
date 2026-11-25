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
import type {
  GeofenceFieldsFragment as GeofenceFieldsType,
  GeofenceDtoInput,
  GetGeofencesByAccountQuery,
  GetTransportersInGeofenceQuery,
} from './generated/graphql';
import {
  GetGeofenceDocument,
  GetGeofencesByAccountDocument,
  GetTransportersInGeofenceDocument,
  CreateGeofenceDocument,
  UpdateGeofenceDocument,
  DeleteGeofenceDocument,
} from './geofencingOperations';

export type Geofence = GeofenceFieldsType;
export type GeofencesPage = GetGeofencesByAccountQuery['geofencesByAccount'];
export type TransporterInGeofence =
  GetTransportersInGeofenceQuery['transportersInGeofence'][number];
export type { GeofenceDtoInput };

export interface GeofenceListFilters {
  skip?: number | null;
  take?: number | null;
  type?: number | null;
  active?: boolean | null;
  search?: string | null;
}

export async function getGeofence(geofenceId: string): Promise<Geofence> {
  const data = await executeGraphQL('geofencing', GetGeofenceDocument, { id: geofenceId });
  return data.geofence;
}

export async function getGeofencesByAccount(
  filters: GeofenceListFilters = {},
  options?: RequestOptions
): Promise<GeofencesPage> {
  const data = await executeGraphQL('geofencing', GetGeofencesByAccountDocument, {
    skip: filters.skip ?? null,
    take: filters.take ?? null,
    type: filters.type ?? null,
    active: filters.active ?? null,
    search: filters.search ?? null,
  }, options);
  return data.geofencesByAccount;
}

const GEOFENCE_PAGE_SIZE = 500;
const GEOFENCE_DRAIN_CAP = 10_000;

/**
 * Drains every server page (the backend clamps `take` to 500) for full-set consumers such as the
 * map editor, dashboard overlay and event-history filter.
 */
export async function getAllGeofencesByAccount(
  filters: Omit<GeofenceListFilters, 'skip' | 'take'> = {},
  options?: RequestOptions
): Promise<Geofence[]> {
  const items: Geofence[] = [];
  let skip = 0;
  for (;;) {
    const page = await getGeofencesByAccount({
      ...filters,
      skip,
      take: GEOFENCE_PAGE_SIZE,
    }, options);
    items.push(...page.items);
    // Stop on an empty page (defensive), once we've reached the reported total,
    // or if we hit the safety cap.
    if (page.items.length === 0) break;
    if (items.length >= page.totalCount) break;
    if (items.length >= GEOFENCE_DRAIN_CAP) break;
    skip += GEOFENCE_PAGE_SIZE;
  }
  return items;
}

export async function getTransportersInGeofence(
  geofenceId?: string | null,
  type?: number | null,
  options?: RequestOptions
): Promise<TransporterInGeofence[]> {
  const data = await executeGraphQL('geofencing', GetTransportersInGeofenceDocument, {
    geofenceId: geofenceId ?? null,
    type: type ?? null,
  }, options);
  return data.transportersInGeofence;
}

export async function createGeofence(geofence: GeofenceDtoInput): Promise<Geofence> {
  const data = await executeGraphQL('geofencing', CreateGeofenceDocument, { geofence });
  return data.createGeofence;
}

export async function updateGeofence(
  geofenceId: string,
  geofence: GeofenceDtoInput
): Promise<boolean> {
  const data = await executeGraphQL('geofencing', UpdateGeofenceDocument, {
    id: geofenceId,
    geofence,
  });
  return data.updateGeofence;
}

export async function deleteGeofence(geofenceId: string): Promise<string> {
  const data = await executeGraphQL('geofencing', DeleteGeofenceDocument, { id: geofenceId });
  return data.deleteGeofence;
}
