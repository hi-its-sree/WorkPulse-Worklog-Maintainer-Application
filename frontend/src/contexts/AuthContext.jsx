import { createContext, useEffect, useMemo, useState } from 'react';
import { getStoredToken, getStoredUser, logoutUser, setAuthToken, setStoredUser } from '../lib/auth.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setAuthToken(token);
    }
    setLoading(false);
  }, []);

  const signIn = (userData) => {
    setStoredUser(userData);
    setUser(userData);
  };

  const signOut = () => {
    logoutUser();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
