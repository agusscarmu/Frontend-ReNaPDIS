import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setToken } from '@/api/token';

export interface AuthUser {
  nombre: string;
  iniciales: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, _password: string) => {
        // Sin backend de auth todavía: se simula el login y se guarda un token en memoria.
        await new Promise((resolve) => setTimeout(resolve, 300));
        const nombre = email.split('@')[0] ?? 'Usuario';
        setToken('mock-token');
        set({
          user: { nombre, iniciales: iniciales(nombre), email },
          isAuthenticated: true,
        });
      },
      logout: () => {
        setToken(null);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'renapdis.auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
