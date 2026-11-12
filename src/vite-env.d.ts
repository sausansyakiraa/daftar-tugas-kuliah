/// <reference types="vite/client" />

// Definisi tipe untuk environment variables Vite (import.meta.env)
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

