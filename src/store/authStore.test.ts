import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/auth.handlers';
import { useAuthStore } from './authStore';

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    sessionStatus: null,
    bootstrapped: false,
  });
});

afterEach(() => {
  server.resetHandlers();
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
