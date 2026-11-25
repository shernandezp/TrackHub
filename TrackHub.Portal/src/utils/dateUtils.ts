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

export function formatDate(value: string | number | Date | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    const date = new Date(value);
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()} ${(date.getHours()).toString().padStart(2, '0')}:${(date.getMinutes()).toString().padStart(2, '0')}:${(date.getSeconds()).toString().padStart(2, '0')}`;
}

/** MM/DD HH:MM:SS, for dense live lists where the year adds nothing. */
export function formatShortDateTime(value: string | number | Date | null | undefined): string {
    return formatDateTime(value).replace(/\/\d{4} /, ' ');
}

/**
 * A DateOnly (GraphQL `LocalDate`) carries NO instant, but `new Date('2027-03-04')` parses as UTC
 * midnight and renders 03/03/2027 west of UTC, so these helpers work on the calendar parts directly.
 * DateTimeOffset values keep using formatDate/formatDateTime.
 */
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parseDateOnly(value: string | null | undefined): DateParts | null {
  if (!value) return null;
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const parts = { year: Number(year), month: Number(month), day: Number(day) };
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31) return null;
  return parts;
}

/** Timezone-stable: the rendered day always equals the stored day. */
export function formatDateOnly(value: string | null | undefined): string {
    const parts = parseDateOnly(value);
    if (!parts) return '';
    return `${parts.month.toString().padStart(2, '0')}/${parts.day.toString().padStart(2, '0')}/${parts.year}`;
}

/**
 * Negative once the day has passed. `today` comes from the ACCOUNT calendar: an expiry is a fleet
 * date, so the viewer's browser zone must not move it.
 */
export function daysUntilDateOnly(value: string | null | undefined, today: string): number | null {
    const parts = parseDateOnly(value);
    const start = parseDateOnly(today);
    if (!parts || !start) return null;
    // Both endpoints are built as UTC midnights of their calendar day, so the
    // difference is an exact whole number of days with no DST or offset drift.
    const target = Date.UTC(parts.year, parts.month - 1, parts.day);
    return Math.round((target - Date.UTC(start.year, start.month - 1, start.day)) / 86_400_000);
}

export function toISOStringWithTimezone(value: Date): string {
    // https://www.30secondsofcode.org/js/s/iso-format-date-with-timezone/
    const pad = (n: number): string => `${Math.floor(Math.abs(n))}`.padStart(2, '0');
    const getTimezoneOffset = (date: Date): string => {
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

/**
 * `datetime-local` holds **local wall time** with no zone suffix, so the UTC instant is shifted by
 * the local offset; the exact inverse of {@link fromDateTimeLocalInput}, so the pair round-trips an
 * instant unchanged in any timezone.
 */
export function toDateTimeLocalInput(value: string | number | Date | null | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const offsetMs = parsed.getTimezoneOffset() * 60_000;
    return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** Inverse of {@link toDateTimeLocalInput}; null when the field is empty/unparseable. */
export function fromDateTimeLocalInput(value: string | null | undefined): string | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Kept for older imports. */
export function formatDurationString(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) return '0h 0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
}
