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

import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { UNEXPECTED_ERROR_I18N_KEY, ApiError, extractRestErrorEntries } from './errors';
import { tokenStore } from './tokenStore';
import { REQUEST_TIMEOUT_MS } from './graphqlClient';

/** Longer budget for file transfer endpoints (uploads/downloads). */
export const FILE_TIMEOUT_MS = 60000;

/**
 * Authenticated REST request against a TrackHub backend (documents, excel
 * reports). Shares the token acquisition path — and therefore the refresh
 * mutex — with the GraphQL client.
 */
export async function restRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    return await sendRest<T>(config, await tokenStore.acquireValidAccessToken());
  } catch (error) {
    // The server rejected a token this client still considered valid (revoked grant, authority
    // restart, clock skew). Refresh once and replay; a second 401 is a real authentication failure.
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    return await sendRest<T>(config, await tokenStore.forceRefreshAccessToken());
  }
}

async function sendRest<T>(config: AxiosRequestConfig, token: string): Promise<T> {
  try {
    const response = await axios.request<T>({
      timeout: FILE_TIMEOUT_MS,
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    // 4xx bodies carry a `{ errors: [{ message, extensions: { code } }] }`
    // envelope — as JSON for preview, or as a Blob for the download path. Parse
    // it so well-known codes (FEATURE_DISABLED, REPORT_ROW_LIMIT_EXCEEDED, …)
    // surface as friendly localized toasts instead of a raw transport message.
    const entries = await extractRestErrorEntries(axiosError.response?.data);
    if (entries.length > 0 && axiosError.response?.status !== 401) {
      throw ApiError.fromRestErrors(
        entries,
        `Request to ${config.url} failed: ${axiosError.message}`,
        axiosError.response?.status
      );
    }
    // The transport message names the endpoint and the axios failure; the user gets the generic line.
    throw new ApiError(`Request to ${config.url} failed: ${axiosError.message}`, {
      status: axiosError.response?.status,
      i18nKey: UNEXPECTED_ERROR_I18N_KEY,
      cause: error,
    });
  }
}

/**
 * Downloads a response as a file through a transient anchor element. Defaults
 * to POST (report generation posts a request body); pass `method: 'GET'` for
 * plain byte streams (e.g. document downloads), in which case no body is sent.
 */
export async function downloadFile(
  url: string,
  body: unknown,
  filename: string,
  options: { timeout?: number; method?: 'GET' | 'POST' } = {}
): Promise<void> {
  const method = options.method ?? 'POST';
  const blob = await restRequest<Blob>({
    method,
    url,
    data: method === 'GET' ? undefined : body,
    responseType: 'blob',
    timeout: options.timeout ?? REQUEST_TIMEOUT_MS,
  });
  const objectUrl = window.URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.URL.revokeObjectURL(objectUrl);
  }
}
