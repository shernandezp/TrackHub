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

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { isTransportFailure, notifyApiError } from 'api/core/errors';

/** Api-layer errors surface here and are routed to the global toast. */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // `meta: { silent: true }` opts a query out of the global toast. Used by surfaces that
    // DISPLAY failure as their content rather than as an interruption — the platform status
    // page must not fire a toast every poll while it is calmly reporting an outage.
    onError: (error, query) => {
      if (query.meta?.silent === true) return;
      notifyApiError(error);
    },
  }),
  mutationCache: new MutationCache({
    // Mutations are never retried (GraphQL mutations are not idempotent).
    onError: (error) => notifyApiError(error),
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 1 && isTransportFailure(error),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
