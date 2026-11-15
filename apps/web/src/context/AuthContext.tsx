import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerUser, CustomerPreferences, CustomerAuthResponse } from '../types/index.js';
import {
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  refreshCustomerSession,
  fetchCustomerProfile,
  fetchCustomerPreferences,
  updateCustomerPreferences
} from '../services/api.js';

interface AuthContextType {
  user: CustomerUser | null;
  preferences: CustomerPreferences | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'VERIFY';
  isOnboardingModalOpen: boolean;
  login: (email: string, password: string) => Promise<CustomerAuthResponse>;
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<CustomerAuthResponse>;
  logout: () => Promise<void>;
  updatePreferences: (data: Partial<CustomerPreferences>) => Promise<CustomerPreferences>;
  refreshProfile: () => Promise<void>;
  openAuthModal: (mode?: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'VERIFY') => void;
  closeAuthModal: () => void;
  openOnboardingModal: () => void;
  closeOnboardingModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'algions_customer_token';
// Note: Long-lived refresh tokens are stored strictly in HTTP-only cookies and in-memory state, NEVER in localStorage to prevent XSS credential exfiltration.

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [preferences, setPreferences] = useState<CustomerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'VERIFY'>('LOGIN');
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);

  const saveTokens = (accessToken: string, refresh?: string) => {
    setToken(accessToken);
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refresh) {
      setRefreshToken(refresh);
    }
  };

  const clearTokens = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setPreferences(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const refreshProfile = useCallback(async () => {
    // 1. If we have a local access token, probe profile
    if (token) {
      try {
        const [userProfile, userPrefs] = await Promise.all([
          fetchCustomerProfile(token),
          fetchCustomerPreferences(token)
        ]);
        setUser(userProfile);
        setPreferences(userPrefs);
        setIsLoading(false);
        return;
      } catch {
        // Access token might be expired; proceed to silent refresh via HTTP-only cookie
      }
    }

    // 2. Persistent session restoration: Silently rotate session using HTTP-only cookie
    try {
      const refreshed = await refreshCustomerSession();
      saveTokens(refreshed.token, refreshed.refreshToken);
      if (refreshed.user) setUser(refreshed.user);
      if (refreshed.preferences) {
        setPreferences(refreshed.preferences);
      } else {
        const prefs = await fetchCustomerPreferences(refreshed.token).catch(() => null);
        setPreferences(prefs);
      }
    } catch {
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const data = await loginCustomer({ email, password });
    saveTokens(data.token, data.refreshToken);
    setUser(data.user);
    setPreferences(data.preferences);
    setIsAuthModalOpen(false);

    // If customer has not completed onboarding, trigger the Brutalist Onboarding modal
    if (data.preferences && !data.preferences.onboarding_completed) {
      setIsOnboardingModalOpen(true);
    }
    return data;
  };

  const register = async (input: { email: string; password: string; full_name: string; phone?: string }) => {
    const data = await registerCustomer(input);
    saveTokens(data.token, data.refreshToken);
    setUser(data.user);
    setPreferences(data.preferences);
    setIsAuthModalOpen(false);

    // Automatically prompt onboarding preferences immediately upon registration
    setIsOnboardingModalOpen(true);
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutCustomer(token, refreshToken || undefined);
      }
    } finally {
      clearTokens();
    }
  };

  const updatePreferencesHandler = async (data: Partial<CustomerPreferences>): Promise<CustomerPreferences> => {
    if (!token) throw new Error('Customer authentication required to save preferences.');
    const updated = await updateCustomerPreferences(token, data);
    setPreferences(updated);
    return updated;
  };

  const openAuthModal = (mode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'VERIFY' = 'LOGIN') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openOnboardingModal = () => {
    setIsOnboardingModalOpen(true);
  };

  const closeOnboardingModal = () => {
    setIsOnboardingModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalMode,
        isOnboardingModalOpen,
        login,
        register,
        logout,
        updatePreferences: updatePreferencesHandler,
        refreshProfile,
        openAuthModal,
        closeAuthModal,
        openOnboardingModal,
        closeOnboardingModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
