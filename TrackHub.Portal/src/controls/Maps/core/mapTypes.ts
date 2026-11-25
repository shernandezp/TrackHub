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

export interface MarkerAttributes {
  mileage?: number | null;
  temperature?: number | null;
  hourmeter?: number | null;
  ignition?: boolean | null;
  satellites?: number | null;
}

export interface MapMarker {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  rotation: number;
  dateTime?: string | number | Date | null;
  transporterType?: string;
  altitude?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  attributes?: MarkerAttributes | null;
  status?: 'moving' | 'stopped' | 'offline';
}

/** A geofence rendered as an overlay: a true circle when the circle fields are set, else a polygon. */
export interface MapGeofence {
  geofenceId?: string;
  name: string;
  color: number;
  geom: {
    coordinates: Array<{ latitude: number; longitude: number }>;
  };
  circleCenter?: { latitude: number; longitude: number } | null;
  circleRadiusMeters?: number | null;
}

/** Segment kinds of a replayed position history (Router `TripTypeEnum`). */
export const TRIP_TYPE = { stop: 1, moving: 2, noData: 3 } as const;

export interface MapTrip {
  id: string;
  coordinates: [number, number][];
  color?: string;
  type?: number;
}

export interface MapPoi {
  name: string;
  latitude: number;
  longitude: number;
  color: number;
  type: number;
  description?: string | null;
  address?: string | null;
  active?: boolean;
}

export interface TrailPoint {
  lat: number;
  lng: number;
}

export interface PlaybackPosition {
  lat: number;
  lng: number;
  course?: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

/** `status` drives the pin colour so a dispatcher reads progress off the map. */
export interface RouteStop {
  id?: string;
  sequence: number;
  name: string;
  lat: number;
  lng: number;
  status?: string;
  address?: string | null;
  etaAt?: string | null;
}

/**
 * `hasTariff: false` means the station is on the route but NOT priced for the trip's vehicle
 * class; the marker must show that gap rather than imply a zero cost.
 */
export interface RouteTollStation {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  hasTariff: boolean;
  amount?: number | null;
  currency?: string | null;
  roadName?: string | null;
}
