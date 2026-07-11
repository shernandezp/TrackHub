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

import type { AppErrorDetail } from 'utils/errorHandler';

export interface GraphQLErrorEntry {
  message?: string;
  extensions?: { code?: string };
  code?: string;
}

/**
 * Normalized API failure. The api layer THROWS these; deciding what a failure
 * means (fallback value, toast, retry) belongs to the caller — usually the
 * query layer's global error handler.
 */
export class ApiError extends Error {
  /** Well-known backend code (e.g. ACCOUNT_SUSPENDED, FEATURE_DISABLED) if present. */
  readonly code?: string;
  /** Translation key for user-facing display, when the code maps to one. */
  readonly i18nKey?: string;
  /** HTTP status, when the failure was a transport error. */
  readonly status?: number;
  /** Raw GraphQL error entries, when the failure came from a GraphQL payload. */
  readonly graphQLErrors: GraphQLErrorEntry[];

  constructor(
    message: string,
    options: {
      code?: string;
      i18nKey?: string;
      status?: number;
      graphQLErrors?: GraphQLErrorEntry[];
      cause?: unknown;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.code = options.code;
    this.i18nKey = options.i18nKey;
    this.status = options.status;
    this.graphQLErrors = options.graphQLErrors ?? [];
  }

  static fromGraphQLErrors(errors: GraphQLErrorEntry[]): ApiError {
    const codeOf = (e: GraphQLErrorEntry) => e.extensions?.code ?? e.code;
    if (errors.some((e) => codeOf(e) === 'ACCOUNT_SUSPENDED')) {
      return new ApiError('This account is not currently operational.', {
        code: 'ACCOUNT_SUSPENDED',
        i18nKey: 'errors.accountSuspended',
        graphQLErrors: errors,
      });
    }
    if (errors.some((e) => codeOf(e) === 'FEATURE_DISABLED')) {
      return new ApiError('This feature is not enabled for your account.', {
        code: 'FEATURE_DISABLED',
        i18nKey: 'errors.featureDisabled',
        graphQLErrors: errors,
      });
    }
    return new ApiError(errors.map((e) => e.message ?? 'Unknown GraphQL error').join('\n'), {
      code: errors.length > 0 ? codeOf(errors[0]) : undefined,
      graphQLErrors: errors,
    });
  }

  /** Bridge to the legacy `'app-error'` CustomEvent consumed by NotificationContext. */
  toAppErrorDetail(): AppErrorDetail {
    const type =
      this.code === 'ACCOUNT_SUSPENDED'
        ? 'account-suspended'
        : this.code === 'FEATURE_DISABLED'
          ? 'feature-disabled'
          : this.graphQLErrors.length > 0
            ? 'graphql'
            : 'network';
    return { message: this.message, type, code: this.code, i18nKey: this.i18nKey };
  }
}

/** Dispatches an error to the global notification toast (NotificationContext). */
export function notifyApiError(error: unknown): void {
  const detail: AppErrorDetail =
    error instanceof ApiError
      ? error.toAppErrorDetail()
      : {
          message: error instanceof Error ? error.message : 'Unexpected error',
          type: 'unexpected',
          code: undefined,
          i18nKey: undefined,
        };
  window.dispatchEvent(new CustomEvent<AppErrorDetail>('app-error', { detail }));
}
