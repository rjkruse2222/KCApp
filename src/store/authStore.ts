import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthProvider, AuthState } from '../types';
import { STORAGE_KEYS } from '../config/constants';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken?: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,

  // Actions
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken: refreshToken ?? get().refreshToken });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  login: async (user, accessToken, refreshToken) => {
    try {
      // Store tokens securely
      await SecureStore.setItemAsync(STORAGE_KEYS.authToken, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken);
      }
      // Store user data
      await SecureStore.setItemAsync(STORAGE_KEYS.user, JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken: refreshToken ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear stored tokens
      await SecureStore.deleteItemAsync(STORAGE_KEYS.authToken);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.user);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.authToken),
        SecureStore.getItemAsync(STORAGE_KEYS.refreshToken),
        SecureStore.getItemAsync(STORAGE_KEYS.user),
      ]);

      if (accessToken && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },
}));
