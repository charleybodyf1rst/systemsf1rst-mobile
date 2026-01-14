import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://bodyf1rst-backend-clean-mdkalcrowq-uc.a.run.app/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token storage keys
const AUTH_TOKEN_KEY = 'sf_auth_token';
const USER_KEY = 'sf_user';

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add app identifier
    config.headers['X-App'] = 'systemsf1rst-mobile';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
    }
    return Promise.reject(error);
  }
);

// Auth helper functions
export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

export const setStoredUser = async (user: object) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = async (): Promise<object | null> => {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const clearStoredUser = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
};

export default api;
