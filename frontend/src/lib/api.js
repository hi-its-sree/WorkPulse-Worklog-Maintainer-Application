import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Tokens expire while the app is open. Without this the stored token kept the UI
// looking signed in while every request failed with 401 and saves were lost.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isExpiredSession = error?.response?.status === 401 && !String(error?.config?.url || '').startsWith('/auth/');
    if (isExpiredSession) {
      localStorage.removeItem('workpulse_token');
      localStorage.removeItem('workpulse_user');
      setAuthToken(null);
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.location.assign('/?sessionExpired=1');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
