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

import { formatValue, formatJSONValue, formatDateTimeOffSet } from 'utils/dataUtils';

// Mock dateUtils to control toISOStringWithTimezone output
vi.mock('utils/dateUtils', () => ({
  toISOStringWithTimezone: vi.fn((date) => date.toISOString()),
}));

describe('formatValue', () => {
  test('wraps string in double quotes', () => {
    expect(formatValue('hello')).toBe('"hello"');
  });

  test('wraps number in double quotes', () => {
    expect(formatValue(42)).toBe('"42"');
  });

  test('returns null for null', () => {
    expect(formatValue(null)).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(formatValue(undefined)).toBeNull();
  });

  test('returns null for empty string (falsy)', () => {
    expect(formatValue('')).toBeNull();
  });

  test('returns null for 0 (falsy)', () => {
    expect(formatValue(0)).toBeNull();
  });

  test('wraps boolean true', () => {
    expect(formatValue(true)).toBe('"true"');
  });

  test('escapes double quotes in value', () => {
    expect(formatValue('say "hello"')).toBe('"say \\"hello\\""');
  });

  test('escapes backslashes in value', () => {
    expect(formatValue('path\\to\\file')).toBe('"path\\\\to\\\\file"');
  });

  test('escapes newlines in value', () => {
    expect(formatValue('line1\nline2')).toBe('"line1\\nline2"');
  });

  test('escapes combined special characters', () => {
    expect(formatValue('a"b\\c\nd')).toBe('"a\\"b\\\\c\\nd"');
  });
});

describe('formatJSONValue', () => {
  test('returns string representation', () => {
    expect(formatJSONValue('hello')).toBe('hello');
  });

  test('returns number as string', () => {
    expect(formatJSONValue(42)).toBe('42');
  });

  test('returns null for null', () => {
    expect(formatJSONValue(null)).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(formatJSONValue(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(formatJSONValue('')).toBeNull();
  });

  test('returns null for 0', () => {
    expect(formatJSONValue(0)).toBeNull();
  });

  test('returns boolean as string', () => {
    expect(formatJSONValue(true)).toBe('true');
  });
});

describe('formatDateTimeOffSet', () => {
  test('formats valid date string', () => {
    const result = formatDateTimeOffSet('2025-06-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  test('returns null for null', () => {
    expect(formatDateTimeOffSet(null)).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(formatDateTimeOffSet(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(formatDateTimeOffSet('')).toBeNull();
  });

  test('formats Date object', () => {
    const result = formatDateTimeOffSet(new Date('2025-01-01'));
    expect(result).toBeTruthy();
  });
});
