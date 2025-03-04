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

import { toISOStringWithTimezone } from "utils/dateUtils";

/**
 * Formats the given value by wrapping it in double quotes.
 *
 * @param {any} value - The value to format.
 * @returns {string|null} The formatted value or null if the input is falsy.
 */
export function formatValue(value) {
  return value ? `"${value}"` : null;
}

/**
 * Formats the given value as a string.
 *
 * @param {any} value - The value to format.
 * @returns {string|null} The formatted value or null if the input is falsy.
 */
export function formatRESTValue(value) {
  return value ? `${value}` : null;
}

/**
 * Formats the given date value to an ISO string with timezone offset.
 *
 * @param {string|Date} value - The date value to format.
 * @returns {string|null} The formatted date string or null if the input is falsy.
 */
export function formatDateTimeOffSet(value) {
  return value ? `${toISOStringWithTimezone(new Date(value))}` : null;
}