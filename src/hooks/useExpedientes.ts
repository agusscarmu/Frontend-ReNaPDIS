import { useQuery } from '@tanstack/react-query';
import { listarExpedientes } from '@/api/expedientes.api';
import type { FiltrosExpedientes } from '@/types/expediente.types';

export function useExpedientes(filtros: FiltrosExpedientes) {
  return useQuery({
    queryKey: ['expedientes', filtros],
    queryFn: () => listarExpedientes(filtros),
  });
}
