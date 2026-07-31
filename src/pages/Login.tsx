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
        codForm.reset();
        setSetup(null);
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
