import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { changePassword as changePasswordRequest, fetchMe, login as loginRequest, type MeResponse, type TokenPair } from '../api/authApi';
import { ACCESS_TOKEN_KEY, clearTokens, hasTokens, setTokens } from './tokenStorage';
import { ApiError } from './apiClient';

type AuthContextValue = {
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  completeRegistration: (tokens: TokenPair) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuthenticatedUser = useCallback(async (tokens: TokenPair) => {
    if (!tokens.token || !tokens.refreshToken) {
      throw new Error('The authentication service did not return a complete session.');
    }
    setTokens(tokens.token, tokens.refreshToken);
    try {
      setUser(await fetchMe());
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearTokens();
      }
      setUser(null);
      throw error;
    }
  }, []);

  const applyMe = useCallback(async () => {
    if (!hasTokens()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearTokens();
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      await Promise.resolve();
      if (!hasTokens()) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearTokens();
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACCESS_TOKEN_KEY && event.key !== null) return;
      if (!hasTokens()) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void fetchMe()
        .then(setUser)
        .catch((error: unknown) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            clearTokens();
          }
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    await loadAuthenticatedUser(await loginRequest(identifier, password));
  }, [loadAuthenticatedUser]);

  const completeRegistration = useCallback(async (tokens: TokenPair) => {
    await loadAuthenticatedUser(tokens);
  }, [loadAuthenticatedUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await loadAuthenticatedUser(await changePasswordRequest(currentPassword, newPassword));
  }, [loadAuthenticatedUser]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      completeRegistration,
      changePassword,
      logout,
      refreshUser: applyMe,
    }),
    [user, isLoading, login, completeRegistration, changePassword, logout, applyMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally colocated with its provider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
