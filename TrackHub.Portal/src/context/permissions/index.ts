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

import { createContext, useContext } from 'react';
import type { AuthorizedAction } from 'api/security/permissions';

export interface PermissionsContextValue {
  actions: AuthorizedAction[];
  can: (resource: string, action: string) => boolean;
  /** False until the permission set has loaded. */
  loaded: boolean;
}

const key = (resource: string, action: string) => `${resource}.${action}`;

export function buildPermissionIndex(actions: AuthorizedAction[]): Set<string> {
  return new Set(actions.map((a) => key(a.resourceName, a.actionName)));
}

/**
 * Default ALLOWS everything, deliberately: UI gating is UX only and the backend re-checks every
 * call, so a permissive default can never widen access, while a restrictive one would blank
 * working screens until the bootstrap read resolves.
 */
export const PermissionsContext = createContext<PermissionsContextValue>({
  actions: [],
  can: () => true,
  loaded: false,
});

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
