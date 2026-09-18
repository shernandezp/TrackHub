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
 * Audit-trail API (Manager backend): plain typed async functions. Failures
 * THROW ApiError — consumed imperatively (load-on-expand), caller owns try/catch.
 */

import { executeGraphQL } from 'api/core/graphqlClient';
import type { AuditEventItemFragment as AuditEventItemType, GetAuditTrailQuery } from './generated/graphql';
import { GetAuditTrailDocument } from './auditEventsOperations';

export type AuditEvent = AuditEventItemType;
export type AuditEventPage = GetAuditTrailQuery['auditTrailFeed'];

/**
 * Cursor-paged: the trail is append-only and unbounded, so the backend reports whether more rows
 * exist rather than a total, and the next page is a seek rather than an offset.
 */
export async function getAuditTrail(
  accountId: string,
  cursor: string | null = null,
  take = 50
): Promise<AuditEventPage> {
  const data = await executeGraphQL('manager', GetAuditTrailDocument, { accountId, cursor, take });
  return data.auditTrailFeed;
}
