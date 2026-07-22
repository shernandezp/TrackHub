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
 * Form state and payload builders for the trip manager's write surfaces
 * (deliveries, proof of delivery, transporter → toll class).
 *
 * These are deliberately pure and separate from the dialogs: the payload shapes
 * are contract-critical — an omitted `clientEventId`, a blank string sent where
 * the backend expects null, or a stale coordinate silently changes what the
 * server records — so they are unit-tested directly rather than only through a
 * rendered dialog.
 */

import { toDateTimeLocalInput, fromDateTimeLocalInput } from 'utils/dateUtils';
import type { DeliveryDtoInput, ProofOfDeliveryDtoInput } from 'api/tripManagement/trips';

/**
 * `datetime-local` needs `YYYY-MM-DDTHH:mm` local wall time; the API speaks ISO-8601 UTC.
 * Both directions delegate to the shared implementation in `utils/dateUtils`, so the trip planned
 * times that TripDelayed and TripStartDue are evaluated against round-trip unchanged in any timezone.
 */
export const toLocalInput = (iso?: string | null): string => toDateTimeLocalInput(iso);

export const toIso = (local?: string | null): string | null => fromDateTimeLocalInput(local);

/** RFC 4122 id used as an idempotency key by every progress/POD/outcome command. */
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

/* ------------------------------------------------------------------ stops */

/**
 * `TripStop.City` is capped at 200 chars by the backend validator — mirrored
 * here so an over-long locality is caught in the dialog instead of coming back
 * as a 400.
 *
 * City is a SEPARATE field from `Address` on purpose: the anonymous customer
 * snapshot may carry the coarse locality but never the full street address, so
 * the two carry different disclosure levels and must never be derived from one
 * another (spec 11 §7.8).
 */
export const STOP_CITY_MAX_LENGTH = 200;

export const normalizeStopCity = (city?: string | null): string | null => {
  const trimmed = (city ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

export const isStopCityWithinLimit = (city?: string | null): boolean =>
  (normalizeStopCity(city) ?? '').length <= STOP_CITY_MAX_LENGTH;

/* ------------------------------------------------------------- deliveries */

/** Outcomes accepted by `updateDeliveryOutcome` (TripManagement `DeliveryStatuses`). */
export const DELIVERY_STATUSES = [
  'Pending',
  'Delivered',
  'PartiallyDelivered',
  'Rejected',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/** Dialog/form state for a delivery line on a stop. */
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

/* ---------------------------------------------------- proof of delivery   */

/** Scan verdict the backend requires before a document may back a POD. */
export const CLEAN_SCAN_STATUS = 'Clean';

/**
 * One uploaded document queued for a POD. `scanStatus` is carried because the
 * backend rejects the whole capture with `POD_DOCUMENT_NOT_CLEAN` if any
 * attachment has not finished scanning clean — the screen must be able to say
 * which one before the user submits (spec 11 §9).
 */
export interface PodAttachment {
  documentId: string;
  fileName: string;
  scanStatus: string;
}

export const isCleanAttachment = (attachment: PodAttachment): boolean =>
  attachment.scanStatus?.toLowerCase() === CLEAN_SCAN_STATUS.toLowerCase();

/** Dialog/form state for a proof-of-delivery capture. */
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
 * Builds the POD command payload.
 *
 * `clientEventId` is supplied by the caller rather than generated here: the
 * backend is idempotent on `(tripStopId, clientEventId)`, so a retry of the
 * SAME capture attempt has to reuse the id it already sent. Generating one
 * inside this function would mint a fresh id on every retry and turn a
 * duplicate submission into a duplicate POD row (spec 11 §7.3, §9).
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
 * Upload metadata for a POD attachment. Trip documents are owned by the trip's
 * TRANSPORTER, not by the trip: `DocumentAccessPolicy` resolves transporter
 * ownership through group visibility for portal users and through
 * `validateDriverAssignment` for drivers, which is exactly the audience a POD
 * should have. A `"Trip"` owner type was rejected because Manager cannot
 * resolve trip ownership without calling TripManagement (spec 11 §11).
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

/* -------------------------------------------- transporter → toll class    */

/** A mapping keys on a transporter TYPE, or on one transporter as an override. */
export const TOLL_CLASS_TARGETS = ['transporterType', 'transporter'] as const;

export type TollClassTarget = (typeof TOLL_CLASS_TARGETS)[number];

export interface TollClassFormValues {
  target?: TollClassTarget;
  transporterTypeId?: number | string | null;
  transporterId?: string | null;
  tollVehicleClassCode?: string;
}

export interface TollClassVariables {
  transporterTypeId: number | null;
  transporterId: string | null;
  tollVehicleClassCode: string;
}

/**
 * Exactly one of the two keys travels. Sending both would make the row's unique
 * `(AccountId, TransporterTypeId, TransporterId)` key ambiguous, and sending
 * neither is rejected by the command's validator.
 */
export function buildTollClassVariables(values: TollClassFormValues): TollClassVariables | null {
  const code = (values.tollVehicleClassCode ?? '').trim();
  if (code === '') return null;
  if (values.target === 'transporter') {
    const transporterId = trimmedOrNull(values.transporterId);
    return transporterId === null
      ? null
      : { transporterTypeId: null, transporterId, tollVehicleClassCode: code };
  }
  const transporterTypeId = toOptionalNumber(values.transporterTypeId);
  return transporterTypeId === null
    ? null
    : { transporterTypeId, transporterId: null, tollVehicleClassCode: code };
}
