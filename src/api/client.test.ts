import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('apiClient baseURL', () => {
  it("usa '/api' por defecto (sin VITE_API_BASE_URL)", async () => {
    vi.resetModules();
    const { apiClient } = await import('./client');
    expect(apiClient.defaults.baseURL).toBe('/api');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('usa VITE_API_BASE_URL cuando está seteada (prod cross-site)', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-host/api');
    vi.resetModules();
    const { apiClient } = await import('./client');
    expect(apiClient.defaults.baseURL).toBe('https://backend-host/api');
  });

  it("cae a '/api' si VITE_API_BASE_URL es string vacío", async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.resetModules();
    const { apiClient } = await import('./client');
    expect(apiClient.defaults.baseURL).toBe('/api');
  });
});
