import { useQuery } from '@tanstack/react-query';
import { obtenerResponsables } from '@/api/expedientes.api';

export function useResponsables() {
  return useQuery({
    queryKey: ['expedientes-responsables'],
    queryFn: obtenerResponsables,
    staleTime: Infinity,
  });
}
