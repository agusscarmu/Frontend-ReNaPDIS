import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/auth.handlers';
import { useAuthStore } from '@/store/authStore';
import Login from './Login';

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

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
