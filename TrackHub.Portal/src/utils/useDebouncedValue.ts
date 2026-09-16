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

import { useEffect, useState } from 'react';

/** Milliseconds of quiet before a search draft is pushed to the server query. */
export const SEARCH_DEBOUNCE_MS = 350;

/**
 * The value once it has stopped changing for `delayMs`.
 *
 * A search box wired straight to a server query issues one request per keystroke — a new query key
 * per character, each pulling a full page.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return settled;
}
