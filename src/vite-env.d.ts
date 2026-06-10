/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基址；设置后前端走真实接口，否则用内存 Mock */
  readonly VITE_API_BASE?: string;
  readonly VITE_ORG_ID?: string;
  readonly VITE_USER_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
