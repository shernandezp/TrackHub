import { useEffect } from "react";
import PropTypes from "prop-types";

const UserLocation = ({ setUserLocation }) => {
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting user's location:", error);
        }
      );
    }
  }, [setUserLocation]);

  return null;
};

UserLocation.propTypes = {
  setUserLocation: PropTypes.func.isRequired,
};

export default UserLocation;