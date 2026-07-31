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
