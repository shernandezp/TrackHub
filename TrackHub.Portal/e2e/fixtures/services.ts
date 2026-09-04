/**
 * The services the status page probes.
 *
 * Derived from the locale bundle rather than hardcoded: `PROBED_SERVICES`
 * (`src/api/core/healthProbe.ts`) and `platformStatus.services` are kept in step
 * by the page itself — it renders one tile per probed service and localizes its
 * name from that key — so a backend added to one and not the other is a bug this
 * list surfaces. `syncWorker` is excluded: it is not probed, it is derived from
 * sync activity and only shown to the manager/administrator tier.
 */

import en from '../../src/locales/en.json';

export const PROBED_SERVICE_NAMES: readonly string[] = Object.keys(
  en.platformStatus.services
).filter((service) => service !== 'syncWorker');

/** How many tiles the page renders for a signed-out visitor. */
export const PROBED_SERVICE_COUNT = PROBED_SERVICE_NAMES.length;
