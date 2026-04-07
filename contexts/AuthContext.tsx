import { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  clearStoredToken,
  getStoredToken,
  login as loginRequest,
  logoutEverywhere as logoutEverywhereRequest,
  logout as logoutRequest,
  markEmailVerified as markEmailVerifiedRequest,
  me,
  requestPasswordReset as requestPasswordResetRequest,
  register as registerRequest,
  storeToken,
  updateProfile as updateProfileRequest,
} from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; role?: 'patient' | 'clinician' }) => Promise<void>;
  markEmailVerified: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  logoutEverywhere: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    me(existingToken)
      .then((nextUser) => {
        setUser(nextUser);
        setToken(existingToken);
      })
      .catch(() => {
        clearStoredToken();
        setUser(null);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await registerRequest(name, email, password);
    storeToken(response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    const existingToken = getStoredToken();
    if (existingToken) {
      await logoutRequest(existingToken).catch(() => undefined);
    }
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: { name?: string; role?: 'patient' | 'clinician' }) => {
    const existingToken = getStoredToken();
    if (!existingToken) throw new Error('Sign in again to update your profile.');
    const nextUser = await updateProfileRequest(existingToken, updates);
    setUser(nextUser);
  };

  const markEmailVerified = async () => {
    const existingToken = getStoredToken();
    if (!existingToken) throw new Error('Sign in again to verify your email.');
    const nextUser = await markEmailVerifiedRequest(existingToken);
    setUser(nextUser);
  };

  const requestPasswordReset = async (email: string) => {
    const response = await requestPasswordResetRequest(email);
    return response.message;
  };

  const logoutEverywhere = async () => {
    const existingToken = getStoredToken();
    if (!existingToken) throw new Error('Sign in again to manage sessions.');
    await logoutEverywhereRequest(existingToken);
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        markEmailVerified,
        requestPasswordReset,
        logoutEverywhere,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
