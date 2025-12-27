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

import { useEffect } from 'react';
import PropTypes from 'prop-types';

const ScaleControl = ({ mapRef, position = 'BOTTOM_LEFT' }) => {
    useEffect(() => {
        if (!mapRef || !mapRef.current || !window.google) return;

        const map = mapRef.current;
        
        // Add scale control to map
        map.setOptions({
            scaleControl: true,
            scaleControlOptions: {
                position: window.google.maps.ControlPosition[position]
            }
        });

        return () => {
            map.setOptions({ scaleControl: false });
        };
    }, [mapRef, position]);

    return null;
};

ScaleControl.propTypes = {
    mapRef: PropTypes.object.isRequired,
    position: PropTypes.oneOf(['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'])
};

export default ScaleControl;
