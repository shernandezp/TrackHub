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

import type { SelectListItem } from 'controls/Dialogs/CustomSelect';

/** What an account carries until somebody sets its zone. */
export const DEFAULT_TIME_ZONE = 'UTC';

/**
 * Every IANA zone the browser knows, with the given value kept even when the browser lacks it, so
 * an id stored by another client still shows instead of a blank select.
 */
export function timeZoneOptions(current?: string | null): SelectListItem[] {
  const known: string[] =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [DEFAULT_TIME_ZONE];
  const withUtc = known.includes(DEFAULT_TIME_ZONE) ? known : [DEFAULT_TIME_ZONE, ...known];
  const all = current && !withUtc.includes(current) ? [current, ...withUtc] : withUtc;
  return all.map((zone) => ({ value: zone, label: zone }));
}

/** The browser's own zone: the natural first guess for a new account. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
