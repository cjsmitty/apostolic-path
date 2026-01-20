/**
 * Authentication utilities and context
 */

import type { Church, User } from '@apostolic-path/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiError } from './api';

// Module-level variable to prevent duplicate auth checks (survives re-renders)
let authCheckPromise: Promise<void> | null = null;

interface AuthState {
  user: User | null;
  church: Church | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      church: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post<LoginResponse>('/auth/login', {
            email,
            password,
          });

          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('auth_token', token);
            
            // Fetch church data after login (optional - platform admins may not have a church)
            let church: Church | null = null;
            try {
              const churchResponse = await api.get<Church>('/churches/me');
              church = churchResponse.data || null;
            } catch {
              // Platform admins don't have a church - this is expected
              console.log('No church found for user (may be platform admin)');
            }
            
            set({ user, church, token, isAuthenticated: true, isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, church: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      checkAuth: async () => {
        // If already checking, wait for the existing check
        if (authCheckPromise) {
          return authCheckPromise;
        }
        
        const state = get();
        if (state.isAuthenticated && state.user) {
          set({ isLoading: false });
          return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        // Create a single promise for concurrent callers
        authCheckPromise = (async () => {
          try {
            // Fetch user first
            const userResponse = await api.get<User>('/auth/me');
            
            if (userResponse.success && userResponse.data) {
              // Try to fetch church (optional - platform admins may not have one)
              let church: Church | null = null;
              try {
                const churchResponse = await api.get<Church>('/churches/me');
                church = churchResponse.data || null;
              } catch {
                // Platform admins don't have a church - this is expected
              }
              
              set({ 
                user: userResponse.data, 
                church,
                token, 
                isAuthenticated: true, 
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              localStorage.removeItem('auth_token');
              set({ user: null, church: null, token: null, isAuthenticated: false, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          } finally {
            authCheckPromise = null;
          }
        })();

        return authCheckPromise;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
