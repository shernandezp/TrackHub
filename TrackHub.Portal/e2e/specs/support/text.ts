/**
 * Restated from `src/utils/stringUtils.ts` (keep in step): importing from `src/`
 * is not possible because its neighbours resolve through the `src/*` path aliases.
 */

/** `Live_Report` / `live.report` / `live-report` → `liveReport`. */
export function toCamelCase(value: string): string {
  return value
    .replace(/([-_.][a-z])/gi, (match) => match.toUpperCase().replace(/[-_.]/g, ''))
    .replace(/(^[A-Z])/g, (match) => match.toLowerCase());
}
