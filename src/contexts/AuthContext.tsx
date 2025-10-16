import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { apiClient } from '../api';
import { wsClient } from '../api';
import type { User, LoginRequest, RegisterRequest } from '../api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterRequest, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      // Demo mode: Skip backend authentication
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

      if (isDemoMode) {
        console.log('Running in demo mode - backend authentication disabled');
        setIsLoading(false);
        return;
      }

      if (apiClient.isAuthenticated()) {
        try {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);

          // TEMPORARILY DISABLED: WebSocket for real-time features
          // TODO: Fix WebSocket handshake issue (see src/api/websocket/server.ts)
          // const token = apiClient.getToken();
          // if (token) {
          //   wsClient.connect(token);
          // }
        } catch (error) {
          console.warn('Backend not available - running in demo mode:', error);
          apiClient.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      // Demo mode: Mock authentication
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

      if (isDemoMode) {
        const mockUser: User = {
          id: 'demo-user',
          email: credentials.email,
          username: credentials.email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        flushSync(() => {
          setUser(mockUser);
        });
        return;
      }

      const response = await apiClient.login(credentials, rememberMe);

      // Use flushSync to ensure state updates synchronously before navigation
      flushSync(() => {
        setUser(response.user);
      });

      // TEMPORARILY DISABLED: WebSocket for real-time features
      // TODO: Fix WebSocket handshake issue (see src/api/websocket/server.ts)
      // wsClient.connect(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const response = await apiClient.register(data, rememberMe);
      setUser(response.user);

      // TEMPORARILY DISABLED: WebSocket for real-time features
      // TODO: Fix WebSocket handshake issue (see src/api/websocket/server.ts)
      // wsClient.connect(response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      wsClient.disconnect();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!apiClient.isAuthenticated()) return;

    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
