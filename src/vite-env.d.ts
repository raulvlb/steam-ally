/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STEAM_API_KEY: string;
  readonly VITE_CORS_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
