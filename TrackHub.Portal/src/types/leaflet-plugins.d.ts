/**
 * `leaflet-editable` and `leaflet-fullscreen` ship no types. Importing `leaflet` makes this a
 * module, so `declare module 'leaflet'` merges with @types/leaflet. Only called members are declared.
 */
import 'leaflet';

declare module 'leaflet' {
  class Editable {
    constructor(map: Map, options?: unknown);
    startPolygon(latlng?: LatLng): Polygon;
    startCircle(latlng?: LatLng): Circle;
    stopDrawing(): void;
  }

  interface Map {
    editTools: Editable;
  }

  interface Polygon {
    enableEdit(map?: Map): this;
    disableEdit(): this;
    editEnabled(): boolean;
  }

  interface Circle {
    enableEdit(map?: Map): this;
    disableEdit(): this;
    editEnabled(): boolean;
  }

  namespace Control {
    interface FullscreenOptions extends ControlOptions {
      title?: string | { false: string; true: string };
      forceSeparateButton?: boolean;
      content?: string | null;
    }
    class Fullscreen extends Control {
      constructor(options?: FullscreenOptions);
    }
  }

  namespace control {
    function fullscreen(options?: Control.FullscreenOptions): Control.Fullscreen;
  }
}
