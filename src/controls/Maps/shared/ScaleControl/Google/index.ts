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
import type { RefObject } from 'react';

type ControlCorner = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';

interface ScaleControlProps {
    mapRef: RefObject<google.maps.Map | null>;
    position?: ControlCorner;
}

const ScaleControl = ({ mapRef, position = 'BOTTOM_LEFT' }: ScaleControlProps) => {
    useEffect(() => {
        if (!mapRef || !mapRef.current || !window.google) return;

        const map = mapRef.current;

        // Add scale control to map
        map.setOptions({
            scaleControl: true,
            // google.maps.ScaleControlOptions has no `position` (the scale control
            // sits bottom-right); this preserves the original call, which the API
            // ignores at runtime.
            scaleControlOptions: {
                position: window.google.maps.ControlPosition[position]
            } as google.maps.ScaleControlOptions
        });

        return () => {
            map.setOptions({ scaleControl: false });
        };
    }, [mapRef, position]);

    return null;
};

export default ScaleControl;
