import { createContext } from 'react';
import type { AuthUser, Credentials } from '../../types';

export interface AuthContextValue {
  user: AuthUser | null;
  /** true mientras Firebase restaura la sesión al cargar la app. */
  loading: boolean;
  error: string | null;
  clearError: () => void;
  register: (credentials: Credentials) => Promise<boolean>;
  login: (credentials: Credentials) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  getIdToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
