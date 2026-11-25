/** Module declarations for dependencies that ship no types and have no @types package. */

// The Google Maps JS API attaches its namespace to `window.google` at
// runtime once the loader script resolves. @types/google.maps declares the
// global `google` namespace but not this Window property.
interface Window {
  google: typeof google;
}

declare module 'leaflet-fullscreen' {
  // Side-effect plugin: augments L.Map with fullscreen control options.
  const plugin: unknown;
  export default plugin;
}

// Side-effect-only deep import of the plugin bundle (registers L.control.fullscreen).
declare module 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';

// The `leaflet` module augmentation lives in `leaflet-plugins.d.ts` (a module file) so it
// *merges* with @types/leaflet: a `declare module 'leaflet'` in this script file would replace
// the package's own types.

