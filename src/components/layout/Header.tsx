import { useLocation, useNavigate } from 'react-router-dom';
import { TEXTOS } from '@/constants/textos';
import { useAuthStore } from '@/store/authStore';

function IcoBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IcoGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const enDashboard = location.pathname === '/' || location.pathname.startsWith('/expediente');

  const navItems = [
    { label: 'Dashboard', activo: enDashboard, onClick: () => navigate('/') },
    { label: 'Reportes', activo: false, onClick: null as (() => void) | null },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-[200] flex h-header items-center justify-between gap-8 bg-brand px-8 text-white">
      <div className="shrink-0 cursor-pointer whitespace-nowrap text-[15px] font-bold" onClick={() => navigate('/')}>
        {TEXTOS.appNombre}
      </div>

      <nav className="flex items-center">
        {navItems.map(({ label, activo, onClick }) => (
          <button
            key={label}
            onClick={onClick ?? undefined}
            disabled={!onClick}
            title={!onClick ? 'No disponible en Etapa 1' : undefined}
            className={[
              'h-header whitespace-nowrap border-b-2 border-transparent px-[18px] text-sm transition-colors',
              activo ? 'border-white font-semibold text-white' : 'font-normal text-white/60 hover:text-white/90',
              !onClick ? 'cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <button className="cursor-pointer p-1 leading-none text-white/70 hover:text-white/95 disabled:cursor-not-allowed disabled:opacity-60" disabled title="No disponible en Etapa 1">
          <IcoBell />
        </button>
        <button className="cursor-pointer p-1 leading-none text-white/70 hover:text-white/95 disabled:cursor-not-allowed disabled:opacity-60" disabled title="No disponible en Etapa 1">
          <IcoGear />
        </button>

        <div className="h-7 w-px bg-white/20" />

        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {(user?.iniciales ?? TEXTOS.usuarioIniciales)}
          </div>
          <div className="leading-tight">
            <div className="whitespace-nowrap text-[13px] font-semibold text-white">{user?.nombre ?? TEXTOS.usuarioNombre}</div>
            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap text-[11px] text-white/55 hover:text-white/80"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
