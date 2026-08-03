# Conexión back/front + Login con QR (OTP) — Diseño

Fecha: 2026-07-31

## Contexto

- **Backend** (`renapdis-backend`, Spring Boot 3.3, Java 21): autenticación por
  **cookie de sesión HttpOnly** (`renapdis_session`), CSRF deshabilitado, CORS con
  credenciales para orígenes permitidos, `SessionCreationPolicy.STATELESS`. Flujo TOTP
  de dos pasos. Solo `/api/auth/me` requiere estar autenticado; el resto es `permitAll`.
  **No existen endpoints de expedientes** (solo `HealthController` y `AuthController`).
- **Frontend** (`renapdis-frontend`, React 18 + Vite + React Query + Zustand): auth
  **mockeada** con Bearer token (`email` en lugar de `username`); expedientes vía **MSW**.
  El proxy `/api` → `:8080` en `vite.config.ts` se activa **solo** cuando MSW está apagado.

### Contrato del backend (auth)

| Método | Ruta | Request | Respuesta |
|--------|------|---------|-----------|
| POST | `/api/auth/login` | `{username, password}` | 202 + cookie sesión + `{sessionStatus}` |
| GET | `/api/auth/2fa/setup` | — (cookie) | `{qrUri, secret}` (solo `PENDING_SETUP`) |
| POST | `/api/auth/2fa/verify` | `{code}` | `{userId, username}` + cookie autenticada |
| GET | `/api/auth/me` | — (cookie) | `{userId, username}` (401 si no hay sesión) |
| POST | `/api/auth/logout` | — (cookie) | 200 |

`sessionStatus ∈ {PENDING_SETUP, PENDING_2FA, AUTHENTICATED}`.
`qrUri` es una URI `otpauth://totp/...`; `secret` es base32 para carga manual.

## Decisiones

1. **Render del QR:** librería en el frontend (`qrcode.react`) desde `qrUri`. El backend
   queda intacto.
2. **Alcance:** solo auth real. Expedientes siguen mockeados con MSW hasta que exista su
   backend.
3. **Verificación:** solo código conectado y type-checked; el usuario prueba el flujo vivo.

## Diseño

### 1. Arquitectura de red (dev)

- Activar el proxy `/api` → `${VITE_BACKEND_URL || http://localhost:8080}` **siempre** en
  `vite.config.ts` (dejar de condicionarlo a MSW).
- MSW registra handlers **solo para `/api/expedientes*`** y usa
  `onUnhandledRequest: 'bypass'`. Las llamadas `/api/auth/*` no interceptadas pasan de
  largo → proxy → backend real. Resultado: **auth real + expedientes mock** conviviendo.
- Axios client (`src/api/client.ts`): agregar `withCredentials: true`; **eliminar** el
  interceptor de `Authorization: Bearer` y el archivo `src/api/token.ts` (ya sin uso).
  La cookie HttpOnly es la única fuente de verdad de la sesión.

### 2. Capa de API de auth

- `src/types/auth.types.ts`:
  - `type SessionStatus = 'PENDING_SETUP' | 'PENDING_2FA' | 'AUTHENTICATED'`
  - `interface LoginStatus { sessionStatus: SessionStatus }`
  - `interface TotpSetup { qrUri: string; secret: string }`
  - `interface AuthenticatedUser { userId: number; username: string }`
- `src/api/auth.api.ts`:
  - `login(username, password): Promise<LoginStatus>`
  - `getTotpSetup(): Promise<TotpSetup>`
  - `verifyTotp(code): Promise<AuthenticatedUser>`
  - `getMe(): Promise<AuthenticatedUser>`
  - `logout(): Promise<void>`

### 3. Store de auth (`src/store/authStore.ts`)

Reescritura para el flujo real (cookie, sin token en JS):

- Estado: `user: AuthUser | null`, `isAuthenticated: boolean`,
  `sessionStatus: SessionStatus | null`, `bootstrapped: boolean`.
- `AuthUser` pasa de `{nombre, iniciales, email}` a `{ nombre, iniciales }` donde
  `nombre = username` e `iniciales` se calculan desde `username`. Se conserva `nombre`
  para no tocar el markup del Header (que lee `user?.nombre` / `user?.iniciales`).
- Acciones:
  - `login(username, password)` → guarda `sessionStatus` del paso 1.
  - `verifyTotp(code)` → setea `user`, `isAuthenticated=true`, `sessionStatus='AUTHENTICATED'`.
  - `logout()` → llama al backend y limpia estado.
  - `bootstrap()` → al montar la app, `getMe()`: si 200 marca autenticado; si 401 limpia.
    Setea `bootstrapped=true` al terminar.
- **Sin `persist`**: la cookie es la fuente de verdad; `bootstrap()` rehidrata la sesión.

### 4. UI de Login multi-paso (`src/pages/Login.tsx`)

Máquina de estados con 3 pasos en la misma página, gobernada por `sessionStatus` local:

1. **Credenciales**: `username` + `password` (schema Zod actualizado: `username` en vez de
   `email`). Al enviar `login()`:
   - `PENDING_SETUP` → paso 2.
   - `PENDING_2FA` → paso 3.
2. **Setup 2FA** (primer alta): `getTotpSetup()`, muestra `<QRCodeCanvas value={qrUri} />`
   + el `secret` en texto (copiable) para carga manual, e input de 6 dígitos → `verifyTotp`.
3. **Verificar 2FA**: input de 6 dígitos → `verifyTotp`. Éxito → `navigate('/', {replace})`.

Errores:
- 401 en `login` → "Usuario o contraseña inválidos".
- 401 en `verify` → "Código inválido".
- 403 (sesión expirada) → mensaje y volver al paso 1.

### 5. Bootstrap de sesión en la app

- `ProtectedRoute` / `App`: mientras `bootstrapped === false`, mostrar un estado de carga
  y no redirigir a `/login` (evita expulsar a un usuario con cookie válida en un refresh).
- `App.tsx` dispara `bootstrap()` una vez al montar.

### 6. Header

- `src/components/layout/Header.tsx`: sigue leyendo `user?.nombre` / `user?.iniciales`
  (sin cambios de markup). `handleLogout` pasa a `await logout()` antes de navegar, ya que
  la acción del store ahora es async (llama al backend).

### 7. Dependencia nueva

- `qrcode.react` en `dependencies` (componente React, render offline en canvas/SVG).

## Fuera de alcance

- Endpoints de expedientes en backend (siguen mockeados).
- Pantallas admin de `register` / `totp/reset`.
- Levantar/probar contra backend vivo.

## Riesgos / notas

- **`sameSite`/`secure` de cookie**: en dev vía proxy Vite es same-origin, así que la
  cookie viaja sin problema. Verificar `app.cookie.same-site`/`secure` en
  `application-dev.yml` (esperado `Lax`/`false` en dev).
- **Tests existentes**: hay `EstadoBadge.test.tsx` y e2e; el cambio de `email`→`username`
  puede requerir tocar tests de login si existen (revisar en implementación).
