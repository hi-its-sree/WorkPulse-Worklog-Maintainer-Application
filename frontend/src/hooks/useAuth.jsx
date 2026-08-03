import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser, setAuthToken, logoutUser } from '../lib/auth.js';

export const useAuth = () => {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const token = getStoredToken();
    if (token) setAuthToken(token);
  }, []);

  const signIn = (userData) => {
    setUser(userData);
  };

  const signOut = () => {
    logoutUser();
    setUser(null);
  };

  return { user, signIn, signOut };
};
