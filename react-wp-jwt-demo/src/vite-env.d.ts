/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WP_BASE_URL?: string
  readonly VITE_WP_API_NAMESPACE?: string
  readonly VITE_WP_JWT_NAMESPACE?: string
  readonly VITE_WP_JWT_TOKEN_ENDPOINT?: string
  readonly VITE_WP_JWT_REFRESH_ENDPOINT?: string
  readonly VITE_WP_JWT_VERIFY_ENDPOINT?: string
  readonly VITE_WP_JWT_LOGOUT_ENDPOINT?: string
  readonly VITE_DEBUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}