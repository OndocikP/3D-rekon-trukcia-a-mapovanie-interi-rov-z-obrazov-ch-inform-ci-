import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiClient from '../api/client';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Načítaj token na start
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authToken');
      if (savedToken) {
        // Skontroluj či je token stále platný
        const response = await apiClient.getCurrentUser(savedToken);
        if (response.data) {
          setToken(savedToken);
          setUser(response.data);
        } else {
          // Token už nie je platný
          await AsyncStorage.removeItem('authToken');
        }
      }
    } catch (err) {
      console.error('Token restore error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    console.log('🔑 AuthContext.login volany');
    const response = await apiClient.login({ username, password });
    console.log('📡 API Response:', response);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      const authToken = response.data.access_token;
      console.log('✅ Token prijatá:', authToken.substring(0, 10) + '...');
      setToken(authToken);
      setUser(response.data.user);
      console.log('💾 Ukladám token do AsyncStorage');
      await AsyncStorage.setItem('authToken', authToken);
      console.log('✓ Token uložený');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiClient.register({
      username,
      email,
      password,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data) {
      setUser(response.data);
      // Po registrácii ešte treba prihlásenie
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('authToken');
  };

  const forgotPassword = async (email: string) => {
    const response = await apiClient.forgotPassword(email);
    if (response.error) {
      throw new Error(response.error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isLoggedIn: !!token,
    login,
    register,
    logout,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth musí byť použitý v AuthProvider');
  }
  return context;
}
