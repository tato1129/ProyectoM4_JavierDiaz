import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  loginWithEmail,
  loginWithGoogleProvider,
  logoutUser,
  registerWithEmail,
  subscribeToAuthChanges,
} from '../../services/authService';
import type { AuthUser, Credentials } from '../../types';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { AuthContext, type AuthContextValue } from './AuthContext';

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToAuthChanges((nextUser) => {
      setFirebaseUser(nextUser);
      setLoading(false);
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setError(null);
    try {
      await action();
      return true;
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
      return false;
    }
  }, []);

  const register = useCallback((credentials: Credentials) => run(() => registerWithEmail(credentials)), [run]);
  const login = useCallback((credentials: Credentials) => run(() => loginWithEmail(credentials)), [run]);
  const loginWithGoogle = useCallback(() => run(() => loginWithGoogleProvider()), [run]);
  const logout = useCallback(() => run(() => logoutUser()), [run]);

  const getIdToken = useCallback(async (): Promise<string> => {
    if (!firebaseUser) throw new Error('No hay una sesión activa.');
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  const user = useMemo(() => toAuthUser(firebaseUser), [firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, clearError, register, login, loginWithGoogle, logout, getIdToken }),
    [user, loading, error, clearError, register, login, loginWithGoogle, logout, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
