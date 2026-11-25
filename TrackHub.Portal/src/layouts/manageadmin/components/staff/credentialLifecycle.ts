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

/**
 * Staff credential state machine, pure and presentation-free so it can be asserted directly.
 */

export interface CredentialLifecycleInput {
  active: boolean;
  verifiedAt?: string | null;
  lockedUntil?: string | null;
}

export type CredentialState = 'pending' | 'revoked' | 'locked' | 'active';

export interface CredentialActions {
  /** Activation clears lock/reset: the recovery path out of every state, including a never-activated or revoked one. */
  activate: boolean;
  lock: boolean;
  reset: boolean;
  revoke: boolean;
}

/**
 * - `pending`  — never activated (`verifiedAt` null), whether or not it was created with Active ticked.
 * - `revoked`  — was verified, then had Active cleared.
 * - `locked`   — active and verified with `lockedUntil` still in the future.
 * - `active`   — everything else.
 */
export function credentialState(
  credential: CredentialLifecycleInput,
  now: number = Date.now()
): CredentialState {
  if (!credential.verifiedAt) return 'pending';
  if (!credential.active) return 'revoked';
  if (credential.lockedUntil && new Date(credential.lockedUntil).getTime() > now) return 'locked';
  return 'active';
}

/**
 * Lock, reset and revoke only apply while active; activate is always offered so no state is a dead end.
 */
export function credentialActions(credential: CredentialLifecycleInput): CredentialActions {
  return {
    activate: true,
    lock: credential.active,
    reset: credential.active,
    revoke: credential.active,
  };
}
