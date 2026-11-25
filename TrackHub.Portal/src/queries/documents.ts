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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'api/manager/documents';
import type { DocumentUploadFields } from 'api/manager/documents';

export const documentKeys = {
  all: ['documents'] as const,
  detail: (documentId: string) => [...documentKeys.all, 'detail', documentId] as const,
  forOwner: (accountId: string, ownerEntityType: string, ownerEntityId: string) =>
    [...documentKeys.all, 'forOwner', accountId, ownerEntityType, ownerEntityId] as const,
  types: (accountId: string, includeDisabled: boolean) =>
    [...documentKeys.all, 'types', accountId, includeDisabled] as const,
};

/**
 * Every surface that files a document reads types from here, so the account's Required / Tracks
 * Expiration flags govern the upload wherever it happens.
 */
export function useDocumentTypes(
  accountId: string | null | undefined,
  options: { enabled?: boolean; includeDisabled?: boolean } = {}
) {
  const includeDisabled = options.includeDisabled ?? false;
  return useQuery({
    queryKey: documentKeys.types(accountId ?? '', includeDisabled),
    queryFn: ({ signal }) => api.getDocumentTypes(accountId as string, includeDisabled, { signal }),
    enabled: (options.enabled ?? true) && !!accountId,
  });
}

/** `Staff` is the owner type used for qualification evidence. */
export function useDocumentsForOwner(
  accountId: string | undefined,
  ownerEntityType: string,
  ownerEntityId: string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: documentKeys.forOwner(accountId ?? '', ownerEntityType, ownerEntityId ?? ''),
    queryFn: ({ signal }) =>
      api.getAllDocumentsForOwner(accountId as string, ownerEntityType, ownerEntityId as string, { signal }),
    enabled: (options.enabled ?? true) && !!accountId && !!ownerEntityId,
  });
}

/** The platform's only upload endpoint; POD attachments reuse it and are linked by document id. */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, fields }: { file: File; fields?: DocumentUploadFields }) =>
      api.uploadDocument(file, fields ?? {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

/**
 * Uploads land as `Pending` until the scanner finishes, and only a `Clean` document may be
 * attached to a POD; this refreshes that verdict without polling.
 */
export function useRefreshDocument() {
  return useMutation({
    mutationFn: (documentId: string) => api.getDocument(documentId),
  });
}

/** Invalidator for surfaces that mutate documents outside the query layer (DocumentPanel). */
export function useInvalidateDocuments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: documentKeys.all });
}
