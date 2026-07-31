import { exportarExpedientesCsv } from '@/utils/exportarCsv';
import type { ColumnaTabla, ExpedienteResumen } from '@/types/expediente.types';

interface ExportarExcelButtonProps {
  expedientes: ExpedienteResumen[] | undefined;
  columnas: ColumnaTabla[];
}

function IcoDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ExportarExcelButton({ expedientes, columnas }: ExportarExcelButtonProps) {
  const disabled = !expedientes || expedientes.length === 0;

  const handleClick = () => {
    if (!expedientes || expedientes.length === 0) return;
    exportarExpedientesCsv(expedientes, columnas);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? 'No hay trámites para exportar' : 'Descargar los trámites filtrados en Excel'}
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm border border-surface-border bg-surface-panel px-3.5 py-2.5 text-[13px] font-medium text-ink-medium hover:border-accent hover:text-ink-strong disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-surface-border disabled:hover:text-ink-medium"
    >
      <IcoDownload />
      Exportar Excel
    </button>
  );
}
