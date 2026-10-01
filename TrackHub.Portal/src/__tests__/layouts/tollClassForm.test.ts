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

import { buildTollClassVariables } from 'layouts/manageadmin/components/tollClasses/tollClassForm';

const TRANSPORTER_ID = '44444444-4444-4444-4444-444444444444';

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
