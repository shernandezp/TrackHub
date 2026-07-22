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

import en from 'locales/en.json';
import es from 'locales/es.json';

const resolveKey = (bundle: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>(
    (acc, part) =>
      acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
    bundle
  );

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flatten(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

/** Namespaces spec 11 §8 adds; each must keep exact EN/ES key parity. */
const TRIP_NAMESPACES = ['trips', 'tripStops', 'tripShare', 'pod', 'tolls', 'tripTracking'];

/** Route labels — a missing one leaves an untranslated Sidenav entry. */
const SCREEN_KEYS = ['screen.tripManager', 'screen.tripTracking'];

/**
 * Enum-ish keys the screens build dynamically from server strings. These are
 * cast at the key expression, so the compiler cannot catch a missing member —
 * only this test can. The literals mirror TripManagement's
 * Domain/Constants/TripConstants.cs.
 */
const TRIP_STATUSES = ['Created', 'InProgress', 'Paused', 'Completed', 'Cancelled', 'Aborted'];
const STOP_STATUSES = ['Pending', 'Arrived', 'Departed', 'Skipped'];
const ETA_SOURCES = ['Ors', 'Planned', 'Unavailable'];
const TOLL_STATUSES = ['Computed', 'PartialNoTariff', 'NoStations', 'NotComputed'];
const POD_KINDS = ['Signature', 'Photo', 'Manifest', 'BillOfLading', 'Receipt', 'Other'];
const DELIVERY_STATUSES = ['Pending', 'Delivered', 'PartiallyDelivered', 'Rejected'];
/** Manager `ScanStatus` values a POD attachment can report while it is queued. */
const SCAN_STATUSES = ['Pending', 'Clean', 'Infected', 'Failed', 'Skipped'];
/** The two keys `setTransporterTollClass` accepts. */
const TOLL_CLASS_TARGETS = ['transporterType', 'transporter'];

/**
 * Backend rejection codes mapped to i18n keys in api/core/errors.ts. An
 * unmapped code falls back to raw server text, so every mapping needs a string.
 */
const TRIP_ERROR_KEYS = [
  'errors.tripNotActive',
  'errors.tripAlreadyTerminal',
  'errors.tripInvalidTransition',
  'errors.stopAlreadyDeparted',
  'errors.stopNotArrived',
  'errors.stopAlreadySkipped',
  'errors.tripStopsNotComplete',
  'errors.podDocumentNotClean',
  'errors.tripDuplicateCode',
  'errors.tripDuplicateExternalReference',
  'errors.tripHasHistory',
  'errors.tripDriverNotAssignable',
  'errors.routingNotConfigured',
  'errors.routingUnavailable',
  'errors.tollOverlappingTariff',
  'errors.tripShareRevoked',
];

/** The six spec 11 §13 reports, owned by the reporting workstream — verified, not duplicated. */
const TRIP_REPORT_CODES = [
  'tripSummary',
  'tripDetail',
  'tripOnTimePerformance',
  'tripStopDwell',
  'tripTollCost',
  'tripPodExport',
];

const DYNAMIC_KEYS = [
  ...SCREEN_KEYS,
  ...TRIP_ERROR_KEYS,
  ...TRIP_STATUSES.map((status) => `trips.statuses.${status}`),
  ...STOP_STATUSES.map((status) => `tripStops.statuses.${status}`),
  ...ETA_SOURCES.map((source) => `tripStops.etaSources.${source}`),
  ...TOLL_STATUSES.map((status) => `tolls.statuses.${status}`),
  ...POD_KINDS.map((kind) => `pod.kinds.${kind}`),
  ...DELIVERY_STATUSES.map((status) => `trips.deliveries.statuses.${status}`),
  ...SCAN_STATUSES.map((status) => `pod.scanStatuses.${status}`),
  ...TOLL_CLASS_TARGETS.map((target) => `tolls.transporterClass.targets.${target}`),
  ...TRIP_REPORT_CODES.flatMap((code) => [
    `reportList.${code}`,
    `reportDescriptions.${code}`,
  ]),
  // The status page probes TripManagement as a service tile.
  'platformStatus.services.tripManagement.name',
  'platformStatus.services.tripManagement.description',
  // Share field flags are rendered from the flag name.
  'tripShare.includeDriverName',
  'tripShare.includeVehicle',
  'tripShare.includeLivePosition',
  'tripShare.includeStopDetail',
  'tripShare.includePodSummary',
  // Route geometry is flag-gated and defaults to false — it must be labelled.
  'tripShare.includeRoute',
];

describe.each([
  ['en', en],
  ['es', es],
])('trip management translations (%s)', (_, bundle) => {
  test('every dynamically-built trip key resolves to a string', () => {
    const missing = DYNAMIC_KEYS.filter((key) => typeof resolveKey(bundle, key) !== 'string');
    expect(missing).toEqual([]);
  });
});

describe('en/es key parity', () => {
  const bundles = { en, es } as unknown as Record<string, Record<string, Record<string, unknown>>>;

  test.each(TRIP_NAMESPACES)('the %s namespace keeps exact parity', (namespace) => {
    expect(flatten(bundles.es[namespace] ?? {}).sort()).toEqual(
      flatten(bundles.en[namespace] ?? {}).sort()
    );
  });

  test('the trip error codes keep exact parity', () => {
    const missing = TRIP_ERROR_KEYS.filter(
      (key) => typeof resolveKey(bundles.es, key) !== typeof resolveKey(bundles.en, key)
    );
    expect(missing).toEqual([]);
  });
});
