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
import { ApiError } from './errors';
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
  const token = await tokenStore.acquireValidAccessToken();
  try {
    const response = await axios.request<T>({
      timeout: FILE_TIMEOUT_MS,
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(`Request to ${config.url} failed: ${axiosError.message}`, {
      status: axiosError.response?.status,
      cause: error,
    });
  }
}

/** Downloads a POST response as a file through a transient anchor element. */
export async function downloadFile(
  url: string,
  body: unknown,
  filename: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const blob = await restRequest<Blob>({
    method: 'POST',
    url,
    data: body,
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
