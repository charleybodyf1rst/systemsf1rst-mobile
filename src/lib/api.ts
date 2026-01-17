import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API configuration from app.json extra config
const extra = Constants.expoConfig?.extra ?? {};
const API_BASE_URL = extra.apiBaseUrl ?? 'https://bodyf1rst-backend-clean-mdkalcrowq-uc.a.run.app/api';

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
const REFRESH_TOKEN_KEY = 'sf_refresh_token';
const USER_KEY = 'sf_user';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Refresh token function
const refreshAuthToken = async (): Promise<string | null> => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { token, refresh_token: newRefreshToken } = response.data;

    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      return token;
    }
    return null;
  } catch {
    // Refresh failed - clear all auth data
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    return null;
  }
};

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

// Response interceptor to handle auth errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401 errors on non-auth endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();

        if (newToken) {
          // Refresh successful - retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          // Refresh failed - clear auth and reject
          processQueue(new Error('Token refresh failed'), null);
          await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      } finally {
        isRefreshing = false;
      }
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
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
};

// Refresh token helpers
export const setRefreshToken = async (token: string) => {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearRefreshToken = async () => {
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Set both tokens at once (useful after login)
export const setAuthTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
};

export default api;
