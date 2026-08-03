# Conexión back/front + Login con QR (OTP) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar el frontend al backend real para el flujo de autenticación TOTP de dos pasos (login → setup/verificación con QR), manteniendo los expedientes mockeados con MSW.

**Architecture:** El backend usa una cookie de sesión HttpOnly (`renapdis_session`); el frontend deja de usar Bearer token y pasa a `withCredentials`. En dev el proxy Vite `/api`→`:8080` queda siempre activo y MSW solo intercepta `/api/expedientes*` (bypass para el resto), de modo que auth va al backend real y expedientes al mock. La sesión se rehidrata al montar la app con `GET /api/auth/me`.

**Tech Stack:** React 18, Vite, TypeScript, Zustand, React Query, react-hook-form + Zod, axios, MSW (tests + expedientes mock), Vitest + Testing Library, `qrcode.react` (nuevo).

## Global Constraints

- No agregar `Co-Authored-By` ni ningún trailer de co-autor en los commits.
- Backend intacto: no se modifican archivos de `renapdis-backend`.
- La cookie de sesión es HttpOnly → **nunca** leer/escribir el token de sesión desde JS.
- Copiar textos de UI en español rioplatense, consistente con el resto de la app.
- Contrato backend fijo (no cambiarlo):
  - `POST /api/auth/login` `{username,password}` → 202 `{sessionStatus}` + cookie
  - `GET /api/auth/2fa/setup` → `{qrUri, secret}` (solo `PENDING_SETUP`)
  - `POST /api/auth/2fa/verify` `{code}` → `{userId, username}` + cookie
  - `GET /api/auth/me` → `{userId, username}` (401 sin sesión)
  - `POST /api/auth/logout` → 200
  - `sessionStatus ∈ {PENDING_SETUP, PENDING_2FA, AUTHENTICATED}`
- Todas las llamadas usan el `apiClient` de axios (baseURL `/api`, `withCredentials: true`).

## File Structure

- `src/api/client.ts` — axios con `withCredentials`, sin interceptor de Bearer. (modificar)
- `src/api/token.ts` — **eliminar** (ya sin uso).
- `src/api/auth.api.ts` — funciones tipadas de auth. (crear)
- `src/types/auth.types.ts` — tipos del contrato de auth. (crear)
- `src/store/authStore.ts` — store reescrito para flujo cookie + bootstrap. (modificar)
- `src/pages/Login.tsx` — UI multi-paso con QR. (modificar)
- `src/pages/Login.test.tsx` — tests del flujo de login. (crear)
- `src/store/authStore.test.ts` — tests del store. (crear)
- `src/api/auth.api.test.ts` — tests del cliente de auth. (crear)
- `src/mocks/auth.handlers.ts` — handlers MSW de auth para **tests**. (crear)
- `src/mocks/handlers.ts` — dejar solo expedientes (ya está así). (sin cambios)
- `src/mocks/browser.ts` — worker con `onUnhandledRequest: 'bypass'` (ya bypass en main). (sin cambios)
- `src/main.tsx` — arrancar MSW siempre en dev con bypass; disparar bootstrap. (modificar)
- `vite.config.ts` — proxy `/api` siempre activo. (modificar)
- `src/routes/ProtectedRoute.tsx` — esperar bootstrap antes de redirigir. (modificar)
- `src/App.tsx` — disparar `bootstrap()` al montar. (modificar)
- `src/components/layout/Header.tsx` — `logout` async. (modificar)
- `e2e/smoke.spec.ts` — actualizar labels/flujo. (modificar)
- `package.json` — agregar `qrcode.react`. (modificar)

---

### Task 1: Plumbing de red (axios cookie + proxy + MSW scope)

**Files:**
- Modify: `src/api/client.ts`
- Delete: `src/api/token.ts`
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `apiClient` (axios instance, baseURL `/api`, `withCredentials: true`) exportado desde `src/api/client.ts`.

- [ ] **Step 1: Reescribir `src/api/client.ts`**

```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});
```

