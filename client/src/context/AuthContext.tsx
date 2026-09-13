import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { tokenStore, setAuthFailureHandler } from '../api/client';
import type { AuthResult, Teacher } from '../types';

interface AuthContextValue {
  teacher: Teacher | null;
  initializing: boolean;
  isAuthenticated: boolean;
  setSession: (result: AuthResult) => void;
  setTeacher: (teacher: Teacher) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [initializing, setInitializing] = useState(true);

  const setSession = useCallback((result: AuthResult) => {
    tokenStore.set(result.accessToken);
    setTeacher(result.teacher);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    tokenStore.set(null);
    setTeacher(null);
  }, []);

  // If a background token refresh ultimately fails, drop the session.
  useEffect(() => {
    setAuthFailureHandler(() => setTeacher(null));
    return () => setAuthFailureHandler(null);
  }, []);

  // On load, try to restore the session (the interceptor refreshes via cookie).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await authApi.me();
        if (active) setTeacher(t);
      } catch {
        if (active) setTeacher(null);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value: AuthContextValue = {
    teacher,
    initializing,
    isAuthenticated: !!teacher,
    setSession,
    setTeacher,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
