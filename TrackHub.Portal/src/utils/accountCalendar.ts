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


import { DEFAULT_TIME_ZONE } from './timeZones';

/** `yyyy-MM-dd`, the shape every LocalDate scalar and `date` input takes. */
export type LocalDate = string;

/**
 * Calendar arithmetic in the ACCOUNT's zone. "Today", a day's bounds and a month's edges are
 * questions about the fleet's calendar, not the viewer's browser, so every default and day filter
 * flows through here; displaying an instant stays browser-local.
 */
export interface AccountCalendar {
  readonly zone: string;
  today(): LocalDate;
  daysAgo(days: number): LocalDate;
  monthsAgo(months: number): LocalDate;
  monthStart(): LocalDate;
  monthEnd(): LocalDate;
  /** ISO-8601 UTC instant at which the day starts in the zone; null for a blank filter. */
  dayStartIso(date: LocalDate): string;
  dayStartIso(date?: LocalDate | null): string | null;
  /** ISO-8601 UTC instant of the day's last millisecond in the zone, so "to" includes the day. */
  dayEndIso(date: LocalDate): string;
  dayEndIso(date?: LocalDate | null): string | null;
}

const pad = (part: number): string => String(part).padStart(2, '0');

export function validZone(zone?: string | null): string {
  const candidate = zone?.trim() || DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function wallClockIn(zone: string, at: Date): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const value = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
}

/** The zone's offset from UTC, in milliseconds, at the given instant. */
function offsetAt(zone: string, instantMs: number): number {
  const wall = wallClockIn(zone, new Date(instantMs));
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return asUtc - (instantMs - (instantMs % 1000));
}

/** The calendar date of an instant in the zone. */
export function dateInZone(zone: string | null | undefined, at: Date = new Date()): LocalDate {
  const wall = wallClockIn(validZone(zone), at);
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
}

/** The instant at which a wall-clock time occurs in the zone (a time inside a DST gap resolves forward). */
export function instantInZone(zone: string | null | undefined, date: LocalDate, time = '00:00:00.000'): string {
  const valid = validZone(zone);
  const [year, month, day] = date.split('-').map(Number);
  const [hour = 0, minute = 0, secondPart = '0'] = time.split(':');
  const [second = 0, millisecond = 0] = secondPart.split('.').map(Number);
  const wall = Date.UTC(year, month - 1, day, Number(hour), Number(minute), second, millisecond);
  const first = wall - offsetAt(valid, wall);
  const second_ = wall - offsetAt(valid, first);
  // Both agree except inside a DST gap, where the wall time never happens; the later instant is the
  // clock after it sprang forward.
  const instant = offsetAt(valid, second_) === offsetAt(valid, first) ? second_ : Math.max(first, second_);
  return new Date(instant).toISOString();
}

const split = (date: LocalDate): [number, number, number] => {
  const [year, month, day] = date.split('-').map(Number);
  return [year, month, day];
};
const fromUtcParts = (year: number, monthIndex: number, day: number): LocalDate =>
  new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);

/** A calendar date shifted by whole days, without passing through any zone. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = split(date);
  return fromUtcParts(year, month - 1, day + days);
}

/** A calendar date shifted by whole months; a day past the target month's end rolls over like `Date#setMonth`. */
export function addMonths(date: LocalDate, months: number): LocalDate {
  const [year, month, day] = split(date);
  return fromUtcParts(year, month - 1 + months, day);
}

export function monthStartOf(date: LocalDate): LocalDate {
  const [year, month] = split(date);
  return fromUtcParts(year, month - 1, 1);
}

export function monthEndOf(date: LocalDate): LocalDate {
  const [year, month] = split(date);
  return fromUtcParts(year, month, 0);
}

export function accountCalendar(zone?: string | null, now: () => Date = () => new Date()): AccountCalendar {
  const valid = validZone(zone);
  const today = (): LocalDate => dateInZone(valid, now());
  function dayStartIso(date: LocalDate): string;
  function dayStartIso(date?: LocalDate | null): string | null;
  function dayStartIso(date?: LocalDate | null): string | null {
    return date ? instantInZone(valid, date) : null;
  }
  function dayEndIso(date: LocalDate): string;
  function dayEndIso(date?: LocalDate | null): string | null;
  function dayEndIso(date?: LocalDate | null): string | null {
    return date ? instantInZone(valid, date, '23:59:59.999') : null;
  }
  return {
    zone: valid,
    today,
    daysAgo: (days) => addDays(today(), -days),
    monthsAgo: (months) => addMonths(today(), -months),
    monthStart: () => monthStartOf(today()),
    monthEnd: () => monthEndOf(today()),
    dayStartIso,
    dayEndIso,
  };
}
