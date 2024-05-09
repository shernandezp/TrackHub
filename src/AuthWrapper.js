import { useNavigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PropTypes from 'prop-types';

const AuthWrapper = ({ children }) => {
  const navigate = useNavigate();

  return (
    <AuthProvider navigate={navigate}>
      {children}
    </AuthProvider>
  );
};

AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthWrapper;
