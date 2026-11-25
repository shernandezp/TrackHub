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
 * Pure and separate from the dialogs because the payload shapes are contract-critical (an omitted
 * `clientEventId`, a blank string where the backend expects null, a stale coordinate), so they are
 * unit-tested directly.
 */

import { toDateTimeLocalInput, fromDateTimeLocalInput } from 'utils/dateUtils';
import { isServableScan } from 'utils/documentScan';
import type {
  DeliveryDtoInput,
  ProofOfDeliveryDtoInput,
  TripStopDtoInput,
} from 'api/tripManagement/trips';

/**
 * `datetime-local` needs `YYYY-MM-DDTHH:mm` local wall time; the API speaks ISO-8601 UTC.
 * Both directions delegate to the shared implementation in `utils/dateUtils`, so the trip planned
 * times that TripDelayed and TripStartDue are evaluated against round-trip unchanged in any timezone.
 */
export const toLocalInput = (iso?: string | null): string => toDateTimeLocalInput(iso);

export const toIso = (local?: string | null): string | null => fromDateTimeLocalInput(local);

export const newClientEventId = (): string => crypto.randomUUID();

/** Empty, blank and unparseable inputs all mean "not supplied", never 0. */
const toOptionalNumber = (value?: number | string | null): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const trimmedOrNull = (value?: string | null): string | null => {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Mirrors the backend's 200-char cap on `TripStop.City`. City is SEPARATE from `Address` on
 * purpose: the anonymous customer snapshot may carry the locality but never the street address,
 * so the two must never be derived from one another.
 */
export const STOP_CITY_MAX_LENGTH = 200;

export const normalizeStopCity = (city?: string | null): string | null => {
  const trimmed = (city ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

export const isStopCityWithinLimit = (city?: string | null): boolean =>
  (normalizeStopCity(city) ?? '').length <= STOP_CITY_MAX_LENGTH;

/**
 * A FORM concept, not a stored column: an existing trip's type is re-derived from its stops
 * ({@link deriveTripType}). `round` appends a return stop at the origin on creation.
 */
export const TRIP_TYPES = ['single', 'round', 'multi'] as const;

export type TripType = (typeof TRIP_TYPES)[number];

/**
 * Coordinates always come from a picker, never typed. Address/city are left for the reverse
 * geocoder when the stop is later edited in the planner.
 */
export interface TripDestinationDraft {
  name: string;
  latitude: number;
  longitude: number;
  /** Kept so arrival detection snapshots the real geofence shape at arming. */
  geofenceId: string | null;
  address?: string | null;
  city?: string | null;
  arrivalRadiusMeters: number;
  activity: StopActivity;
  requiresPod: boolean;
  priority: number;
}

export const DEFAULT_ARRIVAL_RADIUS_METERS = 150;

/**
 * Without it a dwell figure is an anonymous number of minutes; with it the same measurement reads
 * as loading time at a plant and unloading time at a client.
 */
export const STOP_ACTIVITIES = ['Load', 'Unload', 'Other'] as const;

export type StopActivity = (typeof STOP_ACTIVITIES)[number];

/** A delivery run is the overwhelmingly common case, so a destination unloads by default. */
export const DEFAULT_STOP_ACTIVITY: StopActivity = 'Unload';

export const normalizeStopActivity = (value?: string | null): StopActivity =>
  STOP_ACTIVITIES.find((activity) => activity === value) ?? DEFAULT_STOP_ACTIVITY;

export function buildStopPayloadFromDestination(
  destination: TripDestinationDraft
): TripStopDtoInput {
  return {
    name: destination.name.trim(),
    address: trimmedOrNull(destination.address),
    city: normalizeStopCity(destination.city),
    latitude: destination.latitude,
    longitude: destination.longitude,
    geofenceId: destination.geofenceId || null,
    arrivalRadiusMeters: destination.arrivalRadiusMeters || DEFAULT_ARRIVAL_RADIUS_METERS,
    activity: normalizeStopActivity(destination.activity),
    plannedArrivalFrom: null,
    plannedArrivalTo: null,
    requiresPod: destination.requiresPod,
    priority: destination.priority,
  };
}

/** When the origin was picked from a geofence its id travels along, so arrival detection uses the real shape. */
export function returnToOriginStop(
  originName: string,
  latitude: number,
  longitude: number,
  geofenceId?: string | null
): TripDestinationDraft {
  return {
    name: originName,
    latitude,
    longitude,
    geofenceId: geofenceId || null,
    arrivalRadiusMeters: DEFAULT_ARRIVAL_RADIUS_METERS,
    // `Other`, not `Unload`: parking back at the depot is neither loading nor
    // unloading, and labelling it either would put a fictional duration into the
    // dwell reports.
    activity: 'Other',
    requiresPod: false,
    priority: 0,
  };
}

/**
 * Two points are "the same spot" within ~11 m — wide enough to survive the
 * 6-decimal rounding pickers apply, narrow enough that a genuine nearby
 * destination is never mistaken for the origin.
 */
const SAME_SPOT_EPSILON_DEGREES = 1e-4;

export const isSameSpot = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): boolean =>
  Math.abs(latitudeA - latitudeB) <= SAME_SPOT_EPSILON_DEGREES &&
  Math.abs(longitudeA - longitudeB) <= SAME_SPOT_EPSILON_DEGREES;

/** The stop fields route reuse and type derivation read — structural so tests and Vm rows both fit. */
export interface RouteSourceStop {
  sequence: number;
  name: string;
  address?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  geofenceId?: string | null;
  arrivalRadiusMeters: number;
  activity?: string | null;
  requiresPod: boolean;
  priority: number;
}

export function deriveTripType(
  originLatitude: number,
  originLongitude: number,
  stops: RouteSourceStop[]
): TripType {
  if (stops.length === 0) return 'single';
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  const last = ordered[ordered.length - 1];
  // A one-stop trip ending at the origin is a round trip with no outbound
  // destination — nonsensical, so it only counts as round past one stop.
  if (ordered.length > 1 && isSameSpot(last.latitude, last.longitude, originLatitude, originLongitude)) {
    return 'round';
  }
  return ordered.length > 1 ? 'multi' : 'single';
}

export interface RouteTemplate {
  tripType: TripType;
  destinations: TripDestinationDraft[];
  /** The source trip's return-stop geofence, if its route was a round trip. */
  originGeofenceId: string | null;
}

/**
 * A detected round trip drops the trailing return stop (the dialog re-appends it at save time), so
 * the copied route does not duplicate the origin stop.
 */
export function destinationsFromStops(
  stops: RouteSourceStop[],
  originLatitude: number,
  originLongitude: number
): RouteTemplate {
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  const tripType = deriveTripType(originLatitude, originLongitude, ordered);
  const returnStop = tripType === 'round' ? ordered[ordered.length - 1] : null;
  const outbound = returnStop ? ordered.slice(0, -1) : ordered;
  return {
    tripType,
    originGeofenceId: returnStop?.geofenceId || null,
    destinations: outbound.map((stop) => ({
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      geofenceId: stop.geofenceId || null,
      address: stop.address ?? null,
      city: stop.city ?? null,
      arrivalRadiusMeters: stop.arrivalRadiusMeters || DEFAULT_ARRIVAL_RADIUS_METERS,
      activity: normalizeStopActivity(stop.activity),
      requiresPod: stop.requiresPod,
      priority: stop.priority,
    })),
  };
}

export const TRIP_EXCEPTIONS = ['overdue', 'delayed', 'offCorridor', 'stalledFinalStop'] as const;

/** Outcomes accepted by `updateDeliveryOutcome` (TripManagement `DeliveryStatuses`). */
export const DELIVERY_STATUSES = [
  'Pending',
  'Delivered',
  'PartiallyDelivered',
  'Rejected',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface DeliveryFormValues {
  deliveryId?: string;
  tripStopId?: string;
  reference?: string | null;
  clientName?: string;
  branchName?: string | null;
  productsSummary?: string | null;
  observations?: string | null;
  sequenceIndex?: number | string;
}

export const DELIVERY_REQUIRED_FIELDS = ['clientName'];

export function buildDeliveryPayload(values: DeliveryFormValues): DeliveryDtoInput {
  return {
    reference: trimmedOrNull(values.reference),
    clientName: (values.clientName ?? '').trim(),
    branchName: trimmedOrNull(values.branchName),
    productsSummary: trimmedOrNull(values.productsSummary),
    observations: trimmedOrNull(values.observations),
    sequenceIndex: toOptionalNumber(values.sequenceIndex) ?? 0,
  };
}

/**
 * `scanStatus` is carried because the backend rejects the whole capture with
 * `POD_DOCUMENT_NOT_CLEAN` if any attachment has not finished scanning.
 */
export interface PodAttachment {
  documentId: string;
  fileName: string;
  scanStatus: string;
}

export const isCleanAttachment = (attachment: PodAttachment): boolean => isServableScan(attachment.scanStatus);

export interface PodFormValues {
  tripStopId?: string;
  deliveryId?: string | null;
  receiverName?: string;
  receiverDocument?: string | null;
  notes?: string | null;
  capturedAt?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export const POD_REQUIRED_FIELDS = ['receiverName'];

/**
 * `clientEventId` is supplied by the caller: the backend is idempotent on
 * `(tripStopId, clientEventId)`, so a retry of the SAME attempt must reuse the id it sent.
 */
export function buildPodPayload(
  values: PodFormValues,
  attachments: PodAttachment[],
  clientEventId: string,
  now: () => string = () => new Date().toISOString()
): ProofOfDeliveryDtoInput {
  return {
    tripStopId: values.tripStopId ?? '',
    deliveryId: values.deliveryId || null,
    receiverName: (values.receiverName ?? '').trim(),
    receiverDocument: trimmedOrNull(values.receiverDocument),
    notes: trimmedOrNull(values.notes),
    capturedAt: toIso(values.capturedAt) ?? now(),
    latitude: toOptionalNumber(values.latitude),
    longitude: toOptionalNumber(values.longitude),
    documentIds: attachments.map((attachment) => attachment.documentId),
    clientEventId,
  };
}

/**
 * Trip documents are owned by the trip's TRANSPORTER: `DocumentAccessPolicy` resolves that through
 * group visibility for portal users and `validateStaffAssignment` for staff, which is the audience
 * a POD should have. Manager cannot resolve trip ownership without calling TripManagement.
 */
export function podDocumentFields(
  accountId: string,
  transporterId: string,
  fileName: string
): Record<string, string> {
  return {
    accountId,
    ownerEntityType: 'Transporter',
    ownerEntityId: transporterId,
    category: 'Pod',
    classification: 'Internal',
    title: fileName,
  };
}
