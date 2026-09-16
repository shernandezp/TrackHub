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

import { useCallback, useEffect, useRef } from 'react';

/**
 * Guards a screen against out-of-order responses.
 *
 * A filter or page change fires a fresh read while the previous one is still in flight, and the
 * slower response can land last and repaint the table with rows that no longer match the controls
 * on screen. Take a ticket before awaiting and check it after: only the newest read applies its
 * result, and a read that outlived the component applies nothing.
 *
 * ```ts
 * const takeTicket = useRequestTicket();
 * const isCurrent = takeTicket();
 * const page = await load();
 * if (!isCurrent()) return;
 * ```
 */
export function useRequestTicket(): () => () => boolean {
  const latest = useRef(0);

  useEffect(() => () => {
    latest.current += 1;
  }, []);

  return useCallback(() => {
    const ticket = ++latest.current;
    return () => ticket === latest.current;
  }, []);
}
