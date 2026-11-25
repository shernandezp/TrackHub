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

// Mirrors Common.Domain.Enums.AccountStatus. Backend is authoritative; these are
// cosmetic helpers for the SuperAdministrator accounts panel.
export const ACCOUNT_STATUS_NAME = {
  1: 'TRIAL',
  2: 'ACTIVE',
  3: 'SUSPENDED',
  4: 'CANCELLED',
  5: 'ARCHIVED'
} as const;

export type AccountStatusId = keyof typeof ACCOUNT_STATUS_NAME;
export type AccountStatusName = (typeof ACCOUNT_STATUS_NAME)[AccountStatusId];

export const ACCOUNT_STATUS_COLOR = {
  TRIAL: 'info',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'error',
  ARCHIVED: 'secondary'
} as const;

export type AccountStatusColor = (typeof ACCOUNT_STATUS_COLOR)[AccountStatusName];

export const ACCOUNT_STATUS_I18N = {
  TRIAL: 'account.statusTrial',
  ACTIVE: 'account.statusActive',
  SUSPENDED: 'account.statusSuspended',
  CANCELLED: 'account.statusCancelled',
  ARCHIVED: 'account.statusArchived'
} as const;

export type AccountStatusI18nKey = (typeof ACCOUNT_STATUS_I18N)[AccountStatusName];

export const ALLOWED_TRANSITIONS = {
  1: ['ACTIVE', 'SUSPENDED', 'CANCELLED'],
  2: ['SUSPENDED', 'CANCELLED'],
  3: ['ACTIVE', 'CANCELLED', 'ARCHIVED'],
  4: ['ACTIVE', 'ARCHIVED'],
  5: []
} as const;

// A non-empty reason is required when suspending or cancelling.
export const requiresReason = (targetStatus: AccountStatusName): boolean =>
  targetStatus === 'SUSPENDED' || targetStatus === 'CANCELLED';
