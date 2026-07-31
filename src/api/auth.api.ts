import { apiClient } from './client';
import type { AuthenticatedUser, LoginStatus, TotpSetup } from '@/types/auth.types';

export async function login(username: string, password: string): Promise<LoginStatus> {
  const { data } = await apiClient.post<LoginStatus>('/auth/login', { username, password });
  return data;
}

export async function getTotpSetup(): Promise<TotpSetup> {
  const { data } = await apiClient.get<TotpSetup>('/auth/2fa/setup');
  return data;
}

export async function verifyTotp(code: string): Promise<AuthenticatedUser> {
  const { data } = await apiClient.post<AuthenticatedUser>('/auth/2fa/verify', { code });
  return data;
}

export async function getMe(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get<AuthenticatedUser>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
