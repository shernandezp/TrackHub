/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import OSMClusteredMapBase from 'controls/Maps/OSM/OSMClusteredMap';
import GoogleClusteredMapBase from 'controls/Maps/Google/GoogleClusteredMap';
import { getUnitStatus } from 'layouts/dashboard/utils/dashboard';
import type { UnitStatus } from 'layouts/dashboard/utils/dashboard';
import { getStatusMarkerColor, getStatusMarkerLabel } from 'controls/Maps/utils/markerUtils';
import type { Position } from 'api/router/router';
import type { Geofence } from 'api/geofencing/geofencing';
import type { PointOfInterest } from 'api/manager/pointsOfInterest';
import 'controls/Maps/css/map.css';

/** A trail point (client-side ring buffer entry) for the selected unit. */
export interface TrailPoint { lat: number; lng: number; dateTime: string; }

/** A rendered map marker derived from a live {@link Position}. */
interface Marker {
  id: string;
  lat: number;
  lng: number;
  rotation: number | null;
  name: string;
  dateTime: string;
  speed: number;
  status: UnitStatus;
  color: string;
  text: string;
  attributes: object;
  address: string | null;
  altitude: number | null;
  city: string | null;
  country: string | null;
  state: string | null;
  transporterType: string;
}

// Vendored (untyped) clustered-map controls — type the prop slice crossing the boundary.
interface ClusteredMapProps {
  markers: Marker[];
  mapKey?: string | null;
  selectedMarker?: string | null;
  geofences?: Geofence[];
  showGeofence?: boolean;
  handleSelected?: (value: string | null) => void;
  pois?: PointOfInterest[];
  showPois?: boolean;
  trail?: TrailPoint[];
  showTrail?: boolean;
  followUnit?: string | null;
  onFollowDisengage?: () => void;
  darkMode?: boolean;
  viewportThreshold?: number;
  height?: string;
}
const OSMClusteredMap = OSMClusteredMapBase as unknown as (props: ClusteredMapProps) => ReactNode;
const GoogleClusteredMap = GoogleClusteredMapBase as unknown as (props: ClusteredMapProps) => ReactNode;

interface GeneralMapProps {
  mapType: 'OSM' | 'Google';
  positions: Position[];
  mapKey?: string | null;
  selectedMarker?: string | null;
  geofences?: Geofence[];
  showGeofence?: boolean;
  handleSelected?: (value: string | null) => void;
  onlineInterval?: number;
  pois?: PointOfInterest[];
  showPois?: boolean;
  trail?: TrailPoint[];
  showTrail?: boolean;
  followUnit?: string | null;
  onFollowDisengage?: () => void;
  darkMode?: boolean;
  viewportThreshold?: number;
  height?: string;
}

function GeneralMap({
    mapType,
    positions,
    mapKey,
    selectedMarker,
    geofences,
    showGeofence,
    handleSelected,
    onlineInterval,
    pois = [],
    showPois = false,
    trail = [],
    showTrail = false,
    followUnit = null,
    onFollowDisengage,
    darkMode = false,
    viewportThreshold = 1000,
    height = "70vh" }: GeneralMapProps) {

    const [markers, setMarkers] = useState<Marker[]>([]);
    useEffect(() => {
        const fetchMarkers = async () => {
            const markers: Marker[] = positions.map(item => {
                const status = getUnitStatus(item, onlineInterval as number);
                return {
                    id: item.transporterId,
                    lat: item.latitude,
                    lng: item.longitude,
                    rotation: item.course,
                    name: item.deviceName,
                    dateTime: item.deviceDateTime,
                    speed: item.speed,
                    status,
                    color: getStatusMarkerColor(status),
                    text: getStatusMarkerLabel(status),
                    // Additional attributes
                    attributes: item.attributes || {},
                    address: item.address,
                    altitude: item.altitude,
                    city: item.city,
                    country: item.country,
                    state: item.state,
                    transporterType: item.transporterType,
                };
            });
            setMarkers(markers);
        };
        fetchMarkers();
      }, [positions, onlineInterval]);

    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMClusteredMap
                    markers={markers}
                    selectedMarker={selectedMarker}
                    geofences={geofences}
                    showGeofence={showGeofence}
                    handleSelected={handleSelected}
                    pois={pois}
                    showPois={showPois}
                    trail={trail}
                    showTrail={showTrail}
                    followUnit={followUnit}
                    onFollowDisengage={onFollowDisengage}
                    darkMode={darkMode}
                    viewportThreshold={viewportThreshold}
                    height={height} />
            ) : (
                mapType === 'Google' &&
                    <GoogleClusteredMap
                        markers={markers}
                        mapKey={mapKey}
                        selectedMarker={selectedMarker}
                        geofences={geofences}
                        showGeofence={showGeofence}
                        handleSelected={handleSelected}
                        pois={pois}
                        showPois={showPois}
                        trail={trail}
                        showTrail={showTrail}
                        followUnit={followUnit}
                        onFollowDisengage={onFollowDisengage}
                        darkMode={darkMode}
                        viewportThreshold={viewportThreshold}
                        height={height} />
            )}
        </div>
    );
}

export default GeneralMap;
