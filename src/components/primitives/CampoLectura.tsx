interface CampoLecturaProps {
  label: string;
  valor: string | number | boolean | null | undefined;
}

export default function CampoLectura({ label, valor }: CampoLecturaProps) {
  const vacio = valor === null || valor === undefined || valor === '';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <span className="text-sm text-ink-medium">{vacio ? '—' : String(valor)}</span>
    </div>
  );
}
