export const PORT = Number(process.env.PORT ?? 8080);

export function shouldServeStatic(): boolean {
   return process.env.SERVE_STATIC?.trim().toLowerCase() === 'true';
}

const LOCAL_LLM_DUMMY_KEY = 'ollama';

export function getLlmBaseUrl(): string {
   return process.env.LLM_BASE_URL?.trim() || 'https://api.groq.com/openai/v1';
}

export function getLlmModel(): string {
   return process.env.LLM_MODEL?.trim() || 'llama-3.3-70b-versatile';
}

const DEFAULT_LLM_TOOL_MAX_STEPS = 5;

export function isLlmToolsEnabled(): boolean {
   const raw = process.env.LLM_TOOLS_ENABLED?.trim().toLowerCase();
   if (!raw) {
      return false;
   }
   return raw === 'true' || raw === '1' || raw === 'yes';
}

export function getLlmToolMaxSteps(): number {
   const parsed = Number(process.env.LLM_TOOL_MAX_STEPS);
   if (!Number.isFinite(parsed) || parsed < 1) {
      return DEFAULT_LLM_TOOL_MAX_STEPS;
   }
   return Math.floor(parsed);
}

export const CACHE_TTL_MS = 60 * 60 * 1000;

export function isLocalLlmEndpoint(url?: string): boolean {
   const value = (url ?? getLlmBaseUrl()).trim();
   try {
      const { hostname } = new URL(value);
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'ollama';
   } catch {
      return false;
   }
}

export function resolveLlmApiKey(): string | null {
   const key = process.env.LLM_API_KEY?.trim();
   if (key) {
      return key;
   }
   if (isLocalLlmEndpoint()) {
      return LOCAL_LLM_DUMMY_KEY;
   }
   return null;
}

export function isLlmConfigured(): boolean {
   return resolveLlmApiKey() !== null;
}

export function getLlmApiKey(): string | null {
   return resolveLlmApiKey();
}

export function getAllowedOrigins(): string[] {
   const raw = process.env.ALLOWED_ORIGINS?.trim();
   if (!raw) {
      return [];
   }
   return raw
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
   const normalized = origin.trim().replace(/\/$/, '');
   return allowedOrigins.some((allowed) => allowed === normalized);
}
