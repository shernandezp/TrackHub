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

import { createContext, useContext } from 'react';

export const MAP_PROVIDERS = {
  OSM: 'OSM',
  GOOGLE: 'Google'
} as const;

export type MapProvider = (typeof MAP_PROVIDERS)[keyof typeof MAP_PROVIDERS];

export interface MapProviderValue {
  provider: MapProvider;
}

// Stable context values so provider components can pass them without re-creating objects.
export const OSM_PROVIDER: MapProviderValue = { provider: MAP_PROVIDERS.OSM };
export const GOOGLE_PROVIDER: MapProviderValue = { provider: MAP_PROVIDERS.GOOGLE };

/** Lets feature layers written against the core contract dispatch to the hosting provider's adapter. */
const MapProviderContext = createContext<MapProviderValue>(OSM_PROVIDER);

export const useMapProvider = () => useContext(MapProviderContext);

export default MapProviderContext;
