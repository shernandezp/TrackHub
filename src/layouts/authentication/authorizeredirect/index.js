import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const AuthorizeRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    const { search } = location;
    const urlParams = new URLSearchParams(search);
    const authorizationUrl = urlParams.get("authorizationUrl");

    if (authorizationUrl) {
      window.location.href = decodeURIComponent(authorizationUrl);
    }
  }, [location]);

  return null;
};

export default AuthorizeRedirect;