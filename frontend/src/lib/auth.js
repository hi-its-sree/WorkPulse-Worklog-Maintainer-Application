import api from './api.js';
import { setAuthToken } from './api.js';

export { setAuthToken } from './api.js';

export const setStoredUser = (user) => {
  localStorage.setItem('workpulse_user', JSON.stringify(user));
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const { token, user } = response.data;
  localStorage.setItem('workpulse_token', token);
  setStoredUser(user);
  setAuthToken(token);
  return user;
};

export const registerUser = async (payload) => {
  const response = await api.post('/auth/register', payload);
  const { token, user } = response.data;
  localStorage.setItem('workpulse_token', token);
  setStoredUser(user);
  setAuthToken(token);
  return user;
};

export const getSecurityQuestions = async () => {
  const response = await api.get('/auth/security-questions');
  return response.data;
};

export const setupSecurityQuestions = async (payload) => {
  const response = await api.post('/auth/security-questions', payload);
  const { user } = response.data;
  setStoredUser(user);
  return response.data;
};

export const recoverPassword = async (payload) => {
  const response = await api.post('/auth/recover', payload);
  return response.data;
};

export const verifyRecoveryAnswers = async (payload) => {
  const response = await api.post('/auth/recover/verify', payload);
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateUserProfile = async (payload) => {
  const response = await api.patch('/users/me', payload);
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
