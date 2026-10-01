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

const toOptionalNumber = (value?: number | string | null): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
    const transporterId = values.transporterId?.trim() || null;
    return transporterId === null
      ? null
      : { transporterTypeId: null, transporterId, tollVehicleClassCode: code };
  }
  const transporterTypeId = toOptionalNumber(values.transporterTypeId);
  return transporterTypeId === null
    ? null
    : { transporterTypeId, transporterId: null, tollVehicleClassCode: code };
}
