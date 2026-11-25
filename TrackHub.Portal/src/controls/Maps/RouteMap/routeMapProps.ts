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

import type {
  RoutePoint,
  RouteStop,
  RouteTollStation,
  TrailPoint,
  PlaybackPosition,
  MapPoi,
} from 'controls/Maps/core/mapTypes';

/** Declared once so the OSM and Google hosts cannot drift apart. */
export interface RouteMapProps {
  route?: RoutePoint[];
  corridor?: RoutePoint[];
  stops?: RouteStop[];
  tollStations?: RouteTollStation[];
  /** Recorded positions for replay, drawn as a trail. */
  trail?: TrailPoint[];
  /** Account points of interest, offered as stop-placement targets. */
  pois?: MapPoi[];
  playbackPosition?: PlaybackPosition | null;
  /** Stop-placement gesture: fires with the clicked coordinate. */
  onMapClick?: (point: RoutePoint) => void;
  onStopClick?: (stopId: string) => void;
  darkMode?: boolean;
  height?: string;
  /** Google Maps API key — ignored by the OSM host. */
  mapKey?: string | null;
}
