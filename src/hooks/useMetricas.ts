import { useQuery } from '@tanstack/react-query';
import { obtenerMetricas } from '@/api/expedientes.api';

export function useMetricas() {
  return useQuery({
    queryKey: ['expedientes-metricas'],
    queryFn: obtenerMetricas,
  });
}