- [ ] **Step 2: Eliminar `src/api/token.ts`**

```bash
git rm src/api/token.ts
```

- [ ] **Step 3: Proxy siempre activo en `vite.config.ts`**

Reemplazar el bloque `server: useMsw ? undefined : {...}` por un proxy incondicional. La variable `useMsw` deja de usarse para el server (MSW se arranca desde `main.tsx`).

```ts
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
```

Si tras el cambio `useMsw` queda sin uso, eliminar la línea `const useMsw = env.VITE_USE_MSW === 'true';`.

- [ ] **Step 4: `src/main.tsx` — MSW con bypass y bootstrap de sesión**

Dejar que MSW arranque cuando `VITE_USE_MSW==='true'` (ya lo hace) con `onUnhandledRequest: 'bypass'` (ya está), de modo que `/api/auth/*` pase al proxy. Antes de renderizar, disparar la rehidratación de sesión.

```ts
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { useAuthStore } from '@/store/authStore';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MSW !== 'true') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking()
  .then(() => useAuthStore.getState().bootstrap())
  .finally(() => {
    createRoot(document.getElementById('root') as HTMLElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
```

Nota: `bootstrap()` se define en la Task 3; hasta entonces `main.tsx` no compilará. Está bien porque las tasks se ejecutan en orden; si se ejecuta esta task aislada, dejar el `.then(() => {})` vacío y completarlo en la Task 3. Preferir ejecutar Task 3 antes de type-check global.

- [ ] **Step 5: Verificar que los tests existentes y el type-check pasan**

Run: `npm run test && npm run type-check`
Expected: los tests de expedientes/EstadoBadge pasan; type-check puede fallar SOLO por `bootstrap` inexistente (se resuelve en Task 3). Si se ejecuta junto a Task 3, todo verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(front): auth por cookie de sesión y proxy /api siempre activo"
```

---

### Task 2: Tipos y cliente de API de auth

**Files:**
- Create: `src/types/auth.types.ts`
- Create: `src/api/auth.api.ts`
- Create: `src/mocks/auth.handlers.ts`
- Create: `src/api/auth.api.test.ts`

**Interfaces:**
- Consumes: `apiClient` de `src/api/client.ts` (Task 1).
- Produces:
  - `src/types/auth.types.ts`: `SessionStatus`, `LoginStatus`, `TotpSetup`, `AuthenticatedUser`.
  - `src/api/auth.api.ts`: `login(username: string, password: string): Promise<LoginStatus>`, `getTotpSetup(): Promise<TotpSetup>`, `verifyTotp(code: string): Promise<AuthenticatedUser>`, `getMe(): Promise<AuthenticatedUser>`, `logout(): Promise<void>`.
  - `src/mocks/auth.handlers.ts`: `authHandlers` (array de handlers MSW), usable con `server.use(...authHandlers)` en tests.

- [ ] **Step 1: Crear `src/types/auth.types.ts`**

```ts
export type SessionStatus = 'PENDING_SETUP' | 'PENDING_2FA' | 'AUTHENTICATED';

export interface LoginStatus {
  sessionStatus: SessionStatus;
}

export interface TotpSetup {
  qrUri: string;
  secret: string;
}

export interface AuthenticatedUser {
  userId: number;
  username: string;
}
```

- [ ] **Step 2: Crear handlers MSW de auth para tests (`src/mocks/auth.handlers.ts`)**

```ts
import { http, HttpResponse } from 'msw';

