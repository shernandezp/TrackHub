/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import React, { useState, useEffect  } from 'react';
import PropTypes from 'prop-types';

function RefreshCounter({ settings, fetchPositions }) {
    const [counter, setCounter] = useState(settings.refreshMapInterval || 60);
  
    useEffect(() => {
      if (counter === 0) {
        fetchPositions();
        setCounter(settings.refreshMap ? settings.refreshMapInterval : 60);
      } else if (settings.refreshMap) { 
        const timer = setInterval(() => setCounter(counter - 1), 1000);
        return () => clearInterval(timer);
      }
    }, [counter, settings.refreshMap]);
  
    return settings.refreshMap && <div className="label">{counter} s.</div>;
  }
  
  RefreshCounter.propTypes = {
    settings: PropTypes.object.isRequired,
    fetchPositions: PropTypes.func.isRequired
  };

  export default RefreshCounter;