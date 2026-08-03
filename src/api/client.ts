import axios from 'axios';

// En dev se usa '/api' (proxy de Vite). En prod cross-site (front y back en hosts
// distintos) hay que apuntar al backend absoluto vía VITE_API_BASE_URL, p. ej.
// https://backend-host/api. `||` cubre también el caso de string vacío.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 10000,
});
