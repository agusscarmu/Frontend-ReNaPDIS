import { useQuery } from '@tanstack/react-query';
import { obtenerExpediente } from '@/api/expedientes.api';

export function useExpediente(id: string | undefined) {
  return useQuery({
    queryKey: ['expediente', id],
    queryFn: () => obtenerExpediente(id as string),
    enabled: Boolean(id),
  });
}
