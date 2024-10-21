/// <reference types="vite/client" />

declare const APP_VERSION: string
declare const BUILD_COMMIT: string
declare const BUILD_DATETIME: number

interface ImportMetaEnv {
  VITE_NETWORK: string
  VITE_WEB3_GATEWAY: string
  VITE_MESSAGE_BOX_ADDR: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
