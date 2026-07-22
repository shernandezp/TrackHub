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

import {
  buildDeliveryPayload,
  buildPodPayload,
  buildTollClassVariables,
  isCleanAttachment,
  podDocumentFields,
  toIso,
  toLocalInput,
  normalizeStopCity,
  isStopCityWithinLimit,
  DELIVERY_STATUSES,
  STOP_CITY_MAX_LENGTH,
} from 'layouts/tripmanager/tripWriteForms';
import type { PodAttachment } from 'layouts/tripmanager/tripWriteForms';

const STOP_ID = '11111111-1111-1111-1111-111111111111';
const DOC_ID = '22222222-2222-2222-2222-222222222222';
const EVENT_ID = '33333333-3333-3333-3333-333333333333';
const TRANSPORTER_ID = '44444444-4444-4444-4444-444444444444';
const ACCOUNT_ID = '55555555-5555-5555-5555-555555555555';

const clean = (overrides: Partial<PodAttachment> = {}): PodAttachment => ({
  documentId: DOC_ID,
  fileName: 'signature.png',
  scanStatus: 'Clean',
  ...overrides,
});

describe('stop city', () => {
  test('a blank city is null, so nothing is written as an empty locality', () => {
    expect(normalizeStopCity('   ')).toBeNull();
    expect(normalizeStopCity(null)).toBeNull();
    expect(normalizeStopCity(undefined)).toBeNull();
  });

  test('a supplied city is trimmed', () => {
    expect(normalizeStopCity('  Bogotá  ')).toBe('Bogotá');
  });

  test('mirrors the backend 200-char cap', () => {
    expect(STOP_CITY_MAX_LENGTH).toBe(200);
    expect(isStopCityWithinLimit('Bogotá')).toBe(true);
    expect(isStopCityWithinLimit('x'.repeat(200))).toBe(true);
    expect(isStopCityWithinLimit('x'.repeat(201))).toBe(false);
    // Trailing whitespace is trimmed before the length is judged.
    expect(isStopCityWithinLimit(`${'x'.repeat(200)}   `)).toBe(true);
  });

  test('an absent city is within the limit rather than a validation failure', () => {
    expect(isStopCityWithinLimit(null)).toBe(true);
  });
});

describe('buildDeliveryPayload', () => {
  test('blank optional fields become null rather than empty strings', () => {
    const payload = buildDeliveryPayload({
      clientName: '  Acme  ',
      reference: '   ',
      branchName: '',
      productsSummary: null,
      observations: undefined,
      sequenceIndex: '',
    });

    expect(payload).toEqual({
      reference: null,
      clientName: 'Acme',
      branchName: null,
      productsSummary: null,
      observations: null,
      sequenceIndex: 0,
    });
  });

  test('a supplied sequence index survives as a number', () => {
    expect(buildDeliveryPayload({ clientName: 'Acme', sequenceIndex: '3' }).sequenceIndex).toBe(3);
  });

  test('the outcome vocabulary matches the backend DeliveryStatuses', () => {
    expect([...DELIVERY_STATUSES]).toEqual([
      'Pending',
      'Delivered',
      'PartiallyDelivered',
      'Rejected',
    ]);
  });
});

