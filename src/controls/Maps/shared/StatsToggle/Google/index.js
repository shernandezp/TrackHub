import { useEffect } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const GoogleStatsToggle = ({ position = 'TOP_LEFT', toggleStats, showStats }) => {
  const { t } = useTranslation();
  const map = useGoogleMap();

  useEffect(() => {
    if (!map || !window.google) return;

    const controlButton = document.createElement('button');
    controlButton.textContent = '📊';
    controlButton.title = showStats ? t("utilsmap.hideStatistics") : t("utilsmap.showStatistics");
    controlButton.style.cssText = `
      background: white;
      border: 2px solid rgba(0,0,0,.2);
      border-radius: 3px;
      box-shadow: rgba(0,0,0,.3) 0 1px 4px -1px;
      cursor: pointer;
      margin: 10px;
      padding: 0;
      width: 40px;
      height: 40px;
      font-size: 18px;
    `;

    const onClick = () => toggleStats && toggleStats();
    controlButton.addEventListener('click', onClick);

    const pos = window.google.maps.ControlPosition[position] || window.google.maps.ControlPosition.TOP_LEFT;
    map.controls[pos].push(controlButton);

    return () => {
      controlButton.removeEventListener('click', onClick);
      if (controlButton.parentNode) controlButton.parentNode.removeChild(controlButton);
    };
  }, [map, position, toggleStats, showStats]);

  return null;
};

export default GoogleStatsToggle;

GoogleStatsToggle.propTypes = {
  position: PropTypes.oneOf(['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT']),
  toggleStats: PropTypes.func,
  showStats: PropTypes.bool
};
