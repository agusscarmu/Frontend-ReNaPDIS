import { describe, it, expect, afterEach } from 'vitest';
import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/auth.handlers';
import { login, verifyTotp, getMe, logout, getTotpSetup } from './auth.api';

afterEach(() => server.resetHandlers());

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