describe('buildPodPayload', () => {
  test('carries the caller-supplied clientEventId verbatim', () => {
    // The backend is idempotent on (tripStopId, clientEventId). Generating an id
    // inside the builder would mint a fresh one on every retry and turn a
    // duplicate submission into a duplicate POD row.
    const first = buildPodPayload({ tripStopId: STOP_ID, receiverName: 'Ana' }, [], EVENT_ID);
    const retry = buildPodPayload({ tripStopId: STOP_ID, receiverName: 'Ana' }, [], EVENT_ID);

    expect(first.clientEventId).toBe(EVENT_ID);
    expect(retry.clientEventId).toBe(EVENT_ID);
  });

  test('an unset delivery becomes null so the POD closes the whole stop', () => {
    const payload = buildPodPayload(
      { tripStopId: STOP_ID, receiverName: 'Ana', deliveryId: '' },
      [],
      EVENT_ID
    );

    expect(payload.deliveryId).toBeNull();
  });

  test('empty coordinates are null, never zero', () => {
    const payload = buildPodPayload(
      { tripStopId: STOP_ID, receiverName: 'Ana', latitude: '', longitude: '   ' },
      [],
      EVENT_ID
    );

    expect(payload.latitude).toBeNull();
    expect(payload.longitude).toBeNull();
  });

  test('supplied coordinates are numbers', () => {
    const payload = buildPodPayload(
      { tripStopId: STOP_ID, receiverName: 'Ana', latitude: '4.65', longitude: '-74.05' },
      [],
      EVENT_ID
    );

    expect(payload.latitude).toBe(4.65);
    expect(payload.longitude).toBe(-74.05);
  });

  test('a blank capturedAt falls back to now instead of sending an empty timestamp', () => {
    const payload = buildPodPayload({ tripStopId: STOP_ID, receiverName: 'Ana' }, [], EVENT_ID, () =>
      '2026-07-21T10:00:00.000Z'
    );

    expect(payload.capturedAt).toBe('2026-07-21T10:00:00.000Z');
  });

  test('a local capturedAt is converted to ISO-8601', () => {
    const payload = buildPodPayload(
      { tripStopId: STOP_ID, receiverName: 'Ana', capturedAt: '2026-07-21T08:30' },
      [],
      EVENT_ID
    );

    expect(payload.capturedAt).toBe(new Date('2026-07-21T08:30').toISOString());
  });

  test('attachments travel as ids only', () => {
    const payload = buildPodPayload(
      { tripStopId: STOP_ID, receiverName: 'Ana' },
      [clean()],
      EVENT_ID
    );

    expect(payload.documentIds).toEqual([DOC_ID]);
  });

  test('the receiver name is trimmed', () => {
    expect(
      buildPodPayload({ tripStopId: STOP_ID, receiverName: '  Ana Pérez ' }, [], EVENT_ID)
        .receiverName
    ).toBe('Ana Pérez');
  });
});

describe('isCleanAttachment', () => {
  test('only a Clean scan verdict qualifies', () => {
    expect(isCleanAttachment(clean())).toBe(true);
    expect(isCleanAttachment(clean({ scanStatus: 'clean' }))).toBe(true);
    expect(isCleanAttachment(clean({ scanStatus: 'Pending' }))).toBe(false);
    expect(isCleanAttachment(clean({ scanStatus: 'Infected' }))).toBe(false);
  });
});

describe('podDocumentFields', () => {
  test('POD evidence is owned by the trip transporter, not by the trip', () => {
    // Manager cannot resolve a "Trip" owner type without calling TripManagement,
    // so spec 11 §11 owns POD documents through the transporter instead.
    expect(podDocumentFields(ACCOUNT_ID, TRANSPORTER_ID, 'signature.png')).toEqual({
      accountId: ACCOUNT_ID,
      ownerEntityType: 'Transporter',
      ownerEntityId: TRANSPORTER_ID,
      category: 'Pod',
      classification: 'Internal',
      title: 'signature.png',
    });
  });
});

describe('buildTollClassVariables', () => {
  test('a transporter-type mapping never also sends a transporter id', () => {
    expect(
      buildTollClassVariables({
        target: 'transporterType',
        transporterTypeId: 2,
        transporterId: TRANSPORTER_ID,
        tollVehicleClassCode: 'III',
      })
    ).toEqual({ transporterTypeId: 2, transporterId: null, tollVehicleClassCode: 'III' });
  });

  test('a transporter override never also sends a type id', () => {
    expect(
      buildTollClassVariables({
        target: 'transporter',
        transporterTypeId: 2,
        transporterId: TRANSPORTER_ID,
        tollVehicleClassCode: 'IV',
      })
    ).toEqual({ transporterTypeId: null, transporterId: TRANSPORTER_ID, tollVehicleClassCode: 'IV' });
  });

  test('an incomplete form yields null instead of a request the validator rejects', () => {
    expect(buildTollClassVariables({ target: 'transporterType', tollVehicleClassCode: 'III' })).toBeNull();
    expect(buildTollClassVariables({ target: 'transporter', tollVehicleClassCode: 'III' })).toBeNull();
    expect(
      buildTollClassVariables({ target: 'transporterType', transporterTypeId: 2, tollVehicleClassCode: ' ' })
    ).toBeNull();
  });

  test('the class code is trimmed', () => {
    expect(
      buildTollClassVariables({
        target: 'transporterType',
        transporterTypeId: 1,
        tollVehicleClassCode: ' II ',
      })?.tollVehicleClassCode
    ).toBe('II');
  });
});

describe('datetime-local helpers', () => {
  test('round-trip an ISO instant through the input format', () => {
    expect(toLocalInput('2026-07-21T08:30:00.000Z')).toBe('2026-07-21T08:30');
    expect(toLocalInput(null)).toBe('');
    expect(toIso('')).toBeNull();
    expect(toIso(null)).toBeNull();
  });
});
