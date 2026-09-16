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

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AccountSettings } from 'api/manager/settings';

interface RefreshCounterProps {
  settings: AccountSettings;
  fetchPositions: () => void;
  calculateReference: () => void;
}

function RefreshCounter({ settings, fetchPositions, calculateReference }: RefreshCounterProps): ReactNode {
    const [counter, setCounter] = useState(settings.refreshMapInterval || 60);

    // The callbacks are new identities on every parent render, so the tick reads them from refs
    // instead of closing over the ones from the render that last changed the counter — which is how
    // a refreshed settings document used to leave the countdown running on the old interval.
    const fetchPositionsRef = useRef(fetchPositions);
    const calculateReferenceRef = useRef(calculateReference);
    fetchPositionsRef.current = fetchPositions;
    calculateReferenceRef.current = calculateReference;

    const { refreshMap, refreshMapInterval } = settings;

    useEffect(() => {
      if (!refreshMap) {
        return;
      }

      if (counter === 0) {
        fetchPositionsRef.current();
        calculateReferenceRef.current();
        setCounter(refreshMapInterval || 60);
        return;
      }

      const timer = setTimeout(() => setCounter((current) => current - 1), 1000);
      return () => clearTimeout(timer);
    }, [counter, refreshMap, refreshMapInterval]);

    return refreshMap && <div className="mapcontrol">{counter} s.</div>;
  }

  export default RefreshCounter;
