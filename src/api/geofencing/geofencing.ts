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
 * Geofencing API (Geofencing backend): plain typed async functions. Failures
 * THROW ApiError — fallbacks and toasts belong to the caller layer
 * (src/queries handles both for components).
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import type {
  GeofenceFieldsFragment as GeofenceFieldsType,
  GeofenceDtoInput,
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
export type TransporterInGeofence =
  GetTransportersInGeofenceQuery['transportersInGeofence'][number];
export type { GeofenceDtoInput };

export async function getGeofence(geofenceId: string): Promise<Geofence> {
  const data = await executeGraphQL('geofencing', GetGeofenceDocument, { id: geofenceId });
  return data.geofence;
}

export async function getGeofencesByAccount(enableCaching = false): Promise<Geofence[]> {
  const data = await executeGraphQL('geofencing', GetGeofencesByAccountDocument, { enableCaching });
  return data.geofencesByAccount;
}

export async function getTransportersInGeofence(): Promise<TransporterInGeofence[]> {
  const data = await executeGraphQL('geofencing', GetTransportersInGeofenceDocument);
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

/** Returns the id of the deleted geofence (schema: `deleteGeofence: UUID!`). */
export async function deleteGeofence(geofenceId: string): Promise<string> {
  const data = await executeGraphQL('geofencing', DeleteGeofenceDocument, { id: geofenceId });
  return data.deleteGeofence;
}
