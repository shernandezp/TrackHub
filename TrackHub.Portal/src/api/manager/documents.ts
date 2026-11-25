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
 * Metadata flows through GraphQL; file bytes flow through the Manager REST surface. The
 * public-share URL is anonymous (token in the query string) and built as a plain string.
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import type { RequestOptions } from 'api/core/errors';
import { fetchAllPages } from 'api/core/paging';
import type { Page } from 'api/core/paging';
import { restRequest, downloadFile, FILE_TIMEOUT_MS } from 'api/core/restClient';
import { REST_ENDPOINTS } from 'api/core/endpoints';
import type {
  DocumentFieldsFragment as DocumentFieldsType,
  DocumentVersionFieldsFragment as DocumentVersionFieldsType,
  DocumentTypeFieldsFragment as DocumentTypeFieldsType,
  DocumentSignatureFieldsFragment as DocumentSignatureFieldsType,
  DocumentSearchFilterInput,
  DocumentSignatureDtoInput,
  DocumentTypeDtoInput,
} from './generated/graphql';
import {
  GetDocumentsForOwnerDocument,
  GetDocumentDocument,
  SearchDocumentsDocument,
  GetExpiringDocumentsDocument,
  GetDocumentTypesDocument,
  VoidDocumentDocument,
  ExpireDocumentDocument,
  DeleteDocumentReferenceDocument,
  SignDocumentDocument,
  ConfigureDocumentTypeDocument,
  DisableDocumentTypeDocument,
} from './documentOperations';

export type DocumentVm = DocumentFieldsType;
export type DocumentVersionVm = DocumentVersionFieldsType;
export type DocumentTypeVm = DocumentTypeFieldsType;
export type DocumentSignatureVm = DocumentSignatureFieldsType;
export type { DocumentSearchFilterInput, DocumentSignatureDtoInput, DocumentTypeDtoInput };

/** Fields accepted by the multipart upload endpoints (all optional except the file). */
export type DocumentUploadFields = Record<string, string | number | boolean | null | undefined>;

export async function getDocumentsForOwner(
  accountId: string,
  ownerEntityType: string,
  ownerEntityId: string,
  skip = 0,
  take = 50,
  options?: RequestOptions
): Promise<Page<DocumentVm>> {
  const data = await executeGraphQL('manager', GetDocumentsForOwnerDocument, {
    accountId,
    ownerEntityType,
    ownerEntityId,
    skip,
    take,
  }, options);
  return data.documentsForOwner;
}

/** One owner's whole folder; refused rather than cut short past the fetch-all ceiling. */
export async function getAllDocumentsForOwner(
  accountId: string,
  ownerEntityType: string,
  ownerEntityId: string,
  options?: RequestOptions
): Promise<DocumentVm[]> {
  return fetchAllPages(async (skip, take) =>
    (await getDocumentsForOwner(accountId, ownerEntityType, ownerEntityId, skip, take, options)).items
  );
}

export async function getDocument(documentId: string): Promise<DocumentVm> {
  const data = await executeGraphQL('manager', GetDocumentDocument, { documentId });
  return data.document;
}

export async function searchDocuments(
  filter: DocumentSearchFilterInput = {},
  skip = 0,
  take = 50
): Promise<Page<DocumentVm>> {
  const data = await executeGraphQL('manager', SearchDocumentsDocument, { filter, skip, take });
  return data.searchDocuments;
}

export async function getExpiringDocuments(
  withinDays = 30,
  skip = 0,
  take = 50
): Promise<Page<DocumentVm>> {
  const data = await executeGraphQL('manager', GetExpiringDocumentsDocument, {
    withinDays,
    skip,
    take,
  });
  return data.expiringDocuments;
}

export async function getDocumentTypes(
  accountId: string,
  includeDisabled = false,
  options?: RequestOptions
): Promise<DocumentTypeVm[]> {
  const data = await executeGraphQL('manager', GetDocumentTypesDocument, {
    accountId,
    includeDisabled,
  }, options);
  return data.documentTypes;
}

export async function voidDocument(documentId: string, reason: string): Promise<boolean> {
  const data = await executeGraphQL('manager', VoidDocumentDocument, { documentId, reason });
  return data.voidDocument;
}

export async function expireDocument(documentId: string, expiresAt: string): Promise<boolean> {
  const data = await executeGraphQL('manager', ExpireDocumentDocument, { documentId, expiresAt });
  return data.expireDocument;
}

export async function deleteDocumentReference(documentId: string): Promise<string> {
  const data = await executeGraphQL('manager', DeleteDocumentReferenceDocument, { documentId });
  return data.deleteDocumentReference;
}

export async function signDocument(
  signature: DocumentSignatureDtoInput
): Promise<DocumentSignatureVm> {
  const data = await executeGraphQL('manager', SignDocumentDocument, { signature });
  return data.signDocument;
}

export async function configureDocumentType(
  documentType: DocumentTypeDtoInput
): Promise<DocumentTypeVm> {
  const data = await executeGraphQL('manager', ConfigureDocumentTypeDocument, { documentType });
  return data.configureDocumentType;
}

export async function disableDocumentType(documentTypeId: string): Promise<string> {
  const data = await executeGraphQL('manager', DisableDocumentTypeDocument, { documentTypeId });
  return data.disableDocumentType;
}

function toFormData(file: File, fields: DocumentUploadFields): FormData {
  const form = new FormData();
  form.append('file', file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });
  return form;
}

export async function uploadDocument(
  file: File,
  fields: DocumentUploadFields = {}
): Promise<DocumentVm> {
  return restRequest<DocumentVm>({
    method: 'POST',
    url: `${REST_ENDPOINTS.managerDocuments}/upload`,
    data: toFormData(file, fields),
  });
}

export async function uploadDocumentVersion(
  documentId: string,
  file: File,
  fields: DocumentUploadFields = {}
): Promise<DocumentVm> {
  return restRequest<DocumentVm>({
    method: 'POST',
    url: `${REST_ENDPOINTS.managerDocuments}/${documentId}/versions`,
    data: toFormData(file, fields),
  });
}

/** Follows the S3 presigned redirect or streams the local file. */
export async function downloadDocument(documentId: string, fileName = 'document'): Promise<void> {
  await downloadFile(
    `${REST_ENDPOINTS.managerDocuments}/${documentId}/download`,
    null,
    fileName,
    { method: 'GET', timeout: FILE_TIMEOUT_MS }
  );
}

/** No request is issued and no auth attached: the recipient opens it anonymously and the backend validates the token. */
export function publicDownloadUrl(
  publicLinkGrantId: string,
  accountId: string,
  documentId: string,
  token: string
): string {
  return `${REST_ENDPOINTS.managerDocuments}/public/${publicLinkGrantId}?accountId=${accountId}&resourceId=${documentId}&token=${encodeURIComponent(token)}`;
}
