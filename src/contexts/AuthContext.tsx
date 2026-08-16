import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  error: string | null;
  login: (email: string, password?: string) => Promise<UserProfile>;
  loginWithDemo: (role: UserRole, departmentId?: string) => Promise<UserProfile>;
  signupCitizen: (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    ward: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
    password?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: UserProfile | null }>;
      setUser(customEvent.detail?.user || null);
    };

    window.addEventListener('civicconnect:auth_state_change', handleAuthChange);
    return () => {
      window.removeEventListener('civicconnect:auth_state_change', handleAuthChange);
    };
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password?: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = async (targetRole: UserRole, departmentId?: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.quickDemoLogin(targetRole, departmentId);
      setUser(loggedUser);
      return loggedUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo switch failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signupCitizen = async (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    ward: string;
    village?: string;
    district: string;
    state: string;
    pincode: string;
    password?: string;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.registerCitizen(data);
      setUser(newUser);
      return newUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        role: user ? user.role : null,
        error,
        login,
        loginWithDemo,
        signupCitizen,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
