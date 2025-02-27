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

/**
* Formats a date value into a string in the format MM/DD/YYYY.
*
* @param {string|number|Date} value - The date value to format.
* @returns {string} The formatted date string or an empty string if the input is invalid.
*/
export function formatDate(value) {
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

/**
* Formats a date value into a string in the format MM/DD/YYYY HH:MM:SS.
*
* @param {string|number|Date} value - The date value to format.
* @returns {string} The formatted date-time string or an empty string if the input is invalid.
*/
export function formatDateTime(value) {
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()} ${(date.getHours()).toString().padStart(2, '0')}:${(date.getMinutes()).toString().padStart(2, '0')}:${(date.getSeconds()).toString().padStart(2, '0')}`;
}

/**
* Converts a date value to an ISO string with timezone.
*
* @param {Date} value - The date value to convert.
* @returns {string} The ISO formatted date string with timezone.
*/
export function toISOStringWithTimezone(value) {
    // https://www.30secondsofcode.org/js/s/iso-format-date-with-timezone/
    // Pad a number to 2 digits
    const pad = n => `${Math.floor(Math.abs(n))}`.padStart(2, '0');
    // Get timezone offset in ISO format (+hh:mm or -hh:mm)
    const getTimezoneOffset = date => {
        const tzOffset = -date.getTimezoneOffset();
        const diff = tzOffset >= 0 ? '+' : '-';
        return diff + pad(tzOffset / 60) + ':' + pad(tzOffset % 60);
    };

    return value.getFullYear() +
    '-' + pad(value.getMonth() + 1) +
    '-' + pad(value.getDate()) +
    'T' + pad(value.getHours()) +
    ':' + pad(value.getMinutes()) +
    ':' + pad(value.getSeconds()) +
    getTimezoneOffset(value);
}