// Handlers de auth SOLO para tests (vitest). En el navegador, auth va al backend real.
export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.password === 'wrong') {
      return new HttpResponse(null, { status: 401 });
    }
    const sessionStatus = body.username === 'nuevo' ? 'PENDING_SETUP' : 'PENDING_2FA';
    return HttpResponse.json({ sessionStatus }, { status: 202 });
  }),
  http.get('/api/auth/2fa/setup', () =>
    HttpResponse.json({
      qrUri: 'otpauth://totp/RENAPDIS:tester?secret=JBSWY3DPEHPK3PXP&issuer=RENAPDIS',
      secret: 'JBSWY3DPEHPK3PXP',
    })
  ),
  http.post('/api/auth/2fa/verify', async ({ request }) => {
    const body = (await request.json()) as { code: string };
    if (body.code !== '123456') {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json({ userId: 1, username: 'tester' });
  }),
  http.get('/api/auth/me', () => HttpResponse.json({ userId: 1, username: 'tester' })),
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 200 })),
];
```

- [ ] **Step 3: Escribir el test que falla (`src/api/auth.api.test.ts`)**

```ts
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/auth.handlers';
import { login, verifyTotp, getMe, logout, getTotpSetup } from './auth.api';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('auth.api', () => {
  it('login devuelve el sessionStatus', async () => {
    server.use(...authHandlers);
    const res = await login('nuevo', 'ok');
    expect(res.sessionStatus).toBe('PENDING_SETUP');
  });

  it('login con password inválida rechaza', async () => {
    server.use(...authHandlers);
    await expect(login('tester', 'wrong')).rejects.toBeDefined();
  });

  it('getTotpSetup devuelve qrUri y secret', async () => {
    server.use(...authHandlers);
    const res = await getTotpSetup();
    expect(res.qrUri).toContain('otpauth://');
    expect(res.secret).toBeTruthy();
  });

  it('verifyTotp con código correcto devuelve el usuario', async () => {
    server.use(...authHandlers);
    const res = await verifyTotp('123456');
    expect(res.username).toBe('tester');
  });

  it('getMe devuelve el usuario autenticado', async () => {
    server.use(...authHandlers);
    const res = await getMe();
    expect(res.userId).toBe(1);
  });

  it('logout resuelve sin error', async () => {
    server.use(...authHandlers);
    await expect(logout()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 4: Correr el test y verificar que falla**

Run: `npm run test -- src/api/auth.api.test.ts`
Expected: FAIL (no existe `./auth.api`).

- [ ] **Step 5: Implementar `src/api/auth.api.ts`**

```ts
import { apiClient } from './client';
import type { AuthenticatedUser, LoginStatus, TotpSetup } from '@/types/auth.types';

export async function login(username: string, password: string): Promise<LoginStatus> {
  const { data } = await apiClient.post<LoginStatus>('/auth/login', { username, password });
  return data;
}

export async function getTotpSetup(): Promise<TotpSetup> {
  const { data } = await apiClient.get<TotpSetup>('/auth/2fa/setup');
  return data;
}

export async function verifyTotp(code: string): Promise<AuthenticatedUser> {
  const { data } = await apiClient.post<AuthenticatedUser>('/auth/2fa/verify', { code });
  return data;
}

export async function getMe(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get<AuthenticatedUser>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
```

- [ ] **Step 6: Correr el test y verificar que pasa**

Run: `npm run test -- src/api/auth.api.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add src/types/auth.types.ts src/api/auth.api.ts src/mocks/auth.handlers.ts src/api/auth.api.test.ts
git commit -m "feat(front): cliente y tipos de API de auth + handlers MSW de test"
```

---

### Task 3: Store de auth (flujo cookie + bootstrap)

**Files:**
- Modify: `src/store/authStore.ts`
- Create: `src/store/authStore.test.ts`

**Interfaces:**
- Consumes: `login`, `verifyTotp`, `getMe`, `logout` de `src/api/auth.api.ts`; tipos de `src/types/auth.types.ts`.
- Produces: `useAuthStore` con estado `{ user: AuthUser | null; isAuthenticated: boolean; sessionStatus: SessionStatus | null; bootstrapped: boolean }` y acciones `login(username, password): Promise<SessionStatus>`, `verifyTotp(code): Promise<void>`, `logout(): Promise<void>`, `bootstrap(): Promise<void>`. `AuthUser = { nombre: string; iniciales: string }`.

- [ ] **Step 1: Escribir el test que falla (`src/store/authStore.test.ts`)**

```ts
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/auth.handlers';
import { useAuthStore } from './authStore';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    sessionStatus: null,
    bootstrapped: false,
  });
});

describe('authStore', () => {
  it('login guarda el sessionStatus y no autentica todavía', async () => {
    server.use(...authHandlers);
    const status = await useAuthStore.getState().login('tester', 'ok');
    expect(status).toBe('PENDING_2FA');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().sessionStatus).toBe('PENDING_2FA');
  });

  it('verifyTotp autentica y setea el usuario con iniciales', async () => {
    server.use(...authHandlers);
    await useAuthStore.getState().verifyTotp('123456');
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.nombre).toBe('tester');
    expect(user?.iniciales).toBe('T');
  });

  it('bootstrap con sesión válida autentica', async () => {
    server.use(...authHandlers);
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().bootstrapped).toBe(true);
  });

  it('bootstrap sin sesión (401) deja no autenticado pero marca bootstrapped', async () => {
    server.use(...authHandlers);
    const { http, HttpResponse } = await import('msw');
    server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })));
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().bootstrapped).toBe(true);
  });

  it('logout limpia el estado', async () => {
    server.use(...authHandlers);
    await useAuthStore.getState().verifyTotp('123456');
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- src/store/authStore.test.ts`
Expected: FAIL (la firma actual del store no coincide).

- [ ] **Step 3: Reescribir `src/store/authStore.ts`**

```ts
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
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm run test -- src/store/authStore.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Verificar type-check global (main.tsx ya usa `bootstrap`)**

Run: `npm run type-check`
Expected: sin errores relacionados a `bootstrap` (puede quedar error en `Login.tsx`/`Header.tsx` si aún no se actualizaron; se resuelven en Tasks 4-5). Si se ejecuta aislada, ignorar esos dos archivos.

- [ ] **Step 6: Commit**

```bash
git add src/store/authStore.ts src/store/authStore.test.ts
git commit -m "feat(front): store de auth con flujo cookie de dos pasos y bootstrap"
```

---

### Task 4: UI de Login multi-paso con QR

**Files:**
- Modify: `src/pages/Login.tsx`
- Create: `src/pages/Login.test.tsx`
- Modify: `package.json` (dep `qrcode.react`)

**Interfaces:**
- Consumes: `useAuthStore` (Task 3), `getTotpSetup` de `auth.api` (Task 2), `QRCodeSVG` de `qrcode.react`.
- Produces: página `Login` con 3 pasos (`credenciales` → `setup` | `verify`).

- [ ] **Step 1: Instalar `qrcode.react`**

```bash
npm install qrcode.react@^4.2.0
```

Expected: se agrega a `dependencies` en `package.json`.

- [ ] **Step 2: Escribir el test que falla (`src/pages/Login.test.tsx`)**

```tsx
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/auth.handlers';
import { useAuthStore } from '@/store/authStore';
import Login from './Login';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, sessionStatus: null, bootstrapped: true });
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
}

describe('Login', () => {
  it('usuario existente: credenciales -> paso de código 2FA', async () => {
    server.use(...authHandlers);
    renderLogin();
    await userEvent.type(screen.getByLabelText('Usuario'), 'tester');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'ok');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByLabelText('Código de verificación')).toBeInTheDocument();
  });

  it('usuario nuevo: credenciales -> setup con QR y secret', async () => {
    server.use(...authHandlers);
    renderLogin();
    await userEvent.type(screen.getByLabelText('Usuario'), 'nuevo');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'ok');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    expect(screen.getByLabelText('Código de verificación')).toBeInTheDocument();
  });

  it('credenciales inválidas muestran error', async () => {
    server.use(...authHandlers);
    renderLogin();
    await userEvent.type(screen.getByLabelText('Usuario'), 'tester');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Usuario o contraseña inválidos')).toBeInTheDocument();
  });

  it('código correcto autentica', async () => {
    server.use(...authHandlers);
    renderLogin();
    await userEvent.type(screen.getByLabelText('Usuario'), 'tester');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'ok');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    const codigo = await screen.findByLabelText('Código de verificación');
    await userEvent.type(codigo, '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm run test -- src/pages/Login.test.tsx`
Expected: FAIL (la UI actual usa "Email" y no tiene pasos 2FA).

- [ ] **Step 4: Reescribir `src/pages/Login.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getTotpSetup } from '@/api/auth.api';
import type { TotpSetup } from '@/types/auth.types';
import { TEXTOS } from '@/constants/textos';

const credencialesSchema = z.object({
  username: z.string().min(1, 'Ingresá tu usuario'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
type CredencialesForm = z.infer<typeof credencialesSchema>;

const codigoSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
});
type CodigoForm = z.infer<typeof codigoSchema>;

type Paso = 'credenciales' | 'setup' | 'verify';

function statusCode(err: unknown): number | undefined {
  return err instanceof AxiosError ? err.response?.status : undefined;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, verifyTotp } = useAuthStore();

  const [paso, setPaso] = useState<Paso>('credenciales');
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const credForm = useForm<CredencialesForm>({ resolver: zodResolver(credencialesSchema) });
  const codForm = useForm<CodigoForm>({ resolver: zodResolver(codigoSchema) });

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const onCredenciales = async (data: CredencialesForm) => {
    setError(null);
    try {
      const status = await login(data.username, data.password);
      if (status === 'PENDING_SETUP') {
        const s = await getTotpSetup();
        setSetup(s);
        setPaso('setup');
      } else if (status === 'PENDING_2FA') {
        setPaso('verify');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(statusCode(err) === 401 ? 'Usuario o contraseña inválidos' : 'No se pudo iniciar sesión. Intentá nuevamente.');
    }
  };

  const onCodigo = async (data: CodigoForm) => {
    setError(null);
    try {
      await verifyTotp(data.code);
      navigate('/', { replace: true });
    } catch (err) {
      const code = statusCode(err);
      if (code === 401) setError('Código inválido');
      else if (code === 403) {
        setError('La sesión expiró. Volvé a ingresar.');
        setPaso('credenciales');
      } else setError('No se pudo verificar el código. Intentá nuevamente.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-bg px-4">
      <div className="w-full max-w-sm rounded border border-surface-border bg-surface-panel p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[2px] text-ink-medium">{TEXTOS.appNombre}</div>
          <h1 className="text-xl font-bold text-ink-strong">Iniciar sesión</h1>
        </div>

        {paso === 'credenciales' && (
          <form onSubmit={credForm.handleSubmit(onCredenciales)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="mb-1 block text-xs font-medium text-ink-soft">Usuario</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                {...credForm.register('username')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-ink-strong outline-none focus:border-accent"
              />
              {credForm.formState.errors.username && (
                <p className="mt-1 text-xs text-red-600">{credForm.formState.errors.username.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-ink-soft">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...credForm.register('password')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-ink-strong outline-none focus:border-accent"
              />
              {credForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{credForm.formState.errors.password.message}</p>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={credForm.formState.isSubmitting}
              className="mt-2 rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {credForm.formState.isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        )}

        {(paso === 'setup' || paso === 'verify') && (
          <form onSubmit={codForm.handleSubmit(onCodigo)} noValidate className="flex flex-col gap-4">
            {paso === 'setup' && setup && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-center text-xs text-ink-soft">
                  Escaneá este código QR con tu app de autenticación (Google Authenticator, Authy) y luego ingresá el código de 6 dígitos.
                </p>
                <div className="rounded bg-white p-3">
                  <QRCodeSVG value={setup.qrUri} size={176} />
                </div>
                <p className="text-center text-[11px] text-ink-soft">
                  ¿No podés escanear? Cargá esta clave manualmente:
                </p>
                <code className="select-all break-all rounded bg-gray-100 px-2 py-1 text-xs text-ink-strong">
                  {setup.secret}
                </code>
              </div>
            )}
            {paso === 'verify' && (
              <p className="text-center text-xs text-ink-soft">
                Ingresá el código de 6 dígitos de tu app de autenticación.
              </p>
            )}
            <div>
              <label htmlFor="code" className="mb-1 block text-xs font-medium text-ink-soft">Código de verificación</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...codForm.register('code')}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-center text-lg tracking-[8px] text-ink-strong outline-none focus:border-accent"
              />
              {codForm.formState.errors.code && (
                <p className="mt-1 text-xs text-red-600">{codForm.formState.errors.code.message}</p>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={codForm.formState.isSubmitting}
              className="mt-2 rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {codForm.formState.isSubmitting ? 'Verificando…' : 'Verificar'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm run test -- src/pages/Login.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/pages/Login.tsx src/pages/Login.test.tsx package.json package-lock.json
git commit -m "feat(front): login multi-paso con QR para OTP"
```

---

### Task 5: Bootstrap de sesión en la app + Header async

**Files:**
- Modify: `src/routes/ProtectedRoute.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (`isAuthenticated`, `bootstrapped`, `logout`, `bootstrap`).
- Produces: rutas protegidas que esperan `bootstrapped` antes de redirigir; `App` dispara `bootstrap()`; `Header` hace `await logout()`.

- [ ] **Step 1: `ProtectedRoute` espera el bootstrap**

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bg text-sm text-ink-soft">
        Cargando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: `App.tsx` dispara `bootstrap()` al montar**

Redundante con `main.tsx` pero necesario para tests que montan `<App/>` sin pasar por `main.tsx`. `bootstrap` es idempotente.

```tsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '@/routes/AppRoutes';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient();

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    if (!bootstrapped) void bootstrap();
  }, [bootstrap, bootstrapped]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: `Header` con logout async**

Modificar `handleLogout` en `src/components/layout/Header.tsx`:

```tsx
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
```

(El resto del componente y el uso de `user?.nombre` / `user?.iniciales` quedan igual.)

- [ ] **Step 4: Verificar type-check y toda la suite**

Run: `npm run type-check && npm run test`
Expected: type-check sin errores; todos los tests verdes (auth.api, authStore, Login, EstadoBadge, expedientes si existen).

- [ ] **Step 5: Commit**

```bash
git add src/routes/ProtectedRoute.tsx src/App.tsx src/components/layout/Header.tsx
git commit -m "feat(front): rehidratación de sesión al iniciar y logout async"
```

---

### Task 6: Actualizar e2e smoke y build final

**Files:**
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: la nueva UI de login (label "Usuario").
- Produces: e2e alineado con el nuevo flujo.

- [ ] **Step 1: Actualizar `e2e/smoke.spec.ts`**

El segundo test (login → tablero) requiere backend real con usuario válido y 2FA, imposible en un smoke sin backend. Reemplazarlo por una verificación de que la primera pantalla del login (credenciales) renderiza con los nuevos labels y sin violaciones de accesibilidad. El primer test (redirect a /login) se mantiene.

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('redirige a login cuando no hay sesión y la página no tiene violaciones de accesibilidad', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('el formulario de credenciales muestra usuario y contraseña', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('Usuario')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
});
```

- [ ] **Step 2: Verificar el build de producción**

Run: `npm run build`
Expected: `tsc --noEmit` sin errores y build de Vite OK.

- [ ] **Step 3: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "test(front): e2e smoke alineado al nuevo login por usuario"
```

---

## Notas de verificación manual (post-implementación, la hace el usuario)

1. Levantar Postgres + backend (`renapdis-backend`, perfil dev) en `:8080`.
2. Crear un usuario vía `POST /api/auth/register` con header `X-Admin-Key: dev-admin-key`.
3. `npm run dev` en el frontend (con `.env` `VITE_USE_MSW=true` para expedientes mock).
4. Login con el usuario nuevo → debería mostrar el QR → escanear con Google Authenticator → ingresar código → entrar al tablero.
5. Recargar la página estando logueado → debe mantener la sesión (bootstrap `/me`).
6. Logout → vuelve a `/login`.
