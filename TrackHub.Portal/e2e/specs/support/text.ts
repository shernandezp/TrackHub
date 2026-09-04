/**
 * The portal's own key-shaping helpers, restated so a spec can build the same
 * i18n key a component builds. Kept byte-for-byte in step with
 * `src/utils/stringUtils.ts`; importing from `src/` is not possible here because
 * that module's neighbours resolve through the portal's `src/*` path aliases.
 */

/** `Live_Report` / `live.report` / `live-report` → `liveReport`. */
export function toCamelCase(value: string): string {
  return value
    .replace(/([-_.][a-z])/gi, (match) => match.toUpperCase().replace(/[-_.]/g, ''))
    .replace(/(^[A-Z])/g, (match) => match.toLowerCase());
}
