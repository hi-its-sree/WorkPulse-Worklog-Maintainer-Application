import api from './api.js';
import { setAuthToken } from './api.js';

export { setAuthToken } from './api.js';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const { token, user } = response.data;
  localStorage.setItem('workpulse_token', token);
  localStorage.setItem('workpulse_user', JSON.stringify(user));
  setAuthToken(token);
  return user;
};

export const registerUser = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('workpulse_token');
  localStorage.removeItem('workpulse_user');
  setAuthToken(null);
};

export const getStoredUser = () => {
  const user = localStorage.getItem('workpulse_user');
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = () => localStorage.getItem('workpulse_token');
