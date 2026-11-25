/**
 * Derived from the merged locale bundle rather than hardcoded, so a backend added
 * to `PROBED_SERVICES` but not to `platformStatus.services` (or vice versa)
 * surfaces here. `syncWorker` is excluded: it is derived from sync activity, not probed.
 */

import { BUNDLES } from './i18n';

const services = (BUNDLES.en as { platformStatus: { services: Record<string, string> } })
  .platformStatus.services;

export const PROBED_SERVICE_NAMES: readonly string[] = Object.keys(services).filter(
  (service) => service !== 'syncWorker'
);

export const PROBED_SERVICE_COUNT = PROBED_SERVICE_NAMES.length;
