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

import React from 'react';
import PropTypes from 'prop-types';
import { useMapProvider, MAP_PROVIDERS } from 'controls/Maps/core/MapProviderContext';
import OSMTrailLayer from './OSM';
import GoogleTrailLayer from './Google';

/**
 * Provider-agnostic trail layer: a short polyline of the last N received
 * points for the selected unit. Points are `{ lat, lng }` objects.
 */
const TrailLayer = ({ points = [], color = '#1E90FF' }) => {
  const { provider } = useMapProvider();
  return provider === MAP_PROVIDERS.GOOGLE
    ? <GoogleTrailLayer points={points} color={color} />
    : <OSMTrailLayer points={points} color={color} />;
};

TrailLayer.propTypes = {
  points: PropTypes.arrayOf(PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  })),
  color: PropTypes.string
};

export default TrailLayer;
