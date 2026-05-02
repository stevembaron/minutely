/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional: URL of the Soon weather proxy worker. If unset, the client
   *  calls Pirate Weather directly with the embedded key. See worker/. */
  readonly VITE_API_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
