import { create } from 'zustand';
import * as authApi from '@/api/auth.api';
import type { SessionStatus } from '@/types/auth.types';

export interface AuthUser {
  nombre: string;
  iniciales: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionStatus: SessionStatus | null;
  bootstrapped: boolean;
  login: (username: string, password: string) => Promise<SessionStatus>;
  verifyTotp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

function iniciales(nombre: string): string {
  return nombre
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function aUsuario(username: string): AuthUser {
  return { nombre: username, iniciales: iniciales(username) };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  sessionStatus: null,
  bootstrapped: false,

  login: async (username, password) => {
    const { sessionStatus } = await authApi.login(username, password);
    set({ sessionStatus, isAuthenticated: false, user: null });
    return sessionStatus;
  },

  verifyTotp: async (code) => {
    const { username } = await authApi.verifyTotp(code);
    set({ user: aUsuario(username), isAuthenticated: true, sessionStatus: 'AUTHENTICATED' });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false, sessionStatus: null });
    }
  },

  bootstrap: async () => {
    try {
      const { username } = await authApi.getMe();
      set({ user: aUsuario(username), isAuthenticated: true, sessionStatus: 'AUTHENTICATED' });
    } catch {
      set({ user: null, isAuthenticated: false, sessionStatus: null });
    } finally {
      set({ bootstrapped: true });
    }
  },
}));
