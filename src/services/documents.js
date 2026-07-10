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
import axios from 'axios';
import useApiService from './apiService';
import { useAuth } from '../AuthContext';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

const REQUEST_TIMEOUT_MS = 60000;

// Redacted document view model — never exposes storage keys; DownloadUrl only after a Clean scan.
const DOCUMENT_FIELDS = `
  documentId
  accountId
  ownerEntityType
  ownerEntityId
  uploadedByPrincipalType
  uploadedByPrincipalId
  fileName
  category
  title
  description
  contentType
  sizeBytes
  sha256Hash
  classification
  status
  expiresAt
  visibilityScope
  scanStatus
  currentVersion
  downloadUrl
  lastModified
`;

const VERSION_FIELDS = `
  documentVersionId
  documentId
  accountId
  versionNumber
  contentType
  fileName
  sizeBytes
  sha256Hash
  scanStatus
  replacedByPrincipalType
  replacedByPrincipalId
  reason
  createdAt
`;

const TYPE_FIELDS = `
  documentTypeId
  accountId
  category
  displayName
  required
  expiring
  defaultValidityDays
  enabled
  createdAt
`;

const SIGNATURE_FIELDS = `
  documentSignatureId
  documentId
  accountId
  signerPrincipalType
  signerPrincipalId
  signerName
  signatureImageDocumentId
  legalTextAccepted
  latitude
  longitude
  signedAt
  createdAt
`;

const SHARE_FIELDS = `
  publicLinkGrantId
  accountId
  resourceType
  resourceId
  scopes
  purpose
  expiresAt
  revokedAt
  revokedBy
  createdByPrincipalId
  accessCount
  lastAccessedAt
  lastModified
`;

const useManagerGraphQL = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const execute = async (query, selector, fallback = undefined) => {
    try {
      const response = await post({ query });
      return selector(response.data);
    } catch (error) {
      handleError(error);
      return fallback;
    }
  };

  return { execute };
};

// The REST file endpoints live under the Manager app base (~/documents/...), i.e. the GraphQL endpoint
// minus its trailing `graphql/`. Preserves any IIS path base (e.g. https://host/Manager) — using only
// the origin would drop it and 404 in a deployed environment.
const managerBaseUrl = () => {
  const endpoint = process.env.REACT_APP_MANAGER_ENDPOINT || '';
  return endpoint.replace(/\/?graphql\/?$/i, '').replace(/\/+$/, '');
};

