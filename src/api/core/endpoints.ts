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

/**
 * Single source of truth for backend endpoints. All env access for API URLs
 * lives here; nothing else in src/api reads process.env.
 */

export const GRAPHQL_ENDPOINTS = {
  manager: process.env.REACT_APP_MANAGER_ENDPOINT,
  security: process.env.REACT_APP_SECURITY_ENDPOINT,
  geofencing: process.env.REACT_APP_GEOFENCING_ENDPOINT,
  router: process.env.REACT_APP_ROUTER_ENDPOINT,
  telemetry: process.env.REACT_APP_TELEMETRY_ENDPOINT,
} as const;

export type GraphQLBackend = keyof typeof GRAPHQL_ENDPOINTS;

/** Manager REST base (document upload/download live outside GraphQL). */
const managerRestBase = GRAPHQL_ENDPOINTS.manager.replace(/graphql\/?$/, '');

export const REST_ENDPOINTS = {
  /** Excel report generation (Reporting service, REST). */
  reportingBasicReports: `${process.env.REACT_APP_REPORTING_ENDPOINT}api/BasicReports`,
  /**
   * Manager document REST base, e.g. `${managerDocuments}/upload`. The Manager
   * document endpoints are mapped at `~/documents/...` (no `api/` segment) —
   * see TrackHub.Manager Web/Endpoints/Documents.cs.
   */
  managerDocuments: `${managerRestBase}documents`,
} as const;

export const OAUTH_ENDPOINTS = {
  authorization: process.env.REACT_APP_AUTHORIZATION_ENDPOINT,
  token: process.env.REACT_APP_TOKEN_ENDPOINT,
  revocation: process.env.REACT_APP_REVOKE_TOKEN_ENDPOINT,
  logout: process.env.REACT_APP_LOGOUT_ENDPOINT,
  callback: process.env.REACT_APP_CALLBACK_ENDPOINT,
  clientId: process.env.REACT_APP_CLIENT_ID,
} as const;
