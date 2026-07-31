import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

function IcoHome() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const navigate = useNavigate();
  return (
    <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-ink-soft" aria-label="Ruta de navegación">
      <span className="inline-flex text-ink-medium">
        <IcoHome />
      </span>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="text-ink-faint">/</span>
          {it.to ? (
            <button className="border-none bg-transparent p-0 font-medium text-ink-medium hover:text-accent" onClick={() => navigate(it.to as string)}>
              {it.label}
            </button>
          ) : (
            <span className="font-semibold text-accent">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
