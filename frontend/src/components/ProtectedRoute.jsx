import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!user.securityQuestionsConfigured && location.pathname !== '/security-setup') {
    return <Navigate to="/security-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;
