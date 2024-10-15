import React, { useState, useEffect  } from 'react';
import PropTypes from 'prop-types';

function RefreshCounter({ settings, fetchPositions }) {
    const [counter, setCounter] = useState(settings.refreshMapTimer || 60);
  
    useEffect(() => {
      if (counter === 0) {
        fetchPositions();
        setCounter(settings.refreshMap ? settings.refreshMapTimer : 60);
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