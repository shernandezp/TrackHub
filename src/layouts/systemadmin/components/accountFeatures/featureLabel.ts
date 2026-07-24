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

import type { TFunction } from 'i18next';
import { toCamelCase } from "utils/stringUtils";

/**
 * Localized display name for a feature key. Dotted/dashed keys camel-case into the shared
 * `resources.*` label namespace (`gps.positionHistory` -> `resources.gpsPositionHistory`);
 * the raw key is the fallback when a key has no label yet.
 *
 * Lives outside `accountFeatures/index.tsx` so the dialog can reuse it without a circular import.
 */
export function featureLabel(t: TFunction, featureKey: string): string {
  return t(`resources.${toCamelCase(featureKey || '')}` as 'resources.geofencing', { defaultValue: featureKey });
}
