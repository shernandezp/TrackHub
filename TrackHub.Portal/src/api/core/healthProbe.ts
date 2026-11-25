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
 * Sanctioned direct-fetch exception to the api layering: every backend maps an
 * anonymous `/health` before authentication (CORS runs first), so the status page
 * works when the visitor cannot sign in or the sign-in service is down. The
 * token-acquiring clients would defeat that.
 */

import { HEALTH_ENDPOINTS } from './endpoints';
import { editionHealthEndpoints } from 'edition/endpoints';

/** Probe budget. A service that has not answered in this long is treated as Down. */
export const HEALTH_TIMEOUT_MS = 6000;

export type ServiceState = 'up' | 'down' | 'unknown';

export interface HealthProbeResult {
  state: ServiceState;
  /** Mapped to a localized detail line, never shown raw. `unhealthy`: answered with a failing dependency. */
  reason?: 'timeout' | 'unreachable' | 'unhealthy' | 'httpError';
  /** HTTP status when one was received — detail line only, never the primary UI. */
  status?: number;
}

/**
 * `id` is both the i18n key suffix and the React key; this module carries no
 * display strings. Edition backends (src/edition/endpoints.ts) are appended.
 */
const CORE_PROBED_SERVICES = [
  'authority',
  'security',
  'manager',
  'router',
  'telemetry',
  'geofencing',
  'reporting',
  'tripManagement',
] as const;

export const PROBED_SERVICES: readonly ProbedService[] = [
  ...CORE_PROBED_SERVICES,
  ...(Object.keys(editionHealthEndpoints) as (keyof typeof editionHealthEndpoints)[]),
];

export type ProbedService =
  | (typeof CORE_PROBED_SERVICES)[number]
  | keyof typeof editionHealthEndpoints;

export function healthUrlFor(service: ProbedService): string | undefined {
  return HEALTH_ENDPOINTS[service];
}

/**
 * Never throws: a status page must degrade per tile. A 200 without `Healthy` is
 * still up (Router/Reporting are liveness-only); an `Unhealthy` body or a 503 is
 * down-with-detail.
 */
export async function probeService(
  service: ProbedService,
  timeoutMs: number = HEALTH_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<HealthProbeResult> {
  const url = healthUrlFor(service);
  if (!url) return { state: 'unknown' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      // No credentials, no Authorization header: the whole point is that this
      // works for a signed-out visitor.
      credentials: 'omit',
      cache: 'no-store',
    });
    // NOT swallowed with `.catch(() => '')`: the abort signal also governs body streaming, so a
    // service that returns 200 headers and then stalls would otherwise be scored "up".
    const body = await response.text();

    // Note the order: `Unhealthy` contains `healthy`, so test for the failure word first.
    const unhealthy = /unhealthy/i.test(body);

    if (response.ok && !unhealthy) {
      // A bare 200 with no body counts as up: Router and Reporting are liveness-only.
      return { state: 'up', status: response.status };
    }
    if (response.status === 503 || unhealthy) {
      return { state: 'down', reason: 'unhealthy', status: response.status };
    }
    return { state: 'down', reason: 'httpError', status: response.status };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return { state: 'down', reason: aborted ? 'timeout' : 'unreachable' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export async function probeAllServices(
  timeoutMs: number = HEALTH_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<Record<ProbedService, HealthProbeResult>> {
  const results = await Promise.all(
    PROBED_SERVICES.map(async (service) => [service, await probeService(service, timeoutMs, signal)] as const)
  );
  return Object.fromEntries(results) as Record<ProbedService, HealthProbeResult>;
}

/** Overall banner state: down if anything is down, unknown if nothing could be probed. */
export function overallState(results: Record<ProbedService, HealthProbeResult>): ServiceState {
  const states = Object.values(results).map((result) => result.state);
  if (states.some((state) => state === 'down')) return 'down';
  if (states.some((state) => state === 'up')) return 'up';
  return 'unknown';
}
