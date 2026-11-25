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
 * Sanctioned anonymous fetch: `restClient.restRequest` always acquires a token, and the recipient
 * of a shared link has nothing to sign in with. Failures are still normalized to `ApiError` so the
 * page can tell 404 (missing/revoked/wrong scope/feature disabled) from 410 (expired).
 *
 * The response is the server's already-projected snapshot; the page renders what it receives and
 * never re-filters or substitutes placeholders.
 */

import axios, { AxiosError } from 'axios';
import { ApiError, isCancellation, type RequestOptions } from 'api/core/errors';
import { REST_ENDPOINTS } from 'api/core/endpoints';

/** A stop as an end customer sees it — no ids, no POD content, existence flag only. */
export interface PublicTripStop {
  sequence: number;
  name: string;
  city?: string | null;
  status: string;
  plannedArrivalFrom?: string | null;
  plannedArrivalTo?: string | null;
  actualArrivalAt?: string | null;
  etaAt?: string | null;
  hasProofOfDelivery: boolean;
}

/**
 * Every optional field is genuinely absent when the share did not grant it: test for presence and
 * never show a placeholder for a withheld field. Toll and cost figures are never present.
 */
export interface PublicTrip {
  tripId: string;
  code: string;
  status: string;
  plannedStartAt: string;
  plannedEndAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  /**
   * Deliberately NO `customerName`: on a multi-drop trip the consignee is not the same party as
   * every link holder, so disclosing it would tell one recipient who another is. Do not re-add it
   * to mirror the internal `TripVm`.
   */
  stops: PublicTripStop[];
  /** Present only when the share includes the vehicle. */
  vehicleLabel?: string | null;
  /** Given name only — never a full name, never contact data. */
  staffGivenName?: string | null;
  /** Live position: present only when shared AND the trip is in progress. */
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastPositionAt?: string | null;
  /** Present ONLY when the share ticked `includeRoute` (default false); absence is the normal case. */
  plannedRoute?: { coordinates: Array<{ latitude: number; longitude: number }> } | null;
}

export interface PublicTripLinkParams {
  publicLinkGrantId: string;
  accountId: string;
  resourceId: string;
  token: string;
}

export type PublicTripErrorCode = 'NOT_FOUND' | 'EXPIRED' | 'INVALID_LINK' | 'UNAVAILABLE';

/** Returns null when any parameter is missing. */
export function parsePublicTripLink(search: string): PublicTripLinkParams | null {
  const params = new URLSearchParams(search);
  const publicLinkGrantId = params.get('grant');
  const accountId = params.get('account');
  const resourceId = params.get('trip');
  const token = params.get('token');
  if (!publicLinkGrantId || !accountId || !resourceId || !token) return null;
  return { publicLinkGrantId, accountId, resourceId, token };
}

export function publicTripUrl(origin: string, params: PublicTripLinkParams): string {
  const query = new URLSearchParams({
    grant: params.publicLinkGrantId,
    account: params.accountId,
    trip: params.resourceId,
    token: params.token,
  });
  return `${origin.replace(/\/+$/, '')}/track?${query.toString()}`;
}

/** Throws an `ApiError` whose `code` is one of {@link PublicTripErrorCode}. */
export async function getPublicTrip(params: PublicTripLinkParams, options?: RequestOptions): Promise<PublicTrip> {
  const url = `${REST_ENDPOINTS.tripManagementPublicTrips}/${encodeURIComponent(params.publicLinkGrantId)}`;
  try {
    const response = await axios.get<PublicTrip>(url, {
      params: {
        accountId: params.accountId,
        resourceId: params.resourceId,
        token: params.token,
      },
      timeout: 10000,
      withCredentials: false,
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    if (isCancellation(error, options?.signal)) {
      throw ApiError.cancelled(error);
    }
    const status = (error as AxiosError).response?.status;
    const code: PublicTripErrorCode =
      status === 410
        ? 'EXPIRED'
        : status === 404
          ? 'NOT_FOUND'
          : status === 400
            ? 'INVALID_LINK'
            : 'UNAVAILABLE';
    throw new ApiError(`Public trip lookup failed (${status ?? 'no response'})`, {
      code,
      i18nKey: PUBLIC_TRIP_I18N[code],
      status,
      cause: error,
    });
  }
}

/** Localized headline per outcome; the page pairs each with a longer explanation. */
const PUBLIC_TRIP_I18N: Record<PublicTripErrorCode, string> = {
  NOT_FOUND: 'tripTracking.notFoundTitle',
  EXPIRED: 'tripTracking.expiredTitle',
  INVALID_LINK: 'tripTracking.invalidLinkTitle',
  UNAVAILABLE: 'tripTracking.unavailableTitle',
};
