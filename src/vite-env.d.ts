/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base absoluta del backend en prod cross-site (p. ej. https://backend-host/api). Sin setear, se usa '/api' (proxy de Vite en dev). */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_USE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
