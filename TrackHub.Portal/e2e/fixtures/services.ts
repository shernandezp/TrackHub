/**
 * The services the status page probes.
 *
 * Derived from the locale bundle rather than hardcoded: `PROBED_SERVICES`
 * (`src/api/core/healthProbe.ts`) and `platformStatus.services` are kept in step
 * by the page itself — it renders one tile per probed service and localizes its
 * name from that key — so a backend added to one and not the other is a bug this
 * list surfaces. `syncWorker` is excluded: it is not probed, it is derived from
 * sync activity and only shown to the manager/administrator tier.
 *
 * The bundle is the MERGED one: an edition that adds services carries their names
 * in its own overlay, and reading the core bundle alone undercounts the tiles.
 */

import { BUNDLES } from './i18n';

const services = (BUNDLES.en as { platformStatus: { services: Record<string, string> } })
  .platformStatus.services;

export const PROBED_SERVICE_NAMES: readonly string[] = Object.keys(services).filter(
  (service) => service !== 'syncWorker'
);

/** How many tiles the page renders for a signed-out visitor. */
export const PROBED_SERVICE_COUNT = PROBED_SERVICE_NAMES.length;
