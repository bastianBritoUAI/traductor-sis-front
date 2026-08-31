/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_AD_INSTANCE: string
  readonly VITE_AZURE_AD_CLIENT_ID: string
  readonly VITE_AZURE_AD_TENANT_ID: string
  readonly VITE_SIS_TRADUCTOR_BASE_URL: string
  readonly VITE_SIS_TRADUCTOR_OPENAPI_URL: string
  readonly VITE_API_BASE_URL_REGLAMENTO: string
  readonly VITE_API_OPENAPI_URL_REGLAMENTO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
