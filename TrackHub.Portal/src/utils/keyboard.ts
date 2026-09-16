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

import type { KeyboardEvent } from 'react';

/**
 * Enter/Space activation for an element that is a button in everything but tag name.
 *
 * A `role="button"` element gets focus from `tabIndex`, but the browser only synthesises a click on
 * a real `<button>`: without this, a keyboard user can reach the control and not use it.
 */
export function activateOnKeyboard(activate: () => void) {
  return (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    activate();
  };
}
