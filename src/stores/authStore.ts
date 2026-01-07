import { create } from 'zustand';
import {
  api,
  setAuthToken,
  getAuthToken,
  setStoredUser,
  getStoredUser,
  clearAuth,
} from '../lib/api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  display_role?: string;
  organization_id?: number;
  studio_id?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        app: 'systemsf1rst-mobile',
      });

      const { token, user } = response.data;

      await setAuthToken(token);
      await setStoredUser(user);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }

    await clearAuth();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getAuthToken();
      const storedUser = await getStoredUser();

      if (token && storedUser) {
        // Verify token is still valid
        try {
          const response = await api.get('/auth/me');
          const user = response.data.user || response.data;

          await setStoredUser(user);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch (error) {
          // Token invalid, clear auth
          await clearAuth();
        }
      }

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
      setStoredUser(updatedUser);
    }
  },
}));
