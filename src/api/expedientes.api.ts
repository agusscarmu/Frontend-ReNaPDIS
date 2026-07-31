import { apiClient } from './client';
import type { Expediente, ExpedienteResumen, FiltrosExpedientes, Metricas } from '@/types/expediente.types';

export async function listarExpedientes(filtros: FiltrosExpedientes = {}): Promise<ExpedienteResumen[]> {
  const { data } = await apiClient.get<ExpedienteResumen[]>('/expedientes', { params: filtros });
  return data;
}

export async function obtenerExpediente(id: string): Promise<Expediente> {
  const { data } = await apiClient.get<Expediente>(`/expedientes/${id}`);
  return data;
}

export async function obtenerMetricas(): Promise<Metricas> {
  const { data } = await apiClient.get<Metricas>('/expedientes/metricas');
  return data;
}

export async function obtenerResponsables(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/expedientes/responsables');
  return data;
}
