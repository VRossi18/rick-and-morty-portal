/// <reference types="vite/client" />

interface ImportMetaEnv {
   readonly VITE_DONATION_CONTRACT_ADDRESS?: string;
   readonly VITE_POLYGON_RPC_URL?: string;
   readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
   readonly VITE_AI_API_URL?: string;
   readonly VITE_AI_EPISODE_API_URL?: string;
}

interface ImportMeta {
   readonly env: ImportMetaEnv;
}
