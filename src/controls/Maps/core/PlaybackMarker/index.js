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
import OSMPlaybackMarker from './OSM';
import GooglePlaybackMarker from './Google';

/**
 * Provider-agnostic playback marker. Positioned imperatively (no React
 * re-mount per tick) while a trip playback animation is running.
 * `position` is `{ lat, lng, course? }`.
 */
const PlaybackMarker = ({ position }) => {
  const { provider } = useMapProvider();
  if (!position) return null;
  return provider === MAP_PROVIDERS.GOOGLE
    ? <GooglePlaybackMarker position={position} />
    : <OSMPlaybackMarker position={position} />;
};

PlaybackMarker.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    course: PropTypes.number
  })
};

export default PlaybackMarker;