const useDocumentService = () => {
  const { execute } = useManagerGraphQL();
  const { accessToken, handleRefreshToken } = useAuth();

  const authHeader = async () => {
    let token = accessToken;
    try {
      // Best-effort refresh; apiService owns the mutex for GraphQL calls.
      token = (await handleRefreshToken()) || accessToken;
    } catch {
      token = accessToken;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // ---- GraphQL: reads ----
  const getDocumentsForOwner = async (accountId, ownerEntityType, ownerEntityId, skip = 0, take = 50) => execute(`
    query {
      documentsForOwner(query: { accountId: ${formatValue(accountId)}, ownerEntityType: ${formatValue(ownerEntityType)}, ownerEntityId: ${formatValue(ownerEntityId)}, skip: ${skip}, take: ${take} }) {
        ${DOCUMENT_FIELDS}
      }
    }
  `, data => data.documentsForOwner, []);

  const getDocument = async (documentId) => execute(`
    query { document(query: { documentId: ${formatValue(documentId)} }) { ${DOCUMENT_FIELDS} } }
  `, data => data.document, null);

  const getDocumentVersions = async (documentId, skip = 0, take = 50) => execute(`
    query { documentVersions(query: { documentId: ${formatValue(documentId)}, skip: ${skip}, take: ${take} }) { ${VERSION_FIELDS} } }
  `, data => data.documentVersions, []);

  const getDocumentSignatures = async (documentId) => execute(`
    query { documentSignatures(query: { documentId: ${formatValue(documentId)} }) { ${SIGNATURE_FIELDS} } }
  `, data => data.documentSignatures, []);

  const getActiveDocumentByCategory = async (ownerEntityType, ownerEntityId, category) => execute(`
    query { activeDocumentByCategory(query: { ownerEntityType: ${formatValue(ownerEntityType)}, ownerEntityId: ${formatValue(ownerEntityId)}, category: ${formatValue(category)} }) { ${DOCUMENT_FIELDS} } }
  `, data => data.activeDocumentByCategory, null);

  const searchDocuments = async (filter = {}, skip = 0, take = 50) => execute(`
    query {
      searchDocuments(query: { filter: {
        ownerEntityType: ${formatValue(filter.ownerEntityType)}
        ownerEntityId: ${formatValue(filter.ownerEntityId)}
        category: ${formatValue(filter.category)}
        classification: ${formatValue(filter.classification)}
        status: ${formatValue(filter.status)}
        expiringWithinDays: ${filter.expiringWithinDays ?? null}
        uploadedByPrincipalId: ${formatValue(filter.uploadedByPrincipalId)}
        from: ${formatValue(filter.from)}
        to: ${formatValue(filter.to)}
      }, skip: ${skip}, take: ${take} }) {
        ${DOCUMENT_FIELDS}
      }
    }
  `, data => data.searchDocuments, []);

  const getExpiringDocuments = async (withinDays = 30, skip = 0, take = 50) => execute(`
    query { expiringDocuments(query: { withinDays: ${withinDays}, skip: ${skip}, take: ${take} }) { ${DOCUMENT_FIELDS} } }
  `, data => data.expiringDocuments, []);

  const getDocumentShares = async (documentId) => execute(`
    query { documentShares(query: { documentId: ${formatValue(documentId)} }) { ${SHARE_FIELDS} } }
  `, data => data.documentShares, []);

  const getDocumentTypes = async (accountId, includeDisabled = false) => execute(`
    query { documentTypes(query: { accountId: ${formatValue(accountId)}, includeDisabled: ${includeDisabled} }) { ${TYPE_FIELDS} } }
  `, data => data.documentTypes, []);

  // ---- GraphQL: mutations ----
  const voidDocument = async (documentId, reason) => execute(`
    mutation { voidDocument(command: { documentId: ${formatValue(documentId)}, reason: ${formatValue(reason)} }) }
  `, data => data.voidDocument, false);

  const expireDocument = async (documentId, expiresAt) => execute(`
    mutation { expireDocument(command: { documentId: ${formatValue(documentId)}, expiresAt: ${formatValue(expiresAt)} }) }
  `, data => data.expireDocument, false);

  const deleteDocumentReference = async (documentId) => execute(`
    mutation { deleteDocumentReference(command: { documentId: ${formatValue(documentId)} }) }
  `, data => data.deleteDocumentReference, null);

  const signDocument = async (signature) => execute(`
    mutation {
      signDocument(command: { signature: {
        documentId: ${formatValue(signature.documentId)}
        signerPrincipalType: ${formatValue(signature.signerPrincipalType)}
        signerPrincipalId: ${formatValue(signature.signerPrincipalId)}
        signerName: ${formatValue(signature.signerName)}
        legalTextAccepted: ${formatValue(signature.legalTextAccepted)}
        signatureImageDocumentId: ${formatValue(signature.signatureImageDocumentId)}
        latitude: ${signature.latitude ?? null}
        longitude: ${signature.longitude ?? null}
      }}) { ${SIGNATURE_FIELDS} }
    }
  `, data => data.signDocument, null);

  const configureDocumentType = async (documentType) => execute(`
    mutation {
      configureDocumentType(command: { documentType: {
        accountId: ${formatValue(documentType.accountId)}
        category: ${formatValue(documentType.category)}
        displayName: ${formatValue(documentType.displayName)}
        required: ${!!documentType.required}
        expiring: ${!!documentType.expiring}
        defaultValidityDays: ${documentType.defaultValidityDays ?? null}
      }}) { ${TYPE_FIELDS} }
    }
  `, data => data.configureDocumentType, null);

  const disableDocumentType = async (documentTypeId) => execute(`
    mutation { disableDocumentType(command: { documentTypeId: ${formatValue(documentTypeId)} }) }
  `, data => data.disableDocumentType, null);

  // ---- REST: file bytes ----
  // Upload a new document (multipart). fields: accountId, ownerEntityType, ownerEntityId, category,
  // classification, visibilityScope, title, description, expiresAt, captured* watermark fields.
  const uploadDocument = async (file, fields = {}) => {
    try {
      const form = new FormData();
      form.append('file', file);
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          form.append(key, value);
        }
      });
      const headers = await authHeader();
      const response = await axios.post(`${managerBaseUrl()}/documents/upload`, form, { headers, timeout: REQUEST_TIMEOUT_MS });
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  const uploadDocumentVersion = async (documentId, file, fields = {}) => {
    try {
      const form = new FormData();
      form.append('file', file);
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          form.append(key, value);
        }
      });
      const headers = await authHeader();
      const response = await axios.post(`${managerBaseUrl()}/documents/${documentId}/versions`, form, { headers, timeout: REQUEST_TIMEOUT_MS });
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  // Download a Clean document; follows the S3 presigned redirect or streams the local file.
  const downloadDocument = async (documentId, fileName = 'document') => {
    try {
      const headers = await authHeader();
      const response = await axios.get(`${managerBaseUrl()}/documents/${documentId}/download`, {
        headers,
        responseType: 'blob',
        timeout: REQUEST_TIMEOUT_MS,
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  // Build the anonymous public-share download URL (token shown once at share creation).
  const publicDownloadUrl = (publicLinkGrantId, accountId, documentId, token) =>
    `${managerBaseUrl()}/documents/public/${publicLinkGrantId}?accountId=${accountId}&resourceId=${documentId}&token=${encodeURIComponent(token)}`;

  return {
    getDocumentsForOwner,
    getDocument,
    getDocumentVersions,
    getDocumentSignatures,
    getActiveDocumentByCategory,
    searchDocuments,
    getExpiringDocuments,
    getDocumentShares,
    getDocumentTypes,
    voidDocument,
    expireDocument,
    deleteDocumentReference,
    signDocument,
    configureDocumentType,
    disableDocumentType,
    uploadDocument,
    uploadDocumentVersion,
    downloadDocument,
    publicDownloadUrl,
  };
};

export default useDocumentService;
