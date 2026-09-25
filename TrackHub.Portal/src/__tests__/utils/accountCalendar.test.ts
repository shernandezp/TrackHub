import { describe, expect, test } from 'vitest';
import { accountCalendar, addDays, addMonths, dateInZone, instantInZone, monthEndOf, monthStartOf, validZone } from 'utils/accountCalendar';

// 2026-09-24T23:30:00Z: still the 24th in Bogota (18:30), already the 25th in Madrid (01:30).
const lateEvening = new Date('2026-09-24T23:30:00Z');

describe('dateInZone', () => {
  test('answers the calendar date of the zone, not of the browser', () => {
    expect(dateInZone('America/Bogota', lateEvening)).toBe('2026-09-24');
    expect(dateInZone('Europe/Madrid', lateEvening)).toBe('2026-09-25');
    expect(dateInZone('UTC', lateEvening)).toBe('2026-09-24');
  });

  test('an unknown or blank zone means UTC', () => {
    expect(validZone('Mars/Olympus')).toBe('UTC');
    expect(validZone('')).toBe('UTC');
    expect(validZone(null)).toBe('UTC');
    expect(dateInZone('Mars/Olympus', lateEvening)).toBe('2026-09-24');
  });
});

describe('instantInZone', () => {
  test('midnight in a fixed-offset zone', () => {
    expect(instantInZone('America/Bogota', '2026-09-24')).toBe('2026-09-24T05:00:00.000Z');
    expect(instantInZone('America/Bogota', '2026-09-24', '23:59:59.999')).toBe('2026-09-25T04:59:59.999Z');
  });

  test('honours daylight saving on either side of a transition', () => {
    expect(instantInZone('America/New_York', '2026-01-15')).toBe('2026-01-15T05:00:00.000Z');
    expect(instantInZone('America/New_York', '2026-07-15')).toBe('2026-07-15T04:00:00.000Z');
    // 2026-03-08 02:30 does not exist in New York; it resolves forward to 03:30 EDT.
    expect(instantInZone('America/New_York', '2026-03-08', '02:30:00')).toBe('2026-03-08T07:30:00.000Z');
  });

  test('UTC is the identity', () => {
    expect(instantInZone('UTC', '2026-09-24', '12:34:56.789')).toBe('2026-09-24T12:34:56.789Z');
  });
});

describe('calendar arithmetic', () => {
  test('shifts days and months without touching any zone', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-31', 1)).toBe('2026-03-03');
    expect(addMonths('2026-03-15', -3)).toBe('2025-12-15');
    expect(monthStartOf('2026-02-19')).toBe('2026-02-01');
    expect(monthEndOf('2026-02-19')).toBe('2026-02-28');
    expect(monthEndOf('2028-02-19')).toBe('2028-02-29');
  });
});

describe('accountCalendar', () => {
  const bogota = accountCalendar('America/Bogota', () => lateEvening);
  const madrid = accountCalendar('Europe/Madrid', () => lateEvening);

  test('today, ranges and month edges follow the account zone', () => {
    expect(bogota.today()).toBe('2026-09-24');
    expect(madrid.today()).toBe('2026-09-25');
    expect(bogota.daysAgo(30)).toBe('2026-08-25');
    expect(bogota.monthsAgo(3)).toBe('2026-06-24');
    expect(bogota.monthStart()).toBe('2026-09-01');
    expect(bogota.monthEnd()).toBe('2026-09-30');
  });

  test('day bounds are the zone-local edges of the day', () => {
    expect(bogota.dayStartIso('2026-09-24')).toBe('2026-09-24T05:00:00.000Z');
    expect(bogota.dayEndIso('2026-09-24')).toBe('2026-09-25T04:59:59.999Z');
    expect(madrid.dayStartIso('2026-09-24')).toBe('2026-09-23T22:00:00.000Z');
    expect(bogota.dayStartIso('')).toBeNull();
    expect(bogota.dayEndIso(null)).toBeNull();
  });

  test('a missing zone is a UTC calendar', () => {
    expect(accountCalendar(null, () => lateEvening).zone).toBe('UTC');
    expect(accountCalendar(undefined, () => lateEvening).dayStartIso('2026-09-24')).toBe('2026-09-24T00:00:00.000Z');
  });
});
