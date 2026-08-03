import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportarExcelButton from './ExportarExcelButton';
import { exportarExpedientesExcel } from '@/utils/exportarExcel';
import type { ColumnaTabla, ExpedienteResumen } from '@/types/expediente.types';

vi.mock('@/utils/exportarExcel', () => ({ exportarExpedientesExcel: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const COLUMNAS: ColumnaTabla[] = [{ key: 'expediente', label: 'Expediente', defaultVisible: true }];
const EXPEDIENTES: ExpedienteResumen[] = [
  {
    id: '1',
    expediente: 'EX-2026-00123456-APN-MS',
    nombreEntidad: 'Hospital Test',
    cuitEntidad: '30-11111111-1',
    tipo: 'Recetario',
    estado: 'Aprobado',
    provincia: 'Buenos Aires',
    responsable: 'Ana Pérez',
    ultimaModificacion: '2026-07-01',
    departamento: 'Sistemas',
    telefono: '11-2222-3333',
    email: 'contacto@hospital.test',
    contacto: 'Juan López',
    cuitCuilContacto: '20-22222222-2',
    funcionEnEntidad: 'Director técnico',
    naturalezaEntidad: 'Pública',
    referenteTecnico: 'Marta Ruiz',
    referenteEsSolicitante: true,
  },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('ExportarExcelButton', () => {
  it('deshabilita el botón y muestra "Generando..." mientras exporta', async () => {
    const { promise, resolve } = deferred<{ fallidos: number }>();
    vi.mocked(exportarExpedientesExcel).mockReturnValue(promise);
    render(<ExportarExcelButton expedientes={EXPEDIENTES} columnas={COLUMNAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(screen.getByRole('button', { name: 'Generando...' })).toBeDisabled();

    resolve({ fallidos: 0 });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Excel' })).not.toBeDisabled());
  });

  it('muestra un aviso cuando quedan registros sin detalle de Plataforma', async () => {
    vi.mocked(exportarExpedientesExcel).mockResolvedValue({ fallidos: 2 });
    render(<ExportarExcelButton expedientes={EXPEDIENTES} columnas={COLUMNAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(await screen.findByText('2 registro(s) no se pudieron incluir en el detalle de Plataforma.')).toBeInTheDocument();
  });

  it('no muestra aviso cuando no hay fallidos', async () => {
    vi.mocked(exportarExpedientesExcel).mockResolvedValue({ fallidos: 0 });
    render(<ExportarExcelButton expedientes={EXPEDIENTES} columnas={COLUMNAS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar Excel' })).not.toBeDisabled());
    expect(screen.queryByText(/no se pudieron incluir/)).not.toBeInTheDocument();
  });

  it('el botón queda deshabilitado si no hay expedientes', () => {
    render(<ExportarExcelButton expedientes={[]} columnas={COLUMNAS} />);
    expect(screen.getByRole('button', { name: 'Exportar Excel' })).toBeDisabled();
  });
});